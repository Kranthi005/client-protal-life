"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DeliverableStatus, Profile } from "@/lib/supabase/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const deliverableStatuses = new Set<string>(["DRAFT", "IN_REVIEW", "APPROVED"]);

function destination(projectId: string, message: string) {
  return `/projects/${projectId}?message=${encodeURIComponent(message)}`;
}

function projectIdFrom(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  return uuidPattern.test(projectId) ? projectId : null;
}

function fileIdFrom(formData: FormData) {
  const fileId = String(formData.get("file_id") ?? "");
  return uuidPattern.test(fileId) ? fileId : null;
}

function deliverableIdFrom(formData: FormData) {
  const id = String(formData.get("deliverable_id") ?? "");
  return uuidPattern.test(id) ? id : null;
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
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
        "Only service providers can manage project files and deliverables.",
      ),
    );
  }

  return { supabase, user };
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
}

export async function uploadProjectFile(formData: FormData) {
  const projectId = projectIdFrom(formData);

  if (!projectId) {
    redirect("/projects");
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(destination(projectId, "Choose a file to upload."));
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    redirect(destination(projectId, "Files must be 10 MB or smaller."));
  }

  const { supabase, user } = await requireServiceProvider(projectId);

  const originalName = file.name.trim();

  if (!originalName) {
    redirect(destination(projectId, "The selected file has no valid name."));
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 150);

  const storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("NEXUS uploadProjectFile storage failed", {
      projectId,
      uploadError,
    });

    redirect(
      destination(
        projectId,
        "We could not upload the file. Please check the project storage setup.",
      ),
    );
  }

  const { error: databaseError } = await supabase.from("project_files").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    name: originalName,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user.id,
  });

  if (databaseError) {
    console.error("NEXUS uploadProjectFile database failed", {
      projectId,
      databaseError,
    });

    await supabase.storage.from("project-files").remove([storagePath]);

    redirect(
      destination(
        projectId,
        "The file uploaded but could not be saved. Please try again.",
      ),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function deleteProjectFile(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const fileId = fileIdFrom(formData);

  if (!projectId || !fileId) {
    redirect("/projects");
  }

  const { supabase } = await requireServiceProvider(projectId);

  const { data: projectFile, error: lookupError } = await supabase
    .from("project_files")
    .select("id, storage_path")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle<{ id: string; storage_path: string }>();

  if (lookupError || !projectFile) {
    redirect(destination(projectId, "We could not find that file."));
  }

  const { error: storageError } = await supabase.storage
    .from("project-files")
    .remove([projectFile.storage_path]);

  if (storageError) {
    console.error("NEXUS deleteProjectFile storage failed", {
      projectId,
      fileId,
      storageError,
    });
  }

  const { error: databaseError } = await supabase
    .from("project_files")
    .delete()
    .eq("id", fileId)
    .eq("project_id", projectId);

  if (databaseError) {
    console.error("NEXUS deleteProjectFile database failed", {
      projectId,
      fileId,
      databaseError,
    });

    redirect(
      destination(projectId, "We could not delete the file. Please try again."),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function createDeliverable(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const title = nullableText(formData.get("title"));
  const description = nullableText(formData.get("description"));
  const fileIdValue = nullableText(formData.get("file_id"));

  if (!projectId) {
    redirect("/projects");
  }

  if (!title || title.length > 160) {
    redirect(
      destination(
        projectId,
        "Enter a deliverable title of 160 characters or fewer.",
      ),
    );
  }

  if (description && description.length > 5_000) {
    redirect(
      destination(
        projectId,
        "Keep the deliverable description to 5,000 characters or fewer.",
      ),
    );
  }

  if (fileIdValue && !uuidPattern.test(fileIdValue)) {
    redirect(destination(projectId, "Choose a valid file."));
  }

  const { supabase } = await requireServiceProvider(projectId);

  if (fileIdValue) {
    const { data: file, error: fileError } = await supabase
      .from("project_files")
      .select("id")
      .eq("id", fileIdValue)
      .eq("project_id", projectId)
      .maybeSingle<{ id: string }>();

    if (fileError || !file) {
      redirect(
        destination(
          projectId,
          "The selected file does not belong to this project.",
        ),
      );
    }
  }

  const { error } = await supabase.from("deliverables").insert({
    id: crypto.randomUUID(),
    project_id: projectId,
    file_id: fileIdValue || null,
    title,
    description,
    status: "DRAFT",
  });

  if (error) {
    console.error("NEXUS createDeliverable failed", {
      projectId,
      error,
    });

    redirect(destination(projectId, "We could not create the deliverable."));
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function updateDeliverableStatus(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const deliverableId = deliverableIdFrom(formData);
  const status = String(formData.get("status") ?? "");

  if (!projectId || !deliverableId) {
    redirect("/projects");
  }

  if (!deliverableStatuses.has(status)) {
    redirect(destination(projectId, "Choose a valid deliverable status."));
  }

  const { supabase } = await requireServiceProvider(projectId);

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .update({
      status: status as DeliverableStatus,
    })
    .eq("id", deliverableId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !deliverable) {
    console.error("NEXUS updateDeliverableStatus failed", {
      projectId,
      deliverableId,
      error,
    });

    redirect(
      destination(projectId, "We could not update the deliverable status."),
    );
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}

export async function deleteDeliverable(formData: FormData) {
  const projectId = projectIdFrom(formData);
  const deliverableId = deliverableIdFrom(formData);

  if (!projectId || !deliverableId) {
    redirect("/projects");
  }

  const { supabase } = await requireServiceProvider(projectId);

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .delete()
    .eq("id", deliverableId)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !deliverable) {
    console.error("NEXUS deleteDeliverable failed", {
      projectId,
      deliverableId,
      error,
    });

    redirect(destination(projectId, "We could not delete the deliverable."));
  }

  revalidateProject(projectId);
  redirect(`/projects/${projectId}`);
}
