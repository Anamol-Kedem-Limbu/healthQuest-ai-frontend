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
import { EmptyState, PageHeader, Panel, ui } from "@/components/ui";

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
    <div className="space-y-6">
      <PageHeader
        kicker="Health"
        title="Your wellness review"
        description="Generate a concise summary from your latest health data, then download a PDF."
        actions={
          <>
            <button onClick={handleGenerate} disabled={loading} className={ui.btnPrimary}>
              {loading ? "Generating…" : "Generate report"}
            </button>
            {report?.id && (
              <button onClick={handleDownload} className={ui.btnSecondary}>
                Download PDF
              </button>
            )}
          </>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !report && (
        <div className={`${ui.card} animate-pulse p-10 text-center text-sm text-[var(--muted)]`}>
          Preparing your report…
        </div>
      )}

      {report && (
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={ui.label}>Prepared for</p>
              <p className="mt-1.5 text-lg font-semibold text-[var(--text)]">
                {patientName}
                {patientSex ? (
                  <span className="font-normal text-[var(--muted)]">{patientSex}</span>
                ) : null}
              </p>
              {reportDate && <p className="mt-1 text-xs text-[var(--muted)]">{reportDate}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={ui.chip}>{report.is_complete ? "Complete" : "Partial"}</span>
              <span className={ui.chip}>
                Confidence {Math.round((report.confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>

          {report.missing_sections.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Missing sections: {report.missing_sections.join(", ")}
            </div>
          )}

          {cleanedSummary ? (
            <div className="mt-5 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-5">
              <p className={ui.label}>Summary</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text)]">
                {cleanedSummary}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--bg-soft)] p-5 text-center text-sm text-[var(--muted)]">
              No detailed summary available yet. Try generating a new report after adding more
              health data.
            </div>
          )}

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
              className="rounded-lg border border-[var(--panel-border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:opacity-60"
            >
              Regenerate
            </button>
          </div>
        </Panel>
      )}

      {!report && !loading && !error && (
        <EmptyState
          title="No report yet"
          description="Generate one to see a summary of your health data."
        />
      )}
    </div>
  );
}