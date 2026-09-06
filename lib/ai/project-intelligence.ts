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
  confidence: number;
  score_factors: string[];
  client_update: string;
};

function daysUntil(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const target = new Date(date);
  const now = new Date();

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function generateProjectIntelligence(
  input: ProjectIntelligenceInput,
): Promise<ProjectIntelligence> {
  const { project, tasks, milestones, deliverables, feedback, activities } =
    input;

  let score = 100;

  const risks: string[] = [];
  const scoreFactors: string[] = [];

  const blockedTasks = tasks.filter((task) => task.status === "BLOCKED");

  const openTasks = tasks.filter((task) => task.status !== "DONE");

  const completedTasks = tasks.filter((task) => task.status === "DONE");

  const highPriorityOpenTasks = tasks.filter(
    (task) => task.priority === "HIGH" && task.status !== "DONE",
  );

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === "DONE") {
      return false;
    }

    return new Date(task.due_date) < new Date();
  });

  const deadlineDays = daysUntil(project.due_date);

  const incompleteMilestones = milestones.filter(
    (milestone) => milestone.status !== "COMPLETED",
  );

  const overdueMilestones = milestones.filter((milestone) => {
    if (!milestone.due_date || milestone.status === "COMPLETED") {
      return false;
    }

    return new Date(milestone.due_date) < new Date();
  });

  const upcomingMilestones = milestones.filter((milestone) => {
    const days = daysUntil(milestone.due_date);

    return (
      milestone.status !== "COMPLETED" &&
      days !== null &&
      days >= 0 &&
      days <= 7
    );
  });

  const pendingDeliverables = deliverables.filter(
    (deliverable) => deliverable.status !== "APPROVED",
  );

  const changesRequested = feedback.filter((item) => {
    const message = item.message.toLowerCase();

    return (
      message.includes("change") ||
      message.includes("revision") ||
      message.includes("update") ||
      message.includes("fix") ||
      message.includes("issue")
    );
  });

  const recentFeedback = feedback.filter((item) => {
    const createdAt = new Date(item.created_at);

    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return createdAt >= sevenDaysAgo;
  });

  /*
   * 1. Hard blockers
   */

  if (blockedTasks.length > 0) {
    score -= Math.min(30, blockedTasks.length * 15);

    risks.push(
      `${blockedTasks.length} task${
        blockedTasks.length > 1 ? "s are" : " is"
      } currently blocked.`,
    );

    scoreFactors.push(
      `Blocked work reduced the score by ${Math.min(
        30,
        blockedTasks.length * 15,
      )} points.`,
    );
  }

  /*
   * 2. Overdue execution
   */

  if (overdueTasks.length > 0) {
    score -= Math.min(20, overdueTasks.length * 10);

    risks.push(
      `${overdueTasks.length} incomplete task${
        overdueTasks.length > 1 ? "s are" : " is"
      } past the due date.`,
    );

    scoreFactors.push(
      `Overdue tasks reduced the score by ${Math.min(
        20,
        overdueTasks.length * 10,
      )} points.`,
    );
  }

  /*
   * 3. High priority work
   */

  if (highPriorityOpenTasks.length > 0) {
    score -= Math.min(15, highPriorityOpenTasks.length * 5);

    risks.push(
      `${highPriorityOpenTasks.length} high-priority task${
        highPriorityOpenTasks.length > 1 ? "s remain" : " remains"
      } open.`,
    );

    scoreFactors.push(
      `Open high-priority work reduced the score by ${Math.min(
        15,
        highPriorityOpenTasks.length * 5,
      )} points.`,
    );
  }

  /*
   * 4. Deliverables waiting for approval
   */

  if (pendingDeliverables.length > 0) {
    score -= Math.min(10, pendingDeliverables.length * 3);

    risks.push(
      `${pendingDeliverables.length} deliverable${
        pendingDeliverables.length > 1 ? "s are" : " is"
      } not yet approved.`,
    );

    scoreFactors.push(
      `Pending deliverables reduced the score by ${Math.min(
        10,
        pendingDeliverables.length * 3,
      )} points.`,
    );
  }

  /*
   * 5. Milestone pressure
   */

  if (overdueMilestones.length > 0) {
    score -= Math.min(15, overdueMilestones.length * 7);

    risks.push(
      `${overdueMilestones.length} milestone${
        overdueMilestones.length > 1 ? "s are" : " is"
      } past the planned date.`,
    );

    scoreFactors.push(
      `Overdue milestones reduced the score by ${Math.min(
        15,
        overdueMilestones.length * 7,
      )} points.`,
    );
  } else if (upcomingMilestones.length > 0) {
    score -= Math.min(8, upcomingMilestones.length * 3);

    risks.push(
      `${upcomingMilestones.length} milestone${
        upcomingMilestones.length > 1 ? "s are" : " is"
      } due within the next 7 days.`,
    );

    scoreFactors.push(
      `Near-term milestones reduced the score by ${Math.min(
        8,
        upcomingMilestones.length * 3,
      )} points.`,
    );
  }

  /*
   * 6. Deadline pressure
   */

  if (deadlineDays !== null && deadlineDays < 0) {
    score -= 15;

    risks.push("The overall project due date has passed.");

    scoreFactors.push(
      "A missed project deadline reduced the score by 15 points.",
    );
  } else if (deadlineDays !== null && deadlineDays <= 7) {
    score -= 8;

    risks.push(
      `The project deadline is approaching in approximately ${deadlineDays} day${
        deadlineDays === 1 ? "" : "s"
      }.`,
    );

    scoreFactors.push(
      "An approaching project deadline reduced the score by 8 points.",
    );
  }

  /*
   * 7. Client feedback / revision pressure
   */

  if (changesRequested.length > 0) {
    score -= Math.min(10, changesRequested.length * 5);

    risks.push(
      "Client feedback indicates that changes or revisions may still be required.",
    );

    scoreFactors.push(
      `Revision-oriented feedback reduced the score by ${Math.min(
        10,
        changesRequested.length * 5,
      )} points.`,
    );
  }

  /*
   * 8. Progress mismatch
   */

  if (
    project.status === "IN_PROGRESS" &&
    project.progress >= 75 &&
    openTasks.length >= 3
  ) {
    score -= 5;

    risks.push(
      "Reported project progress is high while several tasks are still incomplete.",
    );

    scoreFactors.push(
      "A progress-versus-workload mismatch reduced the score by 5 points.",
    );
  }

  if (
    project.status === "IN_PROGRESS" &&
    project.progress < 30 &&
    completedTasks.length === 0 &&
    tasks.length > 0
  ) {
    score -= 5;

    risks.push(
      "Project progress is still low and no tracked tasks have been completed.",
    );

    scoreFactors.push("Low execution progress reduced the score by 5 points.");
  }

  /*
   * 9. Activity signal
   */

  if (
    project.status === "IN_PROGRESS" &&
    tasks.length > 0 &&
    activities.length === 0
  ) {
    risks.push(
      "No recent project activity is available, so execution visibility is limited.",
    );

    scoreFactors.push(
      "Activity history is limited; this affects confidence rather than the health score.",
    );
  }

  score = Math.max(0, Math.min(100, score));

  /*
   * Health classification
   */

  let healthLabel: ProjectIntelligence["health_label"];

  if (blockedTasks.length > 0 || score < 50) {
    healthLabel = "BLOCKED";
  } else if (score < 75) {
    healthLabel = "AT_RISK";
  } else {
    healthLabel = "ON_TRACK";
  }

  /*
   * Dynamic summary
   */

  let summary: string;

  if (healthLabel === "BLOCKED") {
    summary =
      `${project.name} requires immediate attention. ` +
      `Active blockers or significant execution risks are currently preventing ` +
      `the project from progressing normally.`;
  } else if (healthLabel === "AT_RISK") {
    summary =
      `${project.name} is progressing, but multiple signals indicate elevated ` +
      `schedule, delivery, or execution risk. The highest-impact issues should ` +
      `be addressed before additional work accumulates.`;
  } else {
    summary =
      `${project.name} is currently showing a generally healthy execution pattern. ` +
      `The project is progressing, although the remaining open work and delivery ` +
      `signals should continue to be monitored.`;
  }

  /*
   * Intelligent next action priority
   */

  let nextAction: string;

  if (blockedTasks.length > 0) {
    nextAction = `Resolve the blocked task "${blockedTasks[0].title}" before moving additional work forward.`;
  } else if (overdueTasks.length > 0) {
    nextAction = `Review the overdue task "${overdueTasks[0].title}" and either complete it or reset its delivery date.`;
  } else if (deadlineDays !== null && deadlineDays <= 7) {
    nextAction =
      "Review the remaining open work against the project deadline and prioritize anything that could affect final delivery.";
  } else if (changesRequested.length > 0) {
    nextAction =
      "Address the latest client-requested changes before moving the related deliverable toward final approval.";
  } else if (highPriorityOpenTasks.length > 0) {
    nextAction = `Prioritize the high-priority task "${highPriorityOpenTasks[0].title}" and move it toward completion.`;
  } else if (pendingDeliverables.length > 0) {
    nextAction = `Review the pending deliverable "${pendingDeliverables[0].title}" and move it through the approval workflow.`;
  } else if (overdueMilestones.length > 0) {
    nextAction = `Review the overdue milestone "${overdueMilestones[0].title}" and update its execution plan.`;
  } else if (incompleteMilestones.length > 0) {
    nextAction = `Continue work toward the "${incompleteMilestones[0].title}" milestone and keep its status updated.`;
  } else {
    nextAction =
      "Continue the current execution plan and keep project progress, tasks, milestones, and deliverables updated.";
  }

  /*
   * Confidence is based on available project evidence.
   */

  let confidence = 50;

  if (tasks.length > 0) {
    confidence += 10;
  }

  if (milestones.length > 0) {
    confidence += 10;
  }

  if (deliverables.length > 0) {
    confidence += 10;
  }

  if (feedback.length > 0) {
    confidence += 10;
  }

  if (activities.length > 0) {
    confidence += 10;
  }

  confidence = Math.min(100, confidence);

  if (recentFeedback.length > 0) {
    confidence = Math.min(100, confidence + 5);
  }

  /*
   * Client-facing project update.
   *
   * This is intentionally generated from verified project data
   * rather than inventing information.
   */

  const clientUpdate = generateClientUpdate({
    project,
    tasks,
    milestones,
    deliverables,
    feedback,
    healthLabel,
    healthScore: score,
    nextAction,
  });

  return {
    summary,
    health_score: score,
    health_label: healthLabel,
    risks,
    next_action: nextAction,
    confidence,
    score_factors: scoreFactors,
    client_update: clientUpdate,
  };
}

function generateClientUpdate({
  project,
  tasks,
  milestones,
  deliverables,
  feedback,
  healthLabel,
  healthScore,
  nextAction,
}: {
  project: ProjectIntelligenceInput["project"];
  tasks: ProjectIntelligenceInput["tasks"];
  milestones: ProjectIntelligenceInput["milestones"];
  deliverables: ProjectIntelligenceInput["deliverables"];
  feedback: ProjectIntelligenceInput["feedback"];
  healthLabel: ProjectIntelligence["health_label"];
  healthScore: number;
  nextAction: string;
}): string {
  const completedTasks = tasks.filter((task) => task.status === "DONE");

  const activeTasks = tasks.filter((task) => task.status === "IN_PROGRESS");

  const openTasks = tasks.filter((task) => task.status !== "DONE");

  const completedMilestones = milestones.filter(
    (milestone) => milestone.status === "COMPLETED",
  );

  const approvedDeliverables = deliverables.filter(
    (deliverable) => deliverable.status === "APPROVED",
  );

  const pendingDeliverables = deliverables.filter(
    (deliverable) => deliverable.status !== "APPROVED",
  );

  const statusText =
    healthLabel === "ON_TRACK"
      ? "The project is currently progressing on track."
      : healthLabel === "AT_RISK"
        ? "The project is progressing, with a few areas requiring attention."
        : "The project currently has issues that require attention before normal progress can continue.";

  const progressText =
    project.progress > 0
      ? `Overall project progress is currently ${project.progress}%.`
      : "Project progress is currently being established.";

  const completedWork =
    completedTasks.length > 0
      ? `${completedTasks.length} task${
          completedTasks.length === 1 ? "" : "s"
        } completed`
      : "No tracked tasks completed yet";

  const activeWork =
    activeTasks.length > 0
      ? `${activeTasks.length} task${
          activeTasks.length === 1 ? "" : "s"
        } currently in progress`
      : "No tasks currently marked in progress";

  const milestoneProgress =
    milestones.length > 0
      ? `${completedMilestones.length} of ${milestones.length} milestones completed`
      : "Milestone tracking is being established";

  const deliveryProgress =
    deliverables.length > 0
      ? `${approvedDeliverables.length} of ${deliverables.length} deliverables approved`
      : "No deliverables have been recorded yet";

  const clientFeedbackText =
    feedback.length > 0
      ? "Recent client feedback has been incorporated into the current project assessment."
      : "No recent client feedback is currently recorded.";

  return `Project Update — ${project.name}

${statusText} ${progressText}

Current progress:
• ${completedWork}
• ${activeWork}
• ${milestoneProgress}
• ${deliveryProgress}

${clientFeedbackText}

Current focus:
${nextAction}

The NEXUS project health assessment is ${healthScore}/100 (${healthLabel.replace(
    "_",
    " ",
  )}).

Next step:
The team will continue prioritizing the remaining open work and keep project progress, deliverables, and approvals updated.

${
  openTasks.length > 0
    ? `${openTasks.length} open task${
        openTasks.length === 1 ? "" : "s"
      } remain in the current plan.`
    : "All currently tracked tasks are complete."
}

${
  pendingDeliverables.length > 0
    ? `${pendingDeliverables.length} deliverable${
        pendingDeliverables.length === 1 ? "" : "s"
      } still require approval or further review.`
    : "All currently tracked deliverables have been approved."
}`;
}
