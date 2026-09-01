"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { ApiError, createGoal, downloadHealthReportPdf, getLatestHealthReport, getHealthReport, listHealthReports } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadHealthReport } from "@/lib/report-storage";
import type { HealthReportAnalysisResult } from "@/lib/types";
import { EmptyState, PageHeader, Panel, SectionHeader, ui } from "@/components/ui";
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

    // A report is produced synchronously by "Generate report" and is already
    // in local storage before this page opens. Fetch the server copy once to
    // pick up the canonical version / a specific reportId — no polling.
    const loadReport = async () => {
      try {
        const latest = requestedReportId
          ? await getHealthReport(token, requestedReportId)
          : await getLatestHealthReport(token);
        if (cancelled) return;
        setReport(latest);
        setLoadError(null);
      } catch (caughtError) {
        if (cancelled) return;
        if (caughtError instanceof ApiError && caughtError.status === 404) {
          // No server report yet: fall back to the locally saved one (if any),
          // otherwise show the empty state. Nothing is generating in the background.
          setReport(savedReport ?? null);
        } else {
          setLoadError(
            caughtError instanceof ApiError ? caughtError.message : "Unable to load the saved report.",
          );
          setReport(savedReport ?? null);
        }
      } finally {
        if (!cancelled) setIsLoadingReport(false);
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [token, savedReport, requestedReportId]);

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

  const backToHealth = (
    <Link href="/dashboard/health" className={`${ui.btnSecondary} print:hidden`}>
      <ArrowLeft size={16} />
      Back to health
    </Link>
  );

  if (!report) {
    return (
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <PageHeader
          kicker="Health"
          title="Prepared report"
          description={
            isLoadingReport
              ? "Loading your latest report…"
              : "No report yet — generate one from the Health page."
          }
          actions={backToHealth}
        />
        <EmptyState
          title={isLoadingReport ? "Loading report…" : "Report not available"}
          description={
            isLoadingReport
              ? "Fetching your latest report."
              : "Generate the report first from the Health page, then open this page to review or print it."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-0">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="print:hidden">
        <PageHeader
          kicker="Health"
          title={report.report_title || "Prepared report"}
          description="A polished, printable summary of your analyzed health data."
          actions={
            <>
              <button
                type="button"
                onClick={handlePrint}
                className={ui.btnSecondary}
              >
                <Printer size={16} />
                Print
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadPdfLoading || !report.id}
                className={ui.btnPrimary}
              >
                <Download size={16} />
                {downloadPdfLoading ? "Downloading…" : "Download PDF"}
              </button>
              {backToHealth}
            </>
          }
        />
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
          {loadError}
        </div>
      ) : null}

      {/* Report meta */}
      <div className={`${ui.card} p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={ui.label}>Prepared for</p>
            <p className="mt-1.5 text-lg font-semibold text-[var(--text)]">
              {patientName}
              {patientSex}
            </p>
            {reportDate ? (
              <p className="mt-1 text-xs text-[var(--muted)]">Report date: {reportDate}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={ui.chip}>{report.is_complete ? "Complete" : "Partial"}</span>
            <span className={ui.chip}>
              Confidence {Math.round((report.confidence ?? 0) * 100)}%
            </span>
            {report.watermark ? (
              <span className="inline-flex items-center rounded-full bg-[var(--bg-soft)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                {report.watermark}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Report history */}
      <Panel className="print:hidden">
        <SectionHeader
          title="Report history"
          subtitle="Recent reports you can reopen"
          action={
            <span className={ui.chip}>
              {isLoadingHistory ? "Loading…" : `${reportHistory.length} saved`}
            </span>
          }
        />
        {reportHistory.length > 0 ? (
          <div className="mt-4 divide-y divide-[var(--panel-border)]">
            {reportHistory.slice(0, 4).map((historyItem) => (
              <Link
                key={historyItem.id}
                href={`/dashboard/health/report?reportId=${historyItem.id}`}
                className="flex flex-col gap-1 py-3 text-sm transition first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--text)]">
                    {historyItem.report_title || "Health report"}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {historyItem.is_complete ? "Complete" : "Partial"}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {historyItem.created_at
                    ? new Date(historyItem.created_at).toLocaleString()
                    : "Generated recently"}
                  {" · "}Confidence {Math.round((historyItem.confidence ?? 0) * 100)}%
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No saved reports yet. Generate one from the Health page to see a history here.
          </p>
        )}
      </Panel>

      {/* Report body */}
      <div className={`${ui.card} p-6 print:border-0 print:p-0 print:shadow-none`}>
        {visibleSections.length > 0 ? (
          <div className="divide-y divide-[var(--panel-border)]">
            {visibleSections.map((section) => (
              <div key={section.title} className="py-4 first:pt-0 last:pb-0">
                <p className={ui.label}>{section.title}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text)]">
                  {section.content || "Not provided"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className={ui.label}>Structured report</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text)]">
              {report.report_text ||
                "The backend generated the report content, but the structured sections were not available for this view."}
            </p>
          </div>
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
