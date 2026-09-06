"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function projectIdFrom(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  return uuidPattern.test(projectId) ? projectId : null;
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get("notification_id") ?? "");

  if (!uuidPattern.test(notificationId)) {
    return;
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("NEXUS markNotificationRead failed", {
      notificationId,
      error,
    });

    return;
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("NEXUS markAllNotificationsRead failed", {
      error,
    });

    return;
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function createActivity({
  projectId,
  type,
  title,
  description,
  metadata = {},
  notifyUsers = [],
}: {
  projectId: string;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  notifyUsers?: string[];
}) {
  if (!uuidPattern.test(projectId)) {
    throw new Error("Invalid project ID.");
  }

  const { supabase, user } = await requireUser();

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      id: crypto.randomUUID(),
      project_id: projectId,
      actor_id: user.id,
      type,
      title,
      description: description ?? null,
      metadata,
    })
    .select(
      "id, project_id, actor_id, type, title, description, metadata, created_at",
    )
    .single();

  if (activityError || !activity) {
    console.error("NEXUS createActivity failed", {
      projectId,
      type,
      error: activityError,
    });

    throw new Error("Could not create activity.");
  }

  const recipients = [...new Set(notifyUsers)].filter(
    (userId) => userId !== user.id && uuidPattern.test(userId),
  );

  if (recipients.length > 0) {
    const notifications = recipients.map((userId) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      project_id: projectId,
      activity_id: activity.id,
      title,
      message:
        description?.trim() || "There is a new update on one of your projects.",
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("NEXUS createActivity notification failed", {
        projectId,
        activityId: activity.id,
        error: notificationError,
      });
    }
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");

  return activity;
}

export async function createProjectActivity(formData: FormData) {
  const projectId = projectIdFrom(formData);

  if (!projectId) {
    redirect("/projects");
  }

  const type = String(formData.get("type") ?? "UPDATE").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || title.length > 200) {
    redirect(
      `/projects/${projectId}?message=${encodeURIComponent(
        "Activity title is required.",
      )}`,
    );
  }

  if (description.length > 5_000) {
    redirect(
      `/projects/${projectId}?message=${encodeURIComponent(
        "Activity description is too long.",
      )}`,
    );
  }

  await createActivity({
    projectId,
    type,
    title,
    description: description || null,
  });

  redirect(`/projects/${projectId}`);
}
