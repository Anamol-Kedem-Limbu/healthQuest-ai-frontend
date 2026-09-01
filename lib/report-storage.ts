import type { HealthReportAnalysisResult } from "./types";

const HEALTH_REPORT_STORAGE_KEY = "healthquest.latest_health_report";

function isHealthReportAnalysisResult(value: unknown): value is HealthReportAnalysisResult {
  if (!value || typeof value !== "object") return false;

  const report = value as Partial<HealthReportAnalysisResult>;
  return (
    typeof report.report_title === "string" &&
    typeof report.watermark === "string" &&
    typeof report.is_complete === "boolean" &&
    Array.isArray(report.missing_sections) &&
    Array.isArray(report.sections) &&
    Array.isArray(report.suggested_goals) &&
    typeof report.report_text === "string" &&
    (typeof report.confidence === "number" || report.confidence === null)
  );
}

export function saveHealthReport(report: HealthReportAnalysisResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HEALTH_REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Avoid hard-failing when the browser storage quota is exhausted.
    window.sessionStorage.removeItem(HEALTH_REPORT_STORAGE_KEY);
  }
}

export function loadHealthReport(): HealthReportAnalysisResult | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(HEALTH_REPORT_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!isHealthReportAnalysisResult(parsed)) {
      window.sessionStorage.removeItem(HEALTH_REPORT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(HEALTH_REPORT_STORAGE_KEY);
    return null;
  }
}

export function clearHealthReport() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(HEALTH_REPORT_STORAGE_KEY);
}