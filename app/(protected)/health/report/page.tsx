"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  analyzeHealthReport,
  downloadHealthReportPdf,
  getLatestHealthReport,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { HealthReportAnalysisResult } from "@/lib/types";
import { saveHealthReport } from "@/lib/report-storage";

/**
 * Checks if the summary content is a known generic placeholder.
 * Returns the cleaned content (or null if it should be hidden).
 */
function cleanSummaryContent(content: string | null | undefined): string | null {
  if (!content) return null;

  // If the summary starts with the placeholder header, treat it as empty.
  if (content.includes("The user's primary goals were reviewed")) {
    return null;
  }

  // Strip specific known filler lines (optional fine‑tuning)
  const linesToRemove = [
    "The user's primary goals were reviewed and incorporated into a concise health report.",
    "What was checked",
    "- Goals",
    "- Profile and vitals as available",
    "Findings",
    "- The current record is focused on the user's stated objectives and available health context.",
    "Medication review",
    "- Not provided",
    "Symptom review",
    "- Not provided",
    "Next steps",
    "- Continue tracking your progress and update your health data regularly.",
    "Observations",
    "Non-diagnostic observations:",
    "- The current record is focused on the user's stated objectives and available health context.",
  ];

  let filtered = content
    .split("\n")
    .filter((line) => !linesToRemove.includes(line.trim()))
    .join("\n")
    .trim();

  return filtered || null;
}

export default function HealthReportPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<HealthReportAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const latest = await getLatestHealthReport(token);
        if (mounted) setReport(latest);
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          return;
        }
        if (mounted) setReport(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, logout]);

  const handleGenerate = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const nextReport = await analyzeHealthReport(token);
      setReport(nextReport);
      try {
        saveHealthReport(nextReport);
      } catch {}
      router.push("/dashboard/health/report");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        return;
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate a report right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!token || !report?.id) return;
    try {
      const blob = await downloadHealthReportPdf(token, report.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `health-report-${report.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to download the report PDF."
      );
    }
  };

  const patientName = report?.patient_name ?? "Unknown patient";
  const patientSex = report?.patient_sex ? ` · ${report.patient_sex}` : "";
  const reportDate = report?.created_at
    ? new Date(report.created_at).toLocaleString()
    : null;

  // Clean up the summary content
  const summarySection = report?.sections?.find(
    (s) => s.title.trim().toLowerCase() === "summary"
  );
  const cleanedSummary = cleanSummaryContent(summarySection?.content);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
      {/* Page header – glass */}
      <div className="rounded-[2rem] border border-white/50 bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              Health Report
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Your wellness review
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Generate a concise summary from your latest health data, then
              download a PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Generating…" : "Generate report"}
            </button>
            {report?.id && (
              <button
                onClick={handleDownload}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !report && (
        <div className="animate-pulse rounded-[2rem] border border-white/50 bg-white/70 p-10 text-center text-sm text-slate-400 backdrop-blur-sm">
          Preparing your report…
        </div>
      )}

      {/* Report summary – only the cleaned summary */}
      {report && (
        <div className="rounded-[2rem] border border-white/50 bg-white/70 p-6 backdrop-blur-sm">
          {/* Patient & meta info */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Prepared for
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {patientName}
                {patientSex && (
                  <span className="text-lg font-normal text-slate-500">
                    {patientSex}
                  </span>
                )}
              </p>
              {reportDate && (
                <p className="mt-1 text-xs text-slate-400">{reportDate}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {report.is_complete ? "Complete" : "Partial"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Confidence: {Math.round((report.confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>

          {/* Missing sections warning */}
          {report.missing_sections.length > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
              Missing sections: {report.missing_sections.join(", ")}
            </div>
          )}

          {/* Summary content – only if not a placeholder */}
          {cleanedSummary ? (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Summary
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {cleanedSummary}
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
              No detailed summary available yet. Try generating a new report after
              adding more health data.
            </div>
          )}

          {/* Bottom actions */}
          <div className="mt-6 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              ← Back to dashboard
            </Link>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && !error && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/40 p-10 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-500">
            No report yet. Generate one to see a summary of your health data.
          </p>
        </div>
      )}
    </div>
  );
}