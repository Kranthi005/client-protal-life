"use client";

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
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

  async function analyzeProject() {
    setLoading(true);
    setError(null);

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

  const healthScore = intelligence?.health_score ?? 0;

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

      {!intelligence && !loading && !error && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <Sparkles size={24} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Ready to analyze this project
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            NEXUS will review tasks, milestones, deliverables, feedback, and
            recent activity to assess project health.
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <Loader2 size={26} className="mx-auto animate-spin text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Analyzing project data...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            NEXUS is evaluating the current project state.
          </p>
        </div>
      )}

      {intelligence && !loading && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Health score
              </p>

              <p className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {healthScore}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                {intelligence.health_label === "ON_TRACK" && (
                  <CheckCircle2 size={16} />
                )}

                {intelligence.health_label === "AT_RISK" && (
                  <AlertTriangle size={16} />
                )}

                {intelligence.health_label === "BLOCKED" && (
                  <ShieldAlert size={16} />
                )}

                {intelligence.health_label.replace("_", " ")}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                AI summary
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {intelligence.summary}
              </p>
            </div>
          </div>

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

          <p className="text-xs text-slate-400">
            AI analysis is based only on the project information currently
            available to NEXUS.
          </p>
        </div>
      )}
    </section>
  );
}
