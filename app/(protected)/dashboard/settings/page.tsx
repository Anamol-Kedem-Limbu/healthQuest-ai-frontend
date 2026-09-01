"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  HeartPulse,
  Pill,
  Sparkles,
  Thermometer,
  UserRound,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  createAppointment,
  createMedication,
  createProfile,
  createSymptom,
  createVitals,
  deleteAppointment,
  deleteMedication,
  getAppointments,
  getMedications,
  getMyProfile,
  getPreferences,
  getSymptoms,
  getVitals,
  updatePreferences,
  updateProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [vitalsForm, setVitalsForm] = useState(emptyVitalsForm);
  const [symptomForm, setSymptomForm] = useState(emptySymptomForm);
  const [preferencesForm, setPreferencesForm] = useState({
    daily_water_target_liters: "2.0",
    hydration_enabled: true,
    exercise_enabled: true,
    exercise_time: "07:00",
    daily_summary_enabled: true,
    daily_summary_time: "20:00",
  });
  const [medicationForm, setMedicationForm] = useState(emptyMedicationForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [
        profileData,
        vitalsData,
        symptomsData,
        preferencesData,
        medicationData,
        appointmentData,
      ] = await Promise.all([
        getMyProfile(token).catch((caughtError) => {
          if (caughtError instanceof ApiError && caughtError.status === 404) return null;
          throw caughtError;
        }),
        getVitals(token).catch(() => []),
        getSymptoms(token).catch(() => []),
        getPreferences(token).catch(() => null),
        getMedications(token).catch(() => []),
        getAppointments(token).catch(() => []),
      ]);

      setProfile(profileData);
      setVitals(vitalsData);
      setSymptoms(symptomsData);
      setPreferences(preferencesData);
      setMedications(medicationData);
      setAppointments(appointmentData);

      if (profileData) {
        setProfileForm({
          height_cm: profileData.height_cm?.toString() ?? "",
          weight_kg: profileData.weight_kg?.toString() ?? "",
          age: profileData.age?.toString() ?? "",
          body_type: profileData.body_type ?? "",
          activity_level: profileData.activity_level ?? "",
        });
      }

      if (preferencesData) {
        setPreferencesForm({
          daily_water_target_liters: estimateHydrationTargetLiters(
            preferencesData.hydration_interval_minutes
          ),
          hydration_enabled: preferencesData.hydration_enabled,
          exercise_enabled: preferencesData.exercise_enabled,
          exercise_time: preferencesData.exercise_time ?? "07:00",
          daily_summary_enabled: preferencesData.daily_summary_enabled,
          daily_summary_time: preferencesData.daily_summary_time ?? "20:00",
        });
      }
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
  }, [token]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        height_cm: profileForm.height_cm === "" ? null : Number(profileForm.height_cm),
        weight_kg: profileForm.weight_kg === "" ? null : Number(profileForm.weight_kg),
        age: profileForm.age === "" ? null : Number(profileForm.age),
        body_type: profileForm.body_type || null,
        activity_level: profileForm.activity_level || null,
      };
      const savedProfile = profile
        ? await updateProfile(token, payload)
        : await createProfile(token, payload);
      setProfile(savedProfile);
      setError(null);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to save the profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleVitalsSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createVitals(token, {
        heart_rate: vitalsForm.heart_rate === "" ? null : Number(vitalsForm.heart_rate),
        systolic: vitalsForm.systolic === "" ? null : Number(vitalsForm.systolic),
        diastolic: vitalsForm.diastolic === "" ? null : Number(vitalsForm.diastolic),
        temperature_c:
          vitalsForm.temperature_c === "" ? null : Number(vitalsForm.temperature_c),
        spo2: vitalsForm.spo2 === "" ? null : Number(vitalsForm.spo2),
      });
      setVitalsForm(emptyVitalsForm);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to save vitals.");
    } finally {
      setSaving(false);
    }
  };

  const handleSymptomSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createSymptom(token, {
        name: symptomForm.name,
        severity: symptomForm.severity === "" ? null : Number(symptomForm.severity),
        notes: symptomForm.notes || null,
      });
      setSymptomForm(emptySymptomForm);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to save the symptom entry.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const liters =
        preferencesForm.daily_water_target_liters === ""
          ? null
          : Number(preferencesForm.daily_water_target_liters);
      const savedPreferences = await updatePreferences(token, {
        hydration_interval_minutes:
          liters === null ? null : computeHydrationIntervalMinutes(liters),
        hydration_enabled: preferencesForm.hydration_enabled,
        exercise_enabled: preferencesForm.exercise_enabled,
        exercise_time: preferencesForm.exercise_time || null,
        daily_summary_enabled: preferencesForm.daily_summary_enabled,
        daily_summary_time: preferencesForm.daily_summary_time || null,
      });
      setPreferences(savedPreferences);
      setError(null);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleMedicationSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createMedication(token, {
        name: medicationForm.name,
        dosage: medicationForm.dosage || null,
        schedule_cron: medicationForm.schedule_cron || null,
        next_due: medicationForm.next_due
          ? new Date(medicationForm.next_due).toISOString()
          : null,
      });
      setMedicationForm(emptyMedicationForm);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to create the medication reminder.");
    } finally {
      setSaving(false);
    }
  };

  const handleAppointmentSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createAppointment(token, {
        title: appointmentForm.title,
        notes: appointmentForm.notes || null,
        scheduled_for: appointmentForm.scheduled_for
          ? new Date(appointmentForm.scheduled_for).toISOString()
          : new Date().toISOString(),
        remind_before_minutes:
          appointmentForm.remind_before_minutes === ""
            ? 60
            : Number(appointmentForm.remind_before_minutes),
      });
      setAppointmentForm(emptyAppointmentForm);
      await loadData();
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("Unable to create the appointment.");
    } finally {
      setSaving(false);
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
      setError("Unable to remove the medication reminder.");
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
      setError("Unable to remove the appointment.");
    }
  };

  if (!token) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Manage your health profile
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Update your data, preferences, and reminders all in one place.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-[2rem] bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-sky-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <UserRound size={18} className="text-sky-500" />
              Profile
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Height (cm)</span>
                  <input
                    type="number"
                    value={profileForm.height_cm}
                    onChange={(e) =>
                      setProfileForm((cur) => ({ ...cur, height_cm: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Weight (kg)</span>
                  <input
                    type="number"
                    value={profileForm.weight_kg}
                    onChange={(e) =>
                      setProfileForm((cur) => ({ ...cur, weight_kg: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Age</span>
                  <input
                    type="number"
                    value={profileForm.age}
                    onChange={(e) =>
                      setProfileForm((cur) => ({ ...cur, age: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Body type</span>
                  <input
                    value={profileForm.body_type}
                    onChange={(e) =>
                      setProfileForm((cur) => ({ ...cur, body_type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Activity level</span>
                  <input
                    value={profileForm.activity_level}
                    onChange={(e) =>
                      setProfileForm((cur) => ({
                        ...cur,
                        activity_level: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </form>
          </div>

          {/* Preferences */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-violet-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <BellRing size={18} className="text-violet-500" />
              Preferences
            </div>
            <form onSubmit={handlePreferencesSave} className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">
                  Daily water target (liters)
                </span>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preferencesForm.hydration_enabled}
                    onChange={(e) =>
                      setPreferencesForm((cur) => ({
                        ...cur,
                        hydration_enabled: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  Hydration
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preferencesForm.exercise_enabled}
                    onChange={(e) =>
                      setPreferencesForm((cur) => ({
                        ...cur,
                        exercise_enabled: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  Exercise
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Exercise time</span>
                  <input
                    type="time"
                    value={preferencesForm.exercise_time}
                    onChange={(e) =>
                      setPreferencesForm((cur) => ({
                        ...cur,
                        exercise_time: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">
                    Daily summary time
                  </span>
                  <input
                    type="time"
                    value={preferencesForm.daily_summary_time}
                    onChange={(e) =>
                      setPreferencesForm((cur) => ({
                        ...cur,
                        daily_summary_time: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferencesForm.daily_summary_enabled}
                  onChange={(e) =>
                    setPreferencesForm((cur) => ({
                      ...cur,
                      daily_summary_enabled: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Daily summary emails
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save preferences"}
              </button>
            </form>
          </div>

          {/* Vitals */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-amber-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Thermometer size={18} className="text-amber-500" />
              Vitals
            </div>
            <form onSubmit={handleVitalsSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Heart rate</span>
                  <input
                    type="number"
                    value={vitalsForm.heart_rate}
                    onChange={(e) =>
                      setVitalsForm((cur) => ({ ...cur, heart_rate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Systolic</span>
                  <input
                    type="number"
                    value={vitalsForm.systolic}
                    onChange={(e) =>
                      setVitalsForm((cur) => ({ ...cur, systolic: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Diastolic</span>
                  <input
                    type="number"
                    value={vitalsForm.diastolic}
                    onChange={(e) =>
                      setVitalsForm((cur) => ({ ...cur, diastolic: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Temp (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature_c}
                    onChange={(e) =>
                      setVitalsForm((cur) => ({
                        ...cur,
                        temperature_c: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">SpO₂ (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.spo2}
                    onChange={(e) =>
                      setVitalsForm((cur) => ({ ...cur, spo2: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save vitals"}
              </button>
            </form>
          </div>

          {/* Symptoms */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-rose-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <HeartPulse size={18} className="text-rose-500" />
              Symptoms
            </div>
            <form onSubmit={handleSymptomSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Name</span>
                  <input
                    value={symptomForm.name}
                    onChange={(e) =>
                      setSymptomForm((cur) => ({ ...cur, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Severity</span>
                  <input
                    type="number"
                    value={symptomForm.severity}
                    onChange={(e) =>
                      setSymptomForm((cur) => ({ ...cur, severity: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Notes</span>
                <input
                  value={symptomForm.notes}
                  onChange={(e) =>
                    setSymptomForm((cur) => ({ ...cur, notes: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save symptom"}
              </button>
            </form>
            {symptoms.length > 0 && (
              <div className="mt-4 space-y-2">
                {symptoms.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {s.notes ?? "No notes"}
                      </span>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      Sev {s.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-emerald-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Pill size={18} className="text-emerald-500" />
              Medications
            </div>
            <form onSubmit={handleMedicationSave} className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Name</span>
                <input
                  value={medicationForm.name}
                  onChange={(e) =>
                    setMedicationForm((cur) => ({ ...cur, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Dosage</span>
                  <input
                    value={medicationForm.dosage}
                    onChange={(e) =>
                      setMedicationForm((cur) => ({ ...cur, dosage: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Next due</span>
                  <input
                    type="datetime-local"
                    value={medicationForm.next_due}
                    onChange={(e) =>
                      setMedicationForm((cur) => ({
                        ...cur,
                        next_due: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save medication"}
              </button>
            </form>
            {medications.length > 0 && (
              <div className="mt-4 space-y-2">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{med.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {med.dosage ?? "—"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteMedication(med.id)}
                      className="rounded-full p-1 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div className="rounded-[2rem] border border-white/50 bg-gradient-to-br from-indigo-50/80 to-white/70 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
              <CalendarDays size={18} className="text-indigo-500" />
              Appointments
            </div>
            <form onSubmit={handleAppointmentSave} className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Title</span>
                <input
                  value={appointmentForm.title}
                  onChange={(e) =>
                    setAppointmentForm((cur) => ({ ...cur, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Notes</span>
                <textarea
                  rows={2}
                  value={appointmentForm.notes}
                  onChange={(e) =>
                    setAppointmentForm((cur) => ({ ...cur, notes: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">When</span>
                  <input
                    type="datetime-local"
                    value={appointmentForm.scheduled_for}
                    onChange={(e) =>
                      setAppointmentForm((cur) => ({
                        ...cur,
                        scheduled_for: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Reminder (min)</span>
                  <input
                    type="number"
                    value={appointmentForm.remind_before_minutes}
                    onChange={(e) =>
                      setAppointmentForm((cur) => ({
                        ...cur,
                        remind_before_minutes: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save appointment"}
              </button>
            </form>
            {appointments.length > 0 && (
              <div className="mt-4 space-y-2">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{appt.title}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {new Date(appt.scheduled_for).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAppointment(appt.id)}
                      className="rounded-full p-1 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}