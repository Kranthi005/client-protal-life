"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const approvalStatuses = new Set(["APPROVED", "CHANGES_REQUESTED"]);

function projectIdFrom(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  return uuidPattern.test(projectId) ? projectId : null;
}

function deliverableIdFrom(formData: FormData) {
  const deliverableId = String(formData.get("deliverable_id") ?? "");
  return uuidPattern.test(deliverableId) ? deliverableId : null;
}

function approvalIdFrom(formData: FormData) {
  const approvalId = String(formData.get("approval_id") ?? "");
  return uuidPattern.test(approvalId) ? approvalId : null;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function destination(projectId: string, message: string) {
  return `/projects/${projectId}?message=${encodeURIComponent(message)}`;
}

async function requireUser(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (error || !profile) {
    redirect(destination(projectId, "We could not verify your account."));
  }

  return { supabase, user, profile };
}

async function requireServiceProvider(projectId: string) {
  const result = await requireUser(projectId);

  if (result.profile.role !== "SERVICE_PROVIDER") {
    redirect(
      destination(projectId, "Only service providers can request approvals."),
    );
  }

  return result;
}

export async function createFeedback(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const deliverableId = deliverableIdFrom(formData);
  const message = nullableText(formData.get("message"));

  if (!projectId) {
    redirect("/projects");
  }

  if (!message || message.length > 5_000) {
    redirect(
      destination(projectId, "Enter feedback between 1 and 5,000 characters."),
    );
  }

  const { supabase, user } = await requireUser(projectId);

  if (deliverableId) {
    const { data: deliverable, error } = await supabase
      .from("deliverables")
      .select("id")
      .eq("id", deliverableId)
      .eq("project_id", projectId)
      .maybeSingle<{ id: string }>();

    if (error || !deliverable) {
      redirect(
        destination(
          projectId,
          "The selected deliverable does not belong to this project.",
        ),
      );
    }
  }

  const { error } = await supabase.from("feedback").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    deliverable_id: deliverableId || null,
    author_id: user.id,
    message,
  });

  if (error) {
    console.error("NEXUS createFeedback failed", {
      projectId,
      deliverableId,
      error,
    });

    redirect(destination(projectId, "We could not save your feedback."));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function requestApproval(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const deliverableId = deliverableIdFrom(formData);

  if (!projectId || !deliverableId) {
    redirect("/projects");
  }

  const { supabase, user } = await requireServiceProvider(projectId);

  const { data: deliverable, error: deliverableError } = await supabase
    .from("deliverables")
    .select("id")
    .eq("id", deliverableId)
    .eq("project_id", projectId)
    .maybeSingle<{ id: string }>();

  if (deliverableError || !deliverable) {
    redirect(
      destination(
        projectId,
        "The selected deliverable does not belong to this project.",
      ),
    );
  }

  const { data: existingApproval } = await supabase
    .from("approvals")
    .select("id")
    .eq("deliverable_id", deliverableId)
    .eq("status", "PENDING")
    .maybeSingle<{ id: string }>();

  if (existingApproval) {
    redirect(
      destination(
        projectId,
        "This deliverable already has a pending approval request.",
      ),
    );
  }

  const { error } = await supabase.from("approvals").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    deliverable_id: deliverableId,
    requested_by: user.id,
    status: "PENDING",
  });

  if (error) {
    console.error("NEXUS requestApproval failed", {
      projectId,
      deliverableId,
      error,
    });

    redirect(destination(projectId, "We could not request approval."));
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function reviewApproval(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const approvalId = approvalIdFrom(formData);
  const status = String(formData.get("status") ?? "");
  const comment = nullableText(formData.get("comment"));

  if (!projectId || !approvalId) {
    redirect("/projects");
  }

  if (!approvalStatuses.has(status)) {
    redirect(destination(projectId, "Choose a valid approval decision."));
  }

  if (comment && comment.length > 5_000) {
    redirect(
      destination(
        projectId,
        "Keep the approval comment to 5,000 characters or fewer.",
      ),
    );
  }

  const { supabase, user } = await requireUser(projectId);

  const { data: approval, error: approvalError } = await supabase
    .from("approvals")
    .select("id, deliverable_id, status")
    .eq("id", approvalId)
    .eq("project_id", projectId)
    .maybeSingle<{
      id: string;
      deliverable_id: string;
      status: string;
    }>();

  if (approvalError || !approval) {
    redirect(
      destination(projectId, "We could not find that approval request."),
    );
  }

  if (approval.status !== "PENDING") {
    redirect(
      destination(
        projectId,
        "This approval request has already been reviewed.",
      ),
    );
  }

  const { error } = await supabase
    .from("approvals")
    .update({
      status,
      comment,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("project_id", projectId);

  if (error) {
    console.error("NEXUS reviewApproval failed", {
      projectId,
      approvalId,
      error,
    });

    redirect(
      destination(projectId, "We could not save the approval decision."),
    );
  }

  if (status === "APPROVED") {
    await supabase
      .from("deliverables")
      .update({ status: "APPROVED" })
      .eq("id", approval.deliverable_id)
      .eq("project_id", projectId);
  }

  if (status === "CHANGES_REQUESTED") {
    await supabase
      .from("deliverables")
      .update({ status: "IN_REVIEW" })
      .eq("id", approval.deliverable_id)
      .eq("project_id", projectId);
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
