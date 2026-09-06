"use client";

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clipboard,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { ProjectIntelligence } from "@/lib/ai/project-intelligence";

type ProjectAIIntelligenceProps = {
  projectId: string;
};

export function ProjectAIIntelligence({
  projectId,
}: ProjectAIIntelligenceProps) {
  const [intelligence, setIntelligence] = useState<ProjectIntelligence | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function analyzeProject() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/intelligence`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not analyze this project.");
      }

      setIntelligence(data);
    } catch (analysisError) {
      console.error("NEXUS AI analysis failed", analysisError);

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Could not analyze this project.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyClientUpdate() {
    if (!intelligence?.client_update) {
      return;
    }

    try {
      await navigator.clipboard.writeText(intelligence.client_update);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error("Could not copy client update", copyError);

      setError(
        "Could not copy the client update. Please select and copy it manually.",
      );
    }
  }

  const healthScore = intelligence?.health_score ?? 0;

  const healthLabel =
    intelligence?.health_label === "ON_TRACK"
      ? "ON TRACK"
      : intelligence?.health_label === "AT_RISK"
        ? "AT RISK"
        : "BLOCKED";

  const healthIcon =
    intelligence?.health_label === "ON_TRACK" ? (
      <CheckCircle2 size={16} />
    ) : intelligence?.health_label === "AT_RISK" ? (
      <AlertTriangle size={16} />
    ) : (
      <ShieldAlert size={16} />
    );

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Brain size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                AI Project Intelligence
              </h2>

              <p className="text-sm text-slate-500">
                Evidence-based analysis of the current project state.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={analyzeProject}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : intelligence ? (
            <>
              <RefreshCw size={16} />
              Re-analyze
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analyze project
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-900">
              AI analysis failed
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!intelligence && !loading && !error && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <Sparkles size={24} className="mx-auto text-slate-400" />

          <p className="mt-3 text-sm font-medium text-slate-700">
            Ready to analyze this project
          </p>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            NEXUS will evaluate tasks, milestones, deliverables, feedback,
            deadlines, and recent project activity.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <Loader2 size={26} className="mx-auto animate-spin text-slate-500" />

          <p className="mt-3 text-sm font-medium text-slate-700">
            Analyzing project data...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            NEXUS is evaluating execution, delivery, deadline, and client
            signals.
          </p>
        </div>
      )}

      {/* Intelligence */}
      {intelligence && !loading && (
        <div className="mt-6 space-y-5">
          {/* Main score */}
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Health score
              </p>

              <p className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {healthScore}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                {healthIcon}
                {healthLabel}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-slate-600" />

                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Intelligence summary
                </p>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {intelligence.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Target size={13} />
                  {intelligence.risks.length} risk
                  {intelligence.risks.length === 1 ? "" : "s"} detected
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Brain size={13} />
                  {intelligence.confidence}% confidence
                </span>
              </div>
            </div>
          </div>

          {/* Risks + Next Action */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className="text-slate-600" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Detected risks
                </h3>
              </div>

              {intelligence.risks.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No significant risks detected from the available project data.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {intelligence.risks.map((risk, index) => (
                    <li
                      key={`${risk}-${index}`}
                      className="flex gap-3 text-sm leading-6 text-slate-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-slate-600" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Recommended next action
                </h3>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {intelligence.next_action}
              </p>
            </div>
          </div>

          {/* Client Update */}
          <div className="rounded-lg border border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={17} className="text-slate-600" />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Client Update Generator
                  </h3>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  A client-ready progress update generated from verified project
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={copyClientUpdate}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Clipboard size={14} />

                {copied ? "Copied!" : "Copy update"}
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                {intelligence.client_update}
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Review the generated update before sending it to a client. NEXUS
              does not invent project facts outside the available project data.
            </p>
          </div>

          {/* Score explanation */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <Brain size={17} className="text-slate-600" />

              <h3 className="text-sm font-semibold text-slate-900">
                Why NEXUS gave this score
              </h3>
            </div>

            {intelligence.score_factors.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No negative scoring factors were detected.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {intelligence.score_factors.map((factor, index) => (
                  <li
                    key={`${factor}-${index}`}
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confidence explanation */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Analysis confidence
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Confidence reflects the amount of project evidence available to
                NEXUS.
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {intelligence.confidence}%
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            NEXUS intelligence is based only on project information currently
            available to the system. Scores and recommendations are
            evidence-based, not guarantees.
          </p>
        </div>
      )}
    </section>
  );
}
