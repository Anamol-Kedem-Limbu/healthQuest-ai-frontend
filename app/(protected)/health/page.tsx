"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
  Thermometer,
} from "lucide-react";
import {
  analyzeHealthReport,
  analyzeVitals,
  ApiError,
  createVitals,
  getAppointments,
  getBMI,
  getMedications,
  getMyProfile,
  getSymptoms,
  getVitals,
  takeMedication,
  attendAppointment,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { saveHealthReport } from "@/lib/report-storage";
import type {
  AppointmentEntry,
  HealthProfile,
  MedicationReminder,
  SymptomEntry,
  VitalsAnalysisResult,
  VitalsEntry,
} from "@/lib/types";
import { useToasts, ToastContainer } from "@/components/Toast";
import { GoalProgressRing, PageHeader, Panel, ui } from "@/components/ui";

export default function HealthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const { toasts, removeToast, success, error } = useToasts();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [analysis, setAnalysis] = useState<VitalsAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [submittingVitals, setSubmittingVitals] = useState(false);
  const [vitalsMessage, setVitalsMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportAnalyzing, setReportAnalyzing] = useState(false);
  const [reportBusyMessage, setReportBusyMessage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportWizardStep, setReportWizardStep] = useState(0);
  const [takenMedications, setTakenMedications] = useState<Set<string>>(new Set());
  const [attendedAppointments, setAttendedAppointments] = useState<Set<string>>(new Set());
  const TAKEN_MED_KEY = "healthquest.taken_medications";
  const ATTENDED_APPT_KEY = "healthquest.attended_appointments";

  useEffect(() => {
    try {
      const rawTaken = typeof window !== "undefined" ? window.sessionStorage.getItem(TAKEN_MED_KEY) : null;
      if (rawTaken) {
        const arr = JSON.parse(rawTaken || "[]") as string[];
        setTakenMedications(new Set(arr));
      }
      const rawAtt = typeof window !== "undefined" ? window.sessionStorage.getItem(ATTENDED_APPT_KEY) : null;
      if (rawAtt) {
        const arr2 = JSON.parse(rawAtt || "[]") as string[];
        setAttendedAppointments(new Set(arr2));
      }
    } catch {
      // ignore
    }
  }, []);

  const reportAnalysisLockRef = useRef(false);
  const [heartRateInput, setHeartRateInput] = useState("");
  const [systolicInput, setSystolicInput] = useState("");
  const [diastolicInput, setDiastolicInput] = useState("");
  const [temperatureInput, setTemperatureInput] = useState("");
  const [spo2Input, setSpo2Input] = useState("");
  const handledAnalyzeRequest = useRef(false);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        const [
          profileData,
          bmiData,
          vitalsData,
          symptomsData,
          medicationData,
          appointmentData,
        ] = await Promise.all([
          getMyProfile(token).catch((caughtError) => {
            if (caughtError instanceof ApiError && caughtError.status === 404) return null;
            throw caughtError;
          }),
          getBMI(token).catch((caughtError) => {
            if (caughtError instanceof ApiError && caughtError.status === 404) return null;
            throw caughtError;
          }),
          getVitals(token).catch(() => []),
          getSymptoms(token).catch(() => []),
          getMedications(token).catch(() => []),
          getAppointments(token).catch(() => []),
        ]);

        setProfile(profileData);
        setBmi(bmiData?.bmi ?? null);
        setVitals(vitalsData);
        setSymptoms(symptomsData);
        setMedications(medicationData);
        setAppointments(appointmentData);

        if (vitalsData[0]) {
          const analysisResult = await analyzeVitals(token, {
            heart_rate: vitalsData[0].heart_rate,
            systolic: vitalsData[0].systolic,
            diastolic: vitalsData[0].diastolic,
            temperature_c: vitalsData[0].temperature_c,
            spo2: vitalsData[0].spo2,
          });
          setAnalysis(analysisResult);
        } else {
          setAnalysis(null);
        }

        setHealthError(null);
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        setHealthError("Unable to load health data right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, logout, router]);

  const latestVitals = vitals[0];

  const reportMissingSections = useMemo(() => {
    const missing: string[] = [];

    const profileComplete = Boolean(
      profile &&
        (profile.height_cm !== null ||
          profile.weight_kg !== null ||
          profile.age !== null ||
          profile.body_type ||
          profile.activity_level)
    );
    if (!profileComplete) missing.push("profile");

    const vitalsComplete = Boolean(
      latestVitals &&
        latestVitals.heart_rate !== null &&
        latestVitals.systolic !== null &&
        latestVitals.diastolic !== null &&
        latestVitals.temperature_c !== null &&
        latestVitals.spo2 !== null
    );
    if (!vitalsComplete) missing.push("vitals");

    if (symptoms.length === 0) missing.push("symptoms");
    if (medications.length === 0 || !medications.some((med) => (med.name || "").trim()))
      missing.push("medications");

    return missing;
  }, [profile, latestVitals, symptoms, medications]);

  const reportReadiness = useMemo(() => {
    const total = 4;
    const completed = total - reportMissingSections.length;
    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  }, [reportMissingSections]);

  const reportWizardSteps = useMemo(() => {
    const profileLines = [
      profile?.age != null ? `Age: ${profile.age}` : "Age: not provided",
      profile?.height_cm != null ? `Height: ${profile.height_cm} cm` : "Height: not provided",
      profile?.weight_kg != null ? `Weight: ${profile.weight_kg} kg` : "Weight: not provided",
      profile?.body_type ? `Body type: ${profile.body_type}` : "Body type: not provided",
      profile?.activity_level ? `Activity level: ${profile.activity_level}` : "Activity level: not provided",
    ];

    const vitalsLines = latestVitals
      ? [
          latestVitals.heart_rate != null ? `Heart rate: ${latestVitals.heart_rate} bpm` : "Heart rate: not provided",
          latestVitals.systolic != null && latestVitals.diastolic != null
            ? `Blood pressure: ${latestVitals.systolic}/${latestVitals.diastolic}`
            : "Blood pressure: not provided",
          latestVitals.temperature_c != null ? `Temperature: ${latestVitals.temperature_c} °C` : "Temperature: not provided",
          latestVitals.spo2 != null ? `SpO₂: ${latestVitals.spo2}%` : "SpO₂: not provided",
        ]
      : ["No vitals have been logged yet."];

    const symptomLines = symptoms.length > 0
      ? symptoms.slice(0, 4).map((symptom) => `${symptom.name}${symptom.notes ? ` — ${symptom.notes}` : ""}`)
      : ["No symptoms recorded yet."];

    const medicationLines = medications.length > 0
      ? medications.slice(0, 4).map((medication) => `${medication.name}${medication.dosage ? ` — ${medication.dosage}` : ""}`)
      : ["No medication reminders added yet."];

    const appointmentLines = appointments.length > 0
      ? appointments.slice(0, 4).map((appointment) => `${appointment.title} — ${new Date(appointment.scheduled_for).toLocaleString()}`)
      : ["No appointments scheduled yet."];

    return [
      {
        title: "Profile snapshot",
        description: "Review your baseline details before we prepare the report.",
        status: profile ? "Ready to include" : "Needs a quick update",
        details: profileLines,
      },
      {
        title: "Latest vitals",
        description: "We will use your latest readings as part of the professional summary.",
        status: latestVitals ? "Ready to include" : "Needs a quick update",
        details: vitalsLines,
      },
      {
        title: "Symptoms and notes",
        description: "Check the symptoms already captured so the report reflects your recent wellness history.",
        status: symptoms.length > 0 ? "Ready to include" : "Can be skipped",
        details: symptomLines,
      },
      {
        title: "Medication routine",
        description: "Confirm your medication reminders so the report can mention your routine clearly.",
        status: medications.length > 0 ? "Ready to include" : "Can be skipped",
        details: medicationLines,
      },
      {
        title: "Appointments and follow-up",
        description: "We’ll include upcoming care touchpoints when they are available.",
        status: appointments.length > 0 ? "Ready to include" : "Can be skipped",
        details: appointmentLines,
      },
    ];
  }, [appointments, bmi, latestVitals, medications, profile, symptoms]);

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportWizardStep(0);
  };

  const handleReportWizardAdvance = () => {
    if (reportWizardStep < reportWizardSteps.length - 1) {
      setReportWizardStep((currentStep) => currentStep + 1);
      return;
    }
    void runReportAnalysis();
  };

  const handleReportWizardSkip = () => {
    if (reportWizardStep < reportWizardSteps.length - 1) {
      setReportWizardStep((currentStep) => currentStep + 1);
      return;
    }
    void runReportAnalysis();
  };

  const runReportAnalysis = async () => {
    if (!token || reportAnalyzing || reportAnalysisLockRef.current) return;
    reportAnalysisLockRef.current = true;
    setReportBusyMessage(null);
    setReportAnalyzing(true);
    try {
      const result = await analyzeHealthReport(token);
      setReportModalOpen(false);
      saveHealthReport(result);
      router.push("/dashboard/health/report");
      success("Report analyzed successfully.");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        setReportBusyMessage(
          "A report is already being generated. Please wait a moment and try again."
        );
      } else {
        error(
          caughtError instanceof ApiError && caughtError.message
            ? caughtError.message
            : "Unable to analyze the report right now."
        );
      }
    } finally {
      setReportAnalyzing(false);
      reportAnalysisLockRef.current = false;
    }
  };

  useEffect(() => {
    const analyzeRequested = searchParams.get("analyze") === "1";
    if (!token || loading || handledAnalyzeRequest.current || !analyzeRequested) return;
    handledAnalyzeRequest.current = true;
    // Never auto-generate. Only open the review modal; the user must click
    // "Generate report" on the final step to actually run the analysis.
    setReportWizardStep(0);
    setReportModalOpen(true);
  }, [token, loading, searchParams]);

  const refreshHealthData = async () => {
    if (!token) return;
    try {
      const [
        profileData,
        bmiData,
        vitalsData,
        symptomsData,
        medicationData,
        appointmentData,
      ] = await Promise.all([
        getMyProfile(token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) return null;
          throw caughtError;
        }),
        getBMI(token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) return null;
          throw caughtError;
        }),
        getVitals(token).catch(() => []),
        getSymptoms(token).catch(() => []),
        getMedications(token).catch(() => []),
        getAppointments(token).catch(() => []),
      ]);

      setProfile(profileData);
      setBmi(bmiData?.bmi ?? null);
      setVitals(vitalsData);
      setSymptoms(symptomsData);
      setMedications(medicationData);
      setAppointments(appointmentData);
    } catch {
      // ignore refresh failures
    }
  };

  const handleTakeMedication = async (medicationId: string) => {
    if (!token) return;
    setActionLoading(`med-${medicationId}`);
    try {
      await takeMedication(token, medicationId);
      await refreshHealthData();
      success("💊 Medication recorded — Keep up your routine!");
      setTakenMedications((prev) => {
        const next = new Set(prev);
        next.add(medicationId);
        try {
          if (typeof window !== "undefined")
            window.sessionStorage.setItem(TAKEN_MED_KEY, JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      error("Unable to record medication right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttendAppointment = async (appointmentId: string) => {
    if (!token) return;
    setActionLoading(`appt-${appointmentId}`);
    try {
      await attendAppointment(token, appointmentId);
      await refreshHealthData();
      success("✅ Appointment attendance recorded — You're on track!");
      setAttendedAppointments((prev) => {
        const next = new Set(prev);
        next.add(appointmentId);
        try {
          if (typeof window !== "undefined")
            window.sessionStorage.setItem(
              ATTENDED_APPT_KEY,
              JSON.stringify(Array.from(next))
            );
        } catch {}
        return next;
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      error("Unable to record appointment attendance right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitVitals = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSubmittingVitals(true);
    setVitalsMessage(null);

    try {
      const payload = {
        heart_rate: heartRateInput ? Number(heartRateInput) : null,
        systolic: systolicInput ? Number(systolicInput) : null,
        diastolic: diastolicInput ? Number(diastolicInput) : null,
        temperature_c: temperatureInput ? Number(temperatureInput) : null,
        spo2: spo2Input ? Number(spo2Input) : null,
      };

      const createdVitals = await createVitals(token, payload);
      const analysisResult = await analyzeVitals(token, payload);

      setVitals((current) => [createdVitals, ...current]);
      setAnalysis(analysisResult);
      setVitalsMessage("Vitals saved and analyzed.");
      setHeartRateInput("");
      setSystolicInput("");
      setDiastolicInput("");
      setTemperatureInput("");
      setSpo2Input("");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setVitalsMessage("Unable to save vitals right now.");
    } finally {
      setSubmittingVitals(false);
    }
  };

  if (!token) return null;

  const severityTone = (severity?: string | null) => {
    const normalized = (severity ?? "").toLowerCase();
    if (
      normalized.includes("concerning") ||
      normalized.includes("critical") ||
      normalized.includes("high")
    ) {
      return {
        badge: "bg-rose-100 text-rose-700",
        card: "border-rose-200 bg-rose-50",
        icon: <AlertTriangle size={18} className="text-rose-600" />,
      };
    }
    if (normalized.includes("moderate") || normalized.includes("medium")) {
      return {
        badge: "bg-amber-100 text-amber-700",
        card: "border-amber-200 bg-amber-50",
        icon: <AlertTriangle size={18} className="text-amber-600" />,
      };
    }
    return {
      badge: "bg-emerald-100 text-emerald-700",
      card: "border-emerald-200 bg-emerald-50",
      icon: <HeartPulse size={18} className="text-emerald-600" />,
    };
  };

  const analysisTone = severityTone(analysis?.severity);

  const openReportAnalyzer = () => {
    if (reportAnalyzing || reportAnalysisLockRef.current || Boolean(reportBusyMessage)) return;
    // Always show the review modal first. The report is only generated when the
    // user explicitly clicks "Generate report" on the final step.
    setReportWizardStep(0);
    setReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <PageHeader
        kicker="Health"
        title="Your wellbeing at a glance"
        description="Profile, vitals, symptoms, medications, and appointments in one place."
        actions={
          <>
            <button
              type="button"
              onClick={openReportAnalyzer}
              disabled={
                reportAnalyzing || reportAnalysisLockRef.current || Boolean(reportBusyMessage)
              }
              className={ui.btnPrimary}
            >
              {reportAnalyzing
                ? "Generating…"
                : reportBusyMessage
                ? "Report in progress"
                : "Analyze my report"}
            </button>
            <Link href="/dashboard/settings" className={ui.btnSecondary}>
              Open settings
            </Link>
          </>
        }
      />

      {/* Report readiness modal – guided review */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeReportModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--panel-border)] bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={ui.kicker}>Prepare your report</p>
                <h3 className="mt-2 text-xl font-bold text-[var(--text)]">
                  Review the details before generating your AI summary
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  We will use your available health data to create a polished report. You can review
                  each section or skip it and continue with what is already here.
                </p>
              </div>
              <button
                onClick={closeReportModal}
                className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text)]">
                  Step {Math.min(reportWizardStep + 1, reportWizardSteps.length)} of{" "}
                  {reportWizardSteps.length}
                </p>
                <span className={ui.chip}>{reportWizardSteps[reportWizardStep]?.status}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--panel-border)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent)] transition-all"
                  style={{
                    width: `${Math.round(((reportWizardStep + 1) / reportWizardSteps.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--panel-border)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--text)]">
                {reportWizardSteps[reportWizardStep]?.title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {reportWizardSteps[reportWizardStep]?.description}
              </p>
              <ul className="mt-4 space-y-2">
                {reportWizardSteps[reportWizardStep]?.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {reportWizardStep > 0 ? (
                  <button
                    onClick={() => setReportWizardStep((currentStep) => Math.max(0, currentStep - 1))}
                    className={ui.btnSecondary}
                  >
                    Back
                  </button>
                ) : null}
                <Link href="/dashboard/settings" onClick={closeReportModal} className={ui.btnSecondary}>
                  Update data
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleReportWizardSkip}
                  disabled={reportAnalyzing}
                  className={ui.btnSecondary}
                >
                  {reportWizardStep === reportWizardSteps.length - 1 ? "Skip and generate" : "Skip"}
                </button>
                <button
                  onClick={handleReportWizardAdvance}
                  disabled={reportAnalyzing}
                  className={ui.btnPrimary}
                >
                  {reportAnalyzing
                    ? "Analyzing…"
                    : reportWizardStep === reportWizardSteps.length - 1
                    ? "Generate report"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {healthError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {healthError}
        </div>
      )}

      {reportBusyMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {reportBusyMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Profile, Vitals, Analysis */}
          <div className="space-y-6">
            {/* Profile & BMI */}
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={ui.iconBadge}>
                    <Activity size={16} />
                  </span>
                  <h2 className={ui.cardTitle}>Profile</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--bg-soft)] px-2.5 py-1">
                  <GoalProgressRing
                    value={reportReadiness}
                    target={100}
                    size={40}
                    strokeWidth={6}
                    color="blue"
                  />
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {reportReadiness}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Height", value: profile?.height_cm ? `${profile.height_cm} cm` : "—" },
                  { label: "Weight", value: profile?.weight_kg ? `${profile.weight_kg} kg` : "—" },
                  { label: "Age", value: profile?.age ?? "—" },
                  { label: "BMI", value: bmi ?? "—" },
                ].map((item) => (
                  <div key={item.label} className={`${ui.subtle} p-3`}>
                    <p className={ui.label}>{item.label}</p>
                    <p className="mt-1 text-lg font-bold text-[var(--text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Latest vitals */}
            <Panel>
              <div className="mb-4 flex items-center gap-2.5">
                <span className={ui.iconBadge}>
                  <HeartPulse size={16} />
                </span>
                <h2 className={ui.cardTitle}>Latest vitals</h2>
              </div>
              {latestVitals ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Heart rate",
                      value: latestVitals.heart_rate ? `${latestVitals.heart_rate} bpm` : "—",
                    },
                    {
                      label: "Blood pressure",
                      value:
                        latestVitals.systolic && latestVitals.diastolic
                          ? `${latestVitals.systolic}/${latestVitals.diastolic}`
                          : "—",
                    },
                    {
                      label: "Temperature",
                      value: latestVitals.temperature_c ? `${latestVitals.temperature_c} °C` : "—",
                    },
                    {
                      label: "SpO₂",
                      value: latestVitals.spo2 ? `${latestVitals.spo2}%` : "—",
                    },
                  ].map((item) => (
                    <div key={item.label} className={`${ui.subtle} p-3`}>
                      <p className={ui.label}>{item.label}</p>
                      <p className="mt-1 text-lg font-bold text-[var(--text)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${ui.subtle} p-4 text-center text-sm text-[var(--muted)]`}>
                  No vitals logged yet.
                </div>
              )}
            </Panel>

            {/* Vitals input + analysis */}
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={ui.iconBadge}>
                    <Stethoscope size={16} />
                  </span>
                  <h2 className={ui.cardTitle}>Health analysis</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${analysisTone.badge}`}
                >
                  {analysisTone.icon}
                  {analysis?.severity ?? "Awaiting data"}
                </span>
              </div>

              <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmitVitals}>
                <label className="space-y-1">
                  <span className={ui.label}>Heart rate</span>
                  <input
                    type="number"
                    value={heartRateInput}
                    onChange={(e) => setHeartRateInput(e.target.value)}
                    className={ui.input}
                  />
                </label>
                <label className="space-y-1">
                  <span className={ui.label}>Systolic</span>
                  <input
                    type="number"
                    value={systolicInput}
                    onChange={(e) => setSystolicInput(e.target.value)}
                    className={ui.input}
                  />
                </label>
                <label className="space-y-1">
                  <span className={ui.label}>Diastolic</span>
                  <input
                    type="number"
                    value={diastolicInput}
                    onChange={(e) => setDiastolicInput(e.target.value)}
                    className={ui.input}
                  />
                </label>
                <label className="space-y-1">
                  <span className={ui.label}>Temp (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureInput}
                    onChange={(e) => setTemperatureInput(e.target.value)}
                    className={ui.input}
                  />
                </label>
                <label className="space-y-1">
                  <span className={ui.label}>SpO₂ (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={spo2Input}
                    onChange={(e) => setSpo2Input(e.target.value)}
                    className={ui.input}
                  />
                </label>
                <button
                  type="submit"
                  disabled={submittingVitals}
                  className={`col-span-2 ${ui.btnPrimary}`}
                >
                  {submittingVitals ? "Saving…" : "Save and analyze"}
                </button>
              </form>

              {vitalsMessage && (
                <p className={`mt-4 ${ui.subtle} p-3 text-sm text-[var(--muted)]`}>
                  {vitalsMessage}
                </p>
              )}

              {analysis ? (
                <div className={`mt-5 rounded-xl border p-4 ${analysisTone.card}`}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Summary</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{analysis.summary}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Probable condition</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {analysis.probable_condition ?? "No clear pattern detected."}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Diet suggestions</p>
                      {analysis.diet_suggestions?.length ? (
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                          {analysis.diet_suggestions.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--muted)]">No diet suggestions yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`mt-5 ${ui.subtle} p-4 text-center text-sm text-[var(--muted)]`}>
                  Awaiting analysis — log vitals to receive insight.
                </div>
              )}
            </Panel>
          </div>

          {/* Right column: Symptoms, Medications, Appointments */}
          <div className="space-y-6">
            {/* Symptoms */}
            <Panel>
              <div className="mb-4 flex items-center gap-2.5">
                <span className={ui.iconBadge}>
                  <Thermometer size={16} />
                </span>
                <h2 className={ui.cardTitle}>Symptoms</h2>
              </div>
              <div className="space-y-2">
                {symptoms.length > 0 ? (
                  symptoms.map((symptom) => (
                    <div
                      key={symptom.id}
                      className={`flex items-start justify-between gap-3 ${ui.subtle} p-3`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text)]">{symptom.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {symptom.notes ?? "No notes"}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Severity {symptom.severity ?? "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={`${ui.subtle} p-4 text-center text-sm text-[var(--muted)]`}>
                    No symptoms logged yet.
                  </div>
                )}
              </div>
            </Panel>

            {/* Medications */}
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={ui.iconBadge}>
                    <Pill size={16} />
                  </span>
                  <h2 className={ui.cardTitle}>Medications</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--bg-soft)] px-2.5 py-1">
                  <GoalProgressRing
                    value={medications.length > 0 ? (takenMedications.size > 0 ? 100 : 0) : 0}
                    target={100}
                    size={36}
                    strokeWidth={6}
                    color="blue"
                  />
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {takenMedications.size}/{medications.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {medications.length > 0 ? (
                  medications.map((med) => (
                    <div
                      key={med.id}
                      className={`flex items-center justify-between gap-3 ${ui.subtle} p-3`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text)]">{med.name}</p>
                        <p className="text-xs text-[var(--muted)]">{med.dosage ?? "No dosage"}</p>
                        {med.next_due && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                            Next: {new Date(med.next_due).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {takenMedications.has(med.id) ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Taken
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTakeMedication(med.id)}
                          disabled={actionLoading === `med-${med.id}`}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                        >
                          {actionLoading === `med-${med.id}` ? "…" : "Mark taken"}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`${ui.subtle} p-4 text-center text-sm text-[var(--muted)]`}>
                    No medication reminders.
                  </div>
                )}
              </div>
            </Panel>

            {/* Appointments */}
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={ui.iconBadge}>
                    <CalendarDays size={16} />
                  </span>
                  <h2 className={ui.cardTitle}>Appointments</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--bg-soft)] px-2.5 py-1">
                  <GoalProgressRing
                    value={
                      appointments.length > 0
                        ? Math.round((attendedAppointments.size / appointments.length) * 100)
                        : 0
                    }
                    target={100}
                    size={36}
                    strokeWidth={6}
                    color="blue"
                  />
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {attendedAppointments.size}/{appointments.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {appointments.length > 0 ? (
                  appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className={`flex items-center justify-between gap-3 ${ui.subtle} p-3`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text)]">{appt.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {new Date(appt.scheduled_for).toLocaleString()}
                        </p>
                        {appt.notified && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                            Reminder sent
                          </p>
                        )}
                      </div>
                      {attendedAppointments.has(appt.id) ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Attended
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAttendAppointment(appt.id)}
                          disabled={actionLoading === `appt-${appt.id}`}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                        >
                          {actionLoading === `appt-${appt.id}` ? "…" : "Mark attended"}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`${ui.subtle} p-4 text-center text-sm text-[var(--muted)]`}>
                    No appointments planned.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}