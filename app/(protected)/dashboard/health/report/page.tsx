"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError, createGoal, downloadHealthReportPdf, getLatestHealthReport, getHealthReport, listHealthReports } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadHealthReport } from "@/lib/report-storage";
import type { HealthReportAnalysisResult } from "@/lib/types";
import { EmptyState, Panel, SectionHeader } from "@/components/ui";
import { useToasts, ToastContainer } from "@/components/Toast";

type ParsedReportGoal = {
  title: string;
  description: string;
  target_value: number | null;
  reason: string;
};

export default function HealthReportPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { toasts, removeToast, success, error } = useToasts();
  const [report, setReport] = useState<HealthReportAnalysisResult | null>(null);
  const [sendingGoalId, setSendingGoalId] = useState<string | null>(null);
  const [downloadPdfLoading, setDownloadPdfLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [reportHistory, setReportHistory] = useState<HealthReportAnalysisResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const savedReport = useMemo(() => loadHealthReport(), []);
  const searchParams = useSearchParams();
  const requestedReportId = searchParams?.get("reportId") ?? null;
  const reportDate = report?.created_at ? new Date(report.created_at).toLocaleString() : null;
  const patientName = report?.patient_name ?? "Unknown patient";
  const patientSex = report?.patient_sex ? ` · ${report.patient_sex}` : "";

  useEffect(() => {
    setIsLoadingReport(true);

    if (savedReport) {
      setReport(savedReport);
    }

    const loadHistory = async () => {
      if (!token) return;
      setIsLoadingHistory(true);
      try {
        const history = await listHealthReports(token);
        setReportHistory(history);
      } catch {
        setReportHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadHistory();

    if (!token) {
      setIsLoadingReport(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;

    const loadReport = async () => {
      try {
        const latest = requestedReportId ? await getHealthReport(token, requestedReportId) : await getLatestHealthReport(token);
        if (!cancelled) {
          setReport(latest);
          setLoadError(null);
          setIsLoadingReport(false);
        }
      } catch (caughtError) {
        if (cancelled) return;
        if (caughtError instanceof ApiError && caughtError.status === 404) {
          attempts += 1;
          if (attempts < maxAttempts) {
            window.setTimeout(() => {
              if (!cancelled) {
                void loadReport();
              }
            }, 3000);
            return;
          }

          if (savedReport) {
            setReport(savedReport);
          } else {
            setReport(null);
          }
          setIsLoadingReport(false);
          return;
        }

        setLoadError(caughtError instanceof ApiError ? caughtError.message : "Unable to load the saved report.");
        setReport(savedReport);
        setIsLoadingReport(false);
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [token, savedReport]);

  const visibleSections = useMemo(() => {
    const parsedSections = (report?.sections ?? []).filter(
      (section) =>
        (section.content || "").trim().length > 0 &&
        section.title.trim().toLowerCase() !== "suggested goals",
    );
    if (parsedSections.length > 0) {
      return parsedSections;
    }

    if (report?.report_text?.trim()) {
      return [{ title: "Full report", content: report.report_text }];
    }

    return [];
  }, [report]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!report || !token || !report.id) return;
    setDownloadPdfLoading(true);
    try {
      const pdfBlob = await downloadHealthReportPdf(token, report.id);
      const url = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `health-report-${report.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      error(caughtError instanceof ApiError ? caughtError.message : "Unable to download the PDF right now.");
    } finally {
      setDownloadPdfLoading(false);
    }
  };

  const handleSendGoal = async (goal: ParsedReportGoal) => {
    if (!token) return;
    setSendingGoalId(goal.title);
    try {
      const createdGoal = await createGoal(token, {
        title: goal.title,
        description: goal.reason ? `${goal.description} Reason: ${goal.reason}` : goal.description,
        target_value: goal.target_value,
      });
      success(`Goal sent to Goals: ${createdGoal.title}`);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      error("Unable to send the goal right now.");
    } finally {
      setSendingGoalId(null);
    }
  };

  if (!report) {
    return (
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <Panel>
          <SectionHeader
            title="Prepared report"
            subtitle={isLoadingReport ? "Generating your report. This can take a few moments while the backend finishes the analysis." : "No saved report was found. Run Analyze my report from the health page first."}
            action={
              <Link href="/dashboard/health" className="inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-4 py-2 text-sm font-medium text-white">
                <ArrowLeft size={16} />
                Back to health
              </Link>
            }
          />
        </Panel>
        <EmptyState
          title={isLoadingReport ? "Preparing report…" : "Report not available"}
          description={isLoadingReport ? "The backend is still generating the report. Please wait a moment and the report will appear here automatically." : "Generate the report first, then open this page to review or print it."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-0">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <Panel className="print:hidden">
        <SectionHeader
          title={report.report_title || "Prepared report"}
          subtitle="A polished, printable summary of your analyzed health data."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadPdfLoading || !report.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadPdfLoading ? "Downloading…" : "Download PDF"}
              </button>
              <Link href="/dashboard/health" className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
                <ArrowLeft size={16} />
                Back to health
              </Link>
            </div>
          }
        />
      </Panel>

      {loadError ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {loadError}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-slate-200 print:bg-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Prepared for</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{patientName}{patientSex}</p>
            {reportDate ? <p className="mt-1 text-sm text-slate-600">Report date: {reportDate}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{report.is_complete ? "Complete" : "Partial"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Confidence: {Math.round((report.confidence ?? 0) * 100)}%</span>
            {report.watermark ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{report.watermark}</span> : null}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-slate-200 print:bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Report history</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Recent reports you can reopen</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{isLoadingHistory ? "Loading…" : `${reportHistory.length} saved`}</span>
        </div>
        {reportHistory.length > 0 ? (
          <div className="mt-5 space-y-3">
            {reportHistory.slice(0, 4).map((historyItem) => (
              <Link
                key={historyItem.id}
                href={`/dashboard/health/report?reportId=${historyItem.id}`}
                className="flex flex-col gap-1 border-b border-slate-200 pb-3 text-sm text-slate-600 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{historyItem.report_title || "Health report"}</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {historyItem.is_complete ? "Complete" : "Partial"}
                  </span>
                </div>
                <p>{historyItem.created_at ? new Date(historyItem.created_at).toLocaleString() : "Generated recently"}</p>
                <p className="text-slate-500">Confidence: {Math.round((historyItem.confidence ?? 0) * 100)}%</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-600">No saved reports yet. Generate one from the health dashboard to see a history here.</p>
        )}
      </section>

      <div className="space-y-4 print:space-y-0">
        {visibleSections.length > 0 ? (
          <section className="space-y-4">
            {visibleSections.map((section) => (
              <div key={section.title} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{section.title}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{section.content || "Not provided"}</p>
              </div>
            ))}
          </section>
        ) : (
          <section className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Structured report</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {report.report_text || "The backend generated the report content, but the structured sections were not available for this view."}
            </p>
          </section>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}