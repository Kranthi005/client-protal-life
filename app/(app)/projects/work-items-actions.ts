"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MILESTONE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type MilestoneStatus,
  type Profile,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/supabase/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskStatusSet = new Set<string>(TASK_STATUSES);
const taskPrioritySet = new Set<string>(TASK_PRIORITIES);
const milestoneStatusSet = new Set<string>(MILESTONE_STATUSES);

type TaskInput = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
};

type MilestoneInput = {
  title: string;
  description: string | null;
  due_date: string | null;
};

function destination(projectId: string, message: string) {
  return `/projects/${projectId}?message=${encodeURIComponent(message)}`;
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

function projectIdFrom(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  return uuidPattern.test(projectId) ? projectId : null;
}

function itemIdFrom(formData: FormData, field: "task_id" | "milestone_id") {
  const itemId = String(formData.get(field) ?? "");
  return uuidPattern.test(itemId) ? itemId : null;
}

function readTaskInput(formData: FormData): TaskInput | { error: string } {
  const title = nullableText(formData.get("title"));
  const description = nullableText(formData.get("description"));
  const priority = String(formData.get("priority") ?? "");
  const dueDate = nullableText(formData.get("due_date"));

  if (!title || title.length > 160) {
    return { error: "Enter a task title of 160 characters or fewer." };
  }
  if (description && description.length > 5_000) {
    return { error: "Keep the task description to 5,000 characters or fewer." };
  }
  if (!taskPrioritySet.has(priority)) {
    return { error: "Choose a valid task priority." };
  }
  if (dueDate && !isValidDate(dueDate)) {
    return { error: "Enter a valid task due date." };
  }

  return {
    title,
    description,
    priority: priority as TaskPriority,
    due_date: dueDate,
  };
}

function readMilestoneInput(
  formData: FormData,
): MilestoneInput | { error: string } {
  const title = nullableText(formData.get("title"));
  const description = nullableText(formData.get("description"));
  const dueDate = nullableText(formData.get("due_date"));

  if (!title || title.length > 160) {
    return { error: "Enter a milestone title of 160 characters or fewer." };
  }
  if (description && description.length > 5_000) {
    return {
      error: "Keep the milestone description to 5,000 characters or fewer.",
    };
  }
  if (dueDate && !isValidDate(dueDate)) {
    return { error: "Enter a valid milestone due date." };
  }

  return { title, description, due_date: dueDate };
}

async function requireServiceProvider(projectId: string) {
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

  if (error || profile?.role !== "SERVICE_PROVIDER") {
    redirect(
      destination(
        projectId,
        "Only service providers can manage tasks and milestones.",
      ),
    );
  }

  return supabase;
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
}

export async function createTask(formData: FormData) {
  const projectId = projectIdFrom(formData);
  if (!projectId) {
    redirect("/projects");
  }

  const input = readTaskInput(formData);
  if ("error" in input) {
    redirect(destination(projectId, input.error));
  }

  const supabase = await requireServiceProvider(projectId);
  const { error } = await supabase.from("tasks").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    ...input,
    status: "TODO",
  });

  if (error) {
    console.error("NEXUS createTask failed", { projectId, error });
    redirect(destination(projectId, "We could not create the task. Please try again."));
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function updateTaskStatus(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const taskId = itemIdFrom(formData, "task_id");
  if (!projectId || !taskId) {
    redirect("/projects");
  }

  const status = String(formData.get("status") ?? "");
  if (!taskStatusSet.has(status)) {
    redirect(destination(projectId, "Choose a valid task status."));
  }

  const supabase = await requireServiceProvider(projectId);
  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status: status as TaskStatus })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !task) {
    console.error("NEXUS updateTaskStatus failed", { projectId, taskId, error });
    redirect(destination(projectId, "We could not update the task. Please try again."));
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function deleteTask(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const taskId = itemIdFrom(formData, "task_id");
  if (!projectId || !taskId) {
    redirect("/projects");
  }

  const supabase = await requireServiceProvider(projectId);
  const { data: task, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !task) {
    console.error("NEXUS deleteTask failed", { projectId, taskId, error });
    redirect(destination(projectId, "We could not delete the task. Please try again."));
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function createMilestone(formData: FormData) {
  const projectId = projectIdFrom(formData);
  if (!projectId) {
    redirect("/projects");
  }

  const input = readMilestoneInput(formData);
  if ("error" in input) {
    redirect(destination(projectId, input.error));
  }

  const supabase = await requireServiceProvider(projectId);
  const { error } = await supabase.from("milestones").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    ...input,
    status: "PLANNED",
  });

  if (error) {
    console.error("NEXUS createMilestone failed", { projectId, error });
    redirect(
      destination(projectId, "We could not create the milestone. Please try again."),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function updateMilestoneStatus(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const milestoneId = itemIdFrom(formData, "milestone_id");
  if (!projectId || !milestoneId) {
    redirect("/projects");
  }

  const status = String(formData.get("status") ?? "");
  if (!milestoneStatusSet.has(status)) {
    redirect(destination(projectId, "Choose a valid milestone status."));
  }

  const supabase = await requireServiceProvider(projectId);
  const { data: milestone, error } = await supabase
    .from("milestones")
    .update({ status: status as MilestoneStatus })
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !milestone) {
    console.error("NEXUS updateMilestoneStatus failed", {
      projectId,
      milestoneId,
      error,
    });
    redirect(
      destination(projectId, "We could not update the milestone. Please try again."),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function deleteMilestone(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const milestoneId = itemIdFrom(formData, "milestone_id");
  if (!projectId || !milestoneId) {
    redirect("/projects");
  }

  const supabase = await requireServiceProvider(projectId);
  const { data: milestone, error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !milestone) {
    console.error("NEXUS deleteMilestone failed", {
      projectId,
      milestoneId,
      error,
    });
    redirect(
      destination(projectId, "We could not delete the milestone. Please try again."),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}
