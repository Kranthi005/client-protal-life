export type ProjectIntelligenceInput = {
  project: {
    name: string;
    description: string | null;
    status: string;
    progress: number;
    start_date: string | null;
    due_date: string | null;
  };
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
  }>;
  milestones: Array<{
    title: string;
    status: string;
    due_date: string | null;
  }>;
  deliverables: Array<{
    title: string;
    status: string;
  }>;
  feedback: Array<{
    message: string;
    created_at: string;
  }>;
  activities: Array<{
    type: string;
    title: string;
    description: string | null;
    created_at: string;
  }>;
};

export type ProjectIntelligence = {
  summary: string;
  health_score: number;
  health_label: "ON_TRACK" | "AT_RISK" | "BLOCKED";
  risks: string[];
  next_action: string;
};

export async function generateProjectIntelligence(
  input: ProjectIntelligenceInput,
): Promise<ProjectIntelligence> {
  const { project, tasks, milestones, deliverables, feedback } = input;

  let score = 100;
  const risks: string[] = [];

  const blockedTasks = tasks.filter((task) => task.status === "BLOCKED");

  const highPriorityOpenTasks = tasks.filter(
    (task) => task.priority === "HIGH" && task.status !== "DONE",
  );

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "DONE") {
      return false;
    }

    return new Date(task.due_date) < new Date();
  });

  const incompleteMilestones = milestones.filter(
    (milestone) => milestone.status !== "COMPLETED",
  );

  const pendingDeliverables = deliverables.filter(
    (deliverable) => deliverable.status !== "APPROVED",
  );

  const changesRequested = feedback.filter((item) =>
    item.message.toLowerCase().includes("change"),
  );

  if (blockedTasks.length > 0) {
    score -= Math.min(30, blockedTasks.length * 15);

    risks.push(
      `${blockedTasks.length} task${blockedTasks.length > 1 ? "s are" : " is"} currently blocked.`,
    );
  }

  if (overdueTasks.length > 0) {
    score -= Math.min(20, overdueTasks.length * 10);

    risks.push(
      `${overdueTasks.length} incomplete task${overdueTasks.length > 1 ? "s are" : " is"} past the due date.`,
    );
  }

  if (highPriorityOpenTasks.length > 0) {
    score -= Math.min(15, highPriorityOpenTasks.length * 5);

    risks.push(
      `${highPriorityOpenTasks.length} high-priority task${highPriorityOpenTasks.length > 1 ? "s remain" : " remains"} open.`,
    );
  }

  if (pendingDeliverables.length > 0) {
    score -= Math.min(10, pendingDeliverables.length * 3);

    risks.push(
      `${pendingDeliverables.length} deliverable${pendingDeliverables.length > 1 ? "s are" : " is"} not yet approved.`,
    );
  }

  if (changesRequested.length > 0) {
    score -= 5;

    risks.push(
      "Recent feedback may require changes before delivery can be finalized.",
    );
  }

  if (project.progress < 25 && project.status === "IN_PROGRESS") {
    score -= 5;

    risks.push(
      "Project progress is still relatively low compared with an active project.",
    );
  }

  score = Math.max(0, Math.min(100, score));

  let healthLabel: ProjectIntelligence["health_label"];

  if (blockedTasks.length > 0 || score < 50) {
    healthLabel = "BLOCKED";
  } else if (score < 75) {
    healthLabel = "AT_RISK";
  } else {
    healthLabel = "ON_TRACK";
  }

  let summary: string;

  if (healthLabel === "BLOCKED") {
    summary =
      `${project.name} requires immediate attention. ` +
      `There are active blockers or significant execution risks ` +
      `that could prevent the project from progressing normally.`;
  } else if (healthLabel === "AT_RISK") {
    summary =
      `${project.name} is progressing, but several signals indicate ` +
      `that schedule, delivery, or execution risks should be addressed.`;
  } else {
    summary =
      `${project.name} appears to be progressing normally. ` +
      `Current project activity and delivery signals indicate a generally healthy state.`;
  }

  let nextAction: string;

  if (blockedTasks.length > 0) {
    nextAction = `Resolve the blocked task "${blockedTasks[0].title}" and update its status before moving additional work forward.`;
  } else if (overdueTasks.length > 0) {
    nextAction = `Review the overdue task "${overdueTasks[0].title}" and either complete it or reset its delivery date.`;
  } else if (highPriorityOpenTasks.length > 0) {
    nextAction = `Prioritize the high-priority task "${highPriorityOpenTasks[0].title}" and move it toward completion.`;
  } else if (pendingDeliverables.length > 0) {
    nextAction = `Review the pending deliverable "${pendingDeliverables[0].title}" and move it through the approval workflow.`;
  } else if (incompleteMilestones.length > 0) {
    nextAction = `Continue work toward the "${incompleteMilestones[0].title}" milestone and keep its status updated.`;
  } else {
    nextAction =
      "Continue the current execution plan and keep project progress, tasks, and deliverables updated.";
  }

  return {
    summary,
    health_score: score,
    health_label: healthLabel,
    risks,
    next_action: nextAction,
  };
}
