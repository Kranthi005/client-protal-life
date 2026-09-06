import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateProjectIntelligence,
  type ProjectIntelligenceInput,
} from "@/lib/ai/project-intelligence";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, status, progress, start_date, due_date")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const [
    tasksResult,
    milestonesResult,
    deliverablesResult,
    feedbackResult,
    activitiesResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, status, priority, due_date")
      .eq("project_id", projectId),

    supabase
      .from("milestones")
      .select("title, status, due_date")
      .eq("project_id", projectId),

    supabase
      .from("deliverables")
      .select("title, status")
      .eq("project_id", projectId),

    supabase
      .from("feedback")
      .select("message, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("activities")
      .select("type, title, description, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (
    tasksResult.error ||
    milestonesResult.error ||
    deliverablesResult.error ||
    feedbackResult.error ||
    activitiesResult.error
  ) {
    return NextResponse.json(
      { error: "Could not load project intelligence data." },
      { status: 500 },
    );
  }

  const input: ProjectIntelligenceInput = {
    project,
    tasks: tasksResult.data ?? [],
    milestones: milestonesResult.data ?? [],
    deliverables: deliverablesResult.data ?? [],
    feedback: feedbackResult.data ?? [],
    activities: activitiesResult.data ?? [],
  };

  try {
    const intelligence = await generateProjectIntelligence(input);

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("NEXUS project intelligence failed", error);

    return NextResponse.json(
      { error: "AI project analysis failed." },
      { status: 500 },
    );
  }
}
