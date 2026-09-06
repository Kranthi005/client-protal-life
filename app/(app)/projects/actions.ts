"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PROJECT_STATUSES,
  type Profile,
  type ProjectStatus,
} from "@/lib/supabase/types";

type ProjectInput = {
  name: string;
  description: string | null;
  client_name: string | null;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  due_date: string | null;
};

const projectStatusSet = new Set<string>(PROJECT_STATUSES);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function destination(path: string, message: string) {
  return `${path}?message=${encodeURIComponent(message)}`;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function isValidDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function readProjectInput(
  formData: FormData,
): ProjectInput | { error: string } {
  const name = nullableText(formData.get("name"));
  const description = nullableText(formData.get("description"));
  const clientName = nullableText(formData.get("client_name"));
  const status = String(formData.get("status") ?? "");
  const progressText = String(formData.get("progress") ?? "").trim();
  const startDate = nullableText(formData.get("start_date"));
  const dueDate = nullableText(formData.get("due_date"));

  if (!name || name.length > 160)
    return { error: "Enter a project name of 160 characters or fewer." };
  if (description && description.length > 5_000)
    return { error: "Keep the description to 5,000 characters or fewer." };
  if (clientName && clientName.length > 160)
    return { error: "Keep the client name to 160 characters or fewer." };
  if (!projectStatusSet.has(status))
    return { error: "Choose a valid project status." };
  if (!/^\d{1,3}$/.test(progressText))
    return { error: "Progress must be a whole number from 0 to 100." };

  const progress = Number(progressText);
  if (progress < 0 || progress > 100)
    return { error: "Progress must be between 0 and 100." };
  if (startDate && !isValidDate(startDate))
    return { error: "Enter a valid start date." };
  if (dueDate && !isValidDate(dueDate))
    return { error: "Enter a valid due date." };
  if (startDate && dueDate && dueDate < startDate)
    return { error: "The due date cannot be before the start date." };

  return {
    name,
    description,
    client_name: clientName,
    status: status as ProjectStatus,
    progress,
    start_date: startDate,
    due_date: dueDate,
  };
}

async function requireServiceProvider() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (error || profile?.role !== "SERVICE_PROVIDER") {
    redirect(
      destination("/projects", "Only service providers can manage projects."),
    );
  }

  return { supabase, user, profile };
}

export async function createProject(formData: FormData) {
  const input = readProjectInput(formData);

  if ("error" in input) {
    redirect(destination("/projects/new", input.error));
  }

  const { supabase, user, profile } = await requireServiceProvider();

  const { data: existingOrganization, error: organizationLookupError } =
    await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();

  if (organizationLookupError) {
    redirect(
      destination(
        "/projects/new",
        "We could not load your workspace. Please try again.",
      ),
    );
  }

  let organizationId = existingOrganization?.id;

  if (!organizationId) {
    const workspaceOwner =
      profile.full_name || user.email?.split("@")[0] || "NEXUS";

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .insert({
        name: `${workspaceOwner}'s workspace`,
        owner_id: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (organizationError || !organization) {
      redirect(
        destination(
          "/projects/new",
          "We could not create your workspace. Please try again.",
        ),
      );
    }

    organizationId = organization.id;
  }

  const projectId = crypto.randomUUID();

  const { error } = await supabase.from("projects").insert({
    id: projectId,
    ...input,
    organization_id: organizationId,
  });

  if (error) {
    console.error("NEXUS createProject failed", {
      userId: user.id,
      role: profile.role,
      organizationId,
      error,
      projectId,
    });

    redirect(
      destination(
        "/projects/new",
        "We could not create the project. Please try again.",
      ),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");

  redirect(`/projects/${projectId}`);
}

export async function updateProject(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  if (!uuidPattern.test(projectId))
    redirect(destination("/projects", "Invalid project."));

  const input = readProjectInput(formData);
  if ("error" in input)
    redirect(destination(`/projects/${projectId}/edit`, input.error));

  const { supabase } = await requireServiceProvider();
  const { data: project, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !project) {
    redirect(
      destination(
        `/projects/${projectId}`,
        "We could not update that project. Please try again.",
      ),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
