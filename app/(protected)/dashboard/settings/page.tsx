"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  HeartPulse,
  Pill,
  Plus,
  Thermometer,
  UserRound,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  deleteAppointment,
  deleteMedication,
  deleteSymptom,
  getAppointments,
  getMedications,
  getMyProfile,
  getPreferences,
  getSymptoms,
  getVitals,
  saveAllSettings,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToasts, ToastContainer } from "@/components/Toast";
import { PageHeader, ui } from "@/components/ui";
import type {
  AppointmentEntry,
  HealthProfile,
  MedicationReminder,
  NotificationPreference,
  SymptomEntry,
  VitalsEntry,
} from "@/lib/types";

const emptyProfileForm = {
  height_cm: "",
  weight_kg: "",
  age: "",
  body_type: "",
  activity_level: "",
};

const emptyVitalsForm = {
  heart_rate: "",
  systolic: "",
  diastolic: "",
  temperature_c: "",
  spo2: "",
};

const emptySymptomForm = {
  name: "",
  severity: "5",
  notes: "",
};

const emptyMedicationForm = {
  name: "",
  dosage: "",
  schedule_cron: "",
  next_due: "",
};

const emptyAppointmentForm = {
  title: "",
  notes: "",
  scheduled_for: "",
  remind_before_minutes: "60",
};

const defaultPreferencesForm = {
  daily_water_target_liters: "2.0",
  hydration_enabled: true,
  exercise_enabled: true,
  exercise_time: "07:00",
  daily_summary_enabled: true,
  daily_summary_time: "20:00",
};

type PreferencesForm = typeof defaultPreferencesForm;
type PendingSymptom = { name: string; severity: string; notes: string };

const fieldClass = ui.input;
const labelClass = ui.label;

function computeHydrationIntervalMinutes(litersPerDay: number): number | null {
  if (!Number.isFinite(litersPerDay) || litersPerDay <= 0) {
    return null;
  }
  const reminderCount = Math.max(4, Math.min(12, Math.round(litersPerDay * 4)));
  return Math.max(60, Math.round((24 * 60) / reminderCount));
}

function estimateHydrationTargetLiters(intervalMinutes: number | null): string {
  if (!intervalMinutes || intervalMinutes <= 0) {
    return "2.0";
  }
  const liters = (24 * 60) / (4 * intervalMinutes);
  return Math.max(0.5, Number(liters.toFixed(1))).toString();
}

function SettingsCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${ui.panel} p-5`}>
      <div className="mb-4 flex items-start gap-3">
        <span className={ui.iconBadge}>{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { toasts, removeToast, success, error: toastError } = useToasts();

  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [vitalsForm, setVitalsForm] = useState(emptyVitalsForm);
  const [symptomForm, setSymptomForm] = useState(emptySymptomForm);
  const [pendingSymptoms, setPendingSymptoms] = useState<PendingSymptom[]>([]);
  const [preferencesForm, setPreferencesForm] = useState<PreferencesForm>(defaultPreferencesForm);
  const [medicationForm, setMedicationForm] = useState(emptyMedicationForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);

  // Snapshot of the last saved / loaded state, used for accurate change detection.
  const savedProfileRef = useRef(emptyProfileForm);
  const savedPreferencesRef = useRef<PreferencesForm>(defaultPreferencesForm);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [
        profileData,
        symptomsData,
        vitalsData,
        preferencesData,
        medicationData,
        appointmentData,
      ] = await Promise.all([
        getMyProfile(token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) return null;
          throw caughtError;
        }),
        getSymptoms(token).catch(() => []),
        getVitals(token).catch(() => []),
        getPreferences(token).catch(() => null),
        getMedications(token).catch(() => []),
        getAppointments(token).catch(() => []),
      ]);

      setSymptoms(symptomsData);
      setVitals(vitalsData);
      setMedications(medicationData);
      setAppointments(appointmentData);

      const nextProfileForm = profileData
        ? {
            height_cm: profileData.height_cm?.toString() ?? "",
            weight_kg: profileData.weight_kg?.toString() ?? "",
            age: profileData.age?.toString() ?? "",
            body_type: profileData.body_type ?? "",
            activity_level: profileData.activity_level ?? "",
          }
        : emptyProfileForm;
      setProfileForm(nextProfileForm);
      savedProfileRef.current = nextProfileForm;

      const nextPreferencesForm: PreferencesForm = preferencesData
        ? {
            daily_water_target_liters: estimateHydrationTargetLiters(
              preferencesData.hydration_interval_minutes
            ),
            hydration_enabled: preferencesData.hydration_enabled,
            exercise_enabled: preferencesData.exercise_enabled,
            exercise_time: preferencesData.exercise_time ?? "07:00",
            daily_summary_enabled: preferencesData.daily_summary_enabled,
            daily_summary_time: preferencesData.daily_summary_time ?? "20:00",
          }
        : defaultPreferencesForm;
      setPreferencesForm(nextPreferencesForm);
      savedPreferencesRef.current = nextPreferencesForm;
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to load settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const hasProfileChanges = useMemo(
    () => JSON.stringify(profileForm) !== JSON.stringify(savedProfileRef.current),
    [profileForm]
  );
  const hasPreferencesChanges = useMemo(
    () => JSON.stringify(preferencesForm) !== JSON.stringify(savedPreferencesRef.current),
    [preferencesForm]
  );
  const hasVitalsChanges = Object.values(vitalsForm).some((v) => v !== "");
  const hasMedicationChanges = Boolean(
    medicationForm.name ||
      medicationForm.dosage ||
      medicationForm.schedule_cron ||
      medicationForm.next_due
  );
  const hasAppointmentChanges = Boolean(
    appointmentForm.title ||
      appointmentForm.notes ||
      appointmentForm.scheduled_for ||
      appointmentForm.remind_before_minutes !== "60"
  );

  const stagedSymptoms = useMemo<PendingSymptom[]>(() => {
    const list = [...pendingSymptoms];
    if (symptomForm.name.trim()) {
      list.push({ ...symptomForm, name: symptomForm.name.trim() });
    }
    return list;
  }, [pendingSymptoms, symptomForm]);

  const dirty =
    hasProfileChanges ||
    hasPreferencesChanges ||
    hasVitalsChanges ||
    stagedSymptoms.length > 0 ||
    hasMedicationChanges ||
    hasAppointmentChanges;

  const addPendingSymptom = () => {
    const name = symptomForm.name.trim();
    if (!name) {
      setError("Enter a symptom name before adding it.");
      return;
    }
    setError(null);
    setPendingSymptoms((cur) => [...cur, { ...symptomForm, name }]);
    setSymptomForm(emptySymptomForm);
  };

  const handleSaveAll = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (!dirty) {
      setError("No changes to save yet.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Parameters<typeof saveAllSettings>[1] = {};

      if (hasProfileChanges) {
        payload.profile = {
          height_cm: profileForm.height_cm === "" ? null : Number(profileForm.height_cm),
          weight_kg: profileForm.weight_kg === "" ? null : Number(profileForm.weight_kg),
          age: profileForm.age === "" ? null : Number(profileForm.age),
          body_type: profileForm.body_type || null,
          activity_level: profileForm.activity_level || null,
        };
      }

      if (hasPreferencesChanges) {
        const liters =
          preferencesForm.daily_water_target_liters === ""
            ? null
            : Number(preferencesForm.daily_water_target_liters);
        payload.preferences = {
          hydration_interval_minutes:
            liters === null ? null : computeHydrationIntervalMinutes(liters),
          hydration_enabled: preferencesForm.hydration_enabled,
          exercise_enabled: preferencesForm.exercise_enabled,
          exercise_time: preferencesForm.exercise_time || null,
          daily_summary_enabled: preferencesForm.daily_summary_enabled,
          daily_summary_time: preferencesForm.daily_summary_time || null,
        };
      }

      if (hasVitalsChanges) {
        payload.vitals = {
          heart_rate: vitalsForm.heart_rate === "" ? null : Number(vitalsForm.heart_rate),
          systolic: vitalsForm.systolic === "" ? null : Number(vitalsForm.systolic),
          diastolic: vitalsForm.diastolic === "" ? null : Number(vitalsForm.diastolic),
          temperature_c:
            vitalsForm.temperature_c === "" ? null : Number(vitalsForm.temperature_c),
          spo2: vitalsForm.spo2 === "" ? null : Number(vitalsForm.spo2),
        };
      }

      if (stagedSymptoms.length > 0) {
        payload.symptoms = stagedSymptoms.map((entry) => ({
          name: entry.name,
          severity: entry.severity === "" ? null : Number(entry.severity),
          notes: entry.notes || null,
        }));
      }

      if (hasMedicationChanges) {
        payload.medication = {
          name: medicationForm.name,
          dosage: medicationForm.dosage || null,
          schedule_cron: medicationForm.schedule_cron || null,
          next_due: medicationForm.next_due
            ? new Date(medicationForm.next_due).toISOString()
            : null,
        };
      }

      if (hasAppointmentChanges) {
        payload.appointment = {
          title: appointmentForm.title,
          notes: appointmentForm.notes || null,
          scheduled_for: appointmentForm.scheduled_for
            ? new Date(appointmentForm.scheduled_for).toISOString()
            : new Date().toISOString(),
          remind_before_minutes:
            appointmentForm.remind_before_minutes === ""
              ? 60
              : Number(appointmentForm.remind_before_minutes),
        };
      }

      const result = await saveAllSettings(token, payload);
      if (result.status !== "ok") {
        throw new Error("Bulk save failed");
      }

      setVitalsForm(emptyVitalsForm);
      setSymptomForm(emptySymptomForm);
      setPendingSymptoms([]);
      setMedicationForm(emptyMedicationForm);
      setAppointmentForm(emptyAppointmentForm);

      await loadData();
      success(
        result.saved.length > 0
          ? `Saved: ${result.saved.join(", ")}`
          : "All changes saved."
      );
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to save your settings changes.";
      setError(message);
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  const removeExistingSymptom = async (symptomId: string) => {
    if (!token) return;
    try {
      await deleteSymptom(token, symptomId);
      setSymptoms((cur) => cur.filter((s) => s.id !== symptomId));
      success("Symptom removed.");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      toastError("Unable to remove the symptom.");
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!token) return;
    try {
      await deleteMedication(token, medicationId);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      toastError("Unable to remove the medication reminder.");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!token) return;
    try {
      await deleteAppointment(token, appointmentId);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      toastError("Unable to remove the appointment.");
    }
  };

  if (!token) return null;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <PageHeader
        kicker="Settings"
        title="Your health dashboard"
        description="Profile, vitals, symptoms and reminders — saved together and fed into your AI health analysis."
        actions={
          <Link href="/dashboard" className={ui.btnSecondary}>
            Back to dashboard
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-[var(--panel-border)] bg-[var(--bg-soft)]"
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-5">
          <div className="space-y-5">
            <SettingsCard
              icon={<UserRound size={18} />}
              title="Profile"
              hint="Used to calculate BMI and personalise analysis."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(
                  [
                    ["height_cm", "Height (cm)", "number", "e.g. 175"],
                    ["weight_kg", "Weight (kg)", "number", "e.g. 68"],
                    ["age", "Age", "number", "e.g. 27"],
                    ["body_type", "Body type", "text", "e.g. average"],
                    ["activity_level", "Activity level", "text", "e.g. moderate"],
                  ] as const
                ).map(([key, text, type, placeholder]) => (
                  <label key={key} className="space-y-1.5">
                    <span className={labelClass}>{text}</span>
                    <input
                      type={type}
                      value={profileForm[key]}
                      onChange={(e) =>
                        setProfileForm((cur) => ({ ...cur, [key]: e.target.value }))
                      }
                      className={fieldClass}
                      placeholder={placeholder}
                    />
                  </label>
                ))}
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<BellRing size={18} />}
              title="Reminder preferences"
              hint="Controls hydration, exercise and summary notifications."
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Daily water target (L)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={preferencesForm.daily_water_target_liters}
                      onChange={(e) =>
                        setPreferencesForm((cur) => ({
                          ...cur,
                          daily_water_target_liters: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Exercise time</span>
                    <input
                      type="time"
                      value={preferencesForm.exercise_time}
                      onChange={(e) =>
                        setPreferencesForm((cur) => ({ ...cur, exercise_time: e.target.value }))
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Summary time</span>
                    <input
                      type="time"
                      value={preferencesForm.daily_summary_time}
                      onChange={(e) =>
                        setPreferencesForm((cur) => ({
                          ...cur,
                          daily_summary_time: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["hydration_enabled", "Hydration reminders"],
                      ["exercise_enabled", "Exercise reminders"],
                      ["daily_summary_enabled", "Daily summary emails"],
                    ] as const
                  ).map(([key, text]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2.5 text-sm text-[var(--text)]"
                    >
                      <input
                        type="checkbox"
                        checked={preferencesForm[key]}
                        onChange={(e) =>
                          setPreferencesForm((cur) => ({ ...cur, [key]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      {text}
                    </label>
                  ))}
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<Thermometer size={18} />}
              title="Log vitals"
              hint="Leave blank to skip. A new reading is recorded on save."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(
                    [
                      ["heart_rate", "Heart rate", "1"],
                      ["systolic", "Systolic", "1"],
                      ["diastolic", "Diastolic", "1"],
                      ["temperature_c", "Temp (°C)", "0.1"],
                      ["spo2", "SpO₂ (%)", "0.1"],
                    ] as const
                  ).map(([key, text, step]) => (
                    <label key={key} className="space-y-1.5">
                      <span className={labelClass}>{text}</span>
                      <input
                        type="number"
                        step={step}
                        value={vitalsForm[key]}
                        onChange={(e) =>
                          setVitalsForm((cur) => ({ ...cur, [key]: e.target.value }))
                        }
                        className={fieldClass}
                      />
                    </label>
                  ))}
                </div>

                {vitals.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
                    <p className={labelClass}>Recent readings</p>
                    {vitals.slice(0, 5).map((v) => (
                      <div
                        key={v.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                      >
                        <span className="text-xs text-[var(--muted)]">
                          {v.measured_at ? new Date(v.measured_at).toLocaleString() : "—"}
                        </span>
                        {v.heart_rate != null && (
                          <span className="text-[var(--text)]">HR {v.heart_rate}</span>
                        )}
                        {v.systolic != null && v.diastolic != null && (
                          <span className="text-[var(--text)]">
                            BP {v.systolic}/{v.diastolic}
                          </span>
                        )}
                        {v.temperature_c != null && (
                          <span className="text-[var(--text)]">{v.temperature_c}°C</span>
                        )}
                        {v.spo2 != null && (
                          <span className="text-[var(--text)]">SpO₂ {v.spo2}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<HeartPulse size={18} />}
              title="Symptoms"
              hint="Add one or more — the AI analysis reads your recent symptoms."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Symptom</span>
                    <input
                      value={symptomForm.name}
                      onChange={(e) =>
                        setSymptomForm((cur) => ({ ...cur, name: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPendingSymptom();
                        }
                      }}
                      className={fieldClass}
                      placeholder="e.g. headache"
                    />
                  </label>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={addPendingSymptom}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/16"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>
                <label className="block space-y-1.5">
                  <span className={labelClass}>
                    Severity: <span className="text-[var(--text)]">{symptomForm.severity}</span> / 10
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={symptomForm.severity}
                    onChange={(e) =>
                      setSymptomForm((cur) => ({ ...cur, severity: e.target.value }))
                    }
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Notes (optional)</span>
                  <input
                    value={symptomForm.notes}
                    onChange={(e) =>
                      setSymptomForm((cur) => ({ ...cur, notes: e.target.value }))
                    }
                    className={fieldClass}
                    placeholder="when it started, triggers, etc."
                  />
                </label>

                {pendingSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pendingSymptoms.map((entry, index) => (
                      <span
                        key={`${entry.name}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--text)]"
                      >
                        {entry.name}
                        <span className="text-[var(--muted)]">sev {entry.severity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingSymptoms((cur) => cur.filter((_, i) => i !== index))
                          }
                          className="rounded-full p-0.5 text-[var(--muted)] transition hover:bg-rose-100 hover:text-rose-600"
                          aria-label={`Remove ${entry.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {symptoms.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
                    <p className={labelClass}>Recorded</p>
                    {symptoms.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--text)]">{s.name}</span>
                          <span className="ml-2 text-xs text-[var(--muted)]">
                            {s.notes ?? "No notes"}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            Sev {s.severity ?? "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExistingSymptom(s.id)}
                            className="rounded-lg p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${s.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<Pill size={18} />}
              title="Medication reminder"
              hint="Fill in to add a reminder on save."
            >
              <div className="space-y-4">
                <label className="space-y-1.5 block">
                  <span className={labelClass}>Name</span>
                  <input
                    value={medicationForm.name}
                    onChange={(e) =>
                      setMedicationForm((cur) => ({ ...cur, name: e.target.value }))
                    }
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Dosage</span>
                    <input
                      value={medicationForm.dosage}
                      onChange={(e) =>
                        setMedicationForm((cur) => ({ ...cur, dosage: e.target.value }))
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Next due</span>
                    <input
                      type="datetime-local"
                      value={medicationForm.next_due}
                      onChange={(e) =>
                        setMedicationForm((cur) => ({ ...cur, next_due: e.target.value }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
                {medications.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
                    {medications.map((med) => (
                      <div
                        key={med.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-[var(--text)]">{med.name}</span>
                          <span className="ml-2 text-xs text-[var(--muted)]">
                            {med.dosage ?? "—"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedication(med.id)}
                          className="rounded-lg p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<CalendarDays size={18} />}
              title="Appointment"
              hint="Fill in to schedule a reminder on save."
            >
              <div className="space-y-4">
                <label className="space-y-1.5 block">
                  <span className={labelClass}>Title</span>
                  <input
                    value={appointmentForm.title}
                    onChange={(e) =>
                      setAppointmentForm((cur) => ({ ...cur, title: e.target.value }))
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className={labelClass}>Notes</span>
                  <textarea
                    rows={2}
                    value={appointmentForm.notes}
                    onChange={(e) =>
                      setAppointmentForm((cur) => ({ ...cur, notes: e.target.value }))
                    }
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className={labelClass}>When</span>
                    <input
                      type="datetime-local"
                      value={appointmentForm.scheduled_for}
                      onChange={(e) =>
                        setAppointmentForm((cur) => ({
                          ...cur,
                          scheduled_for: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Reminder (min)</span>
                    <input
                      type="number"
                      value={appointmentForm.remind_before_minutes}
                      onChange={(e) =>
                        setAppointmentForm((cur) => ({
                          ...cur,
                          remind_before_minutes: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
                {appointments.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-[var(--text)]">{appt.title}</span>
                          <span className="ml-2 text-xs text-[var(--muted)]">
                            {new Date(appt.scheduled_for).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="rounded-lg p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingsCard>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <p className="text-xs text-[var(--muted)]">
              {dirty ? "You have unsaved changes." : ""}
            </p>
            <button type="submit" disabled={saving || !dirty} className={ui.btnPrimary}>
              {saving ? "Saving…" : "Save all changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
