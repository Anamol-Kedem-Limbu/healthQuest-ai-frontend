"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  createProfile as apiCreateProfile,
  createVitals as apiCreateVitals,
  createSymptom as apiCreateSymptom,
  updatePreferences as apiUpdatePreferences,
  createMedication as apiCreateMedication,
  createAppointment as apiCreateAppointment,
} from "@/lib/api";
import Spinner from "@/components/spinner";
import { SkeletonBlock } from "@/components/skeleton";

function computeHydrationIntervalMinutes(litersPerDay: number): number | null {
  if (!Number.isFinite(litersPerDay) || litersPerDay <= 0) {
    return null;
  }

  const reminderCount = Math.max(4, Math.min(12, Math.round(litersPerDay * 4)));
  return Math.max(60, Math.round((24 * 60) / reminderCount));
}

export default function SetupPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [age, setAge] = useState<number | "">("");
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-step form state
  const [step, setStep] = useState(1);

  // Vitals
  const [heartRate, setHeartRate] = useState<number | "">("");
  const [systolic, setSystolic] = useState<number | "">("");
  const [diastolic, setDiastolic] = useState<number | "">("");
  const [temperatureC, setTemperatureC] = useState<number | "">("");
  const [spo2, setSpo2] = useState<number | "">("");

  // Symptoms (dynamic)
  const [symptoms, setSymptoms] = useState<Array<{ name: string; severity?: number | null; notes?: string }>>([
    { name: "", severity: null, notes: "" },
  ]);

  // Habits/preferences
  const [hydrationLitersPerDay, setHydrationLitersPerDay] = useState<number | "">("");
  const [exerciseMinutesPerDay, setExerciseMinutesPerDay] = useState<number | "">("");

  // Medications and appointments
  const [medications, setMedications] = useState<Array<{ name: string; dosage?: string }>>([]);
  const [appointments, setAppointments] = useState<Array<{ title: string; scheduled_for: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!token) {
      setError("Missing authentication token.");
      setSubmitting(false);
      return;
    }

    try {
      // 1) Create profile with the core health details required for onboarding completion
      await apiCreateProfile(token, {
        height_cm: heightCm === "" ? null : Number(heightCm),
        weight_kg: weightKg === "" ? null : Number(weightKg),
        age: age === "" ? null : Number(age),
        body_type: bodyType,
        activity_level: activityLevel,
      });

      // 2) Create initial vitals if any provided
      if (heartRate !== "" || systolic !== "" || diastolic !== "" || temperatureC !== "" || spo2 !== "") {
        try {
          await apiCreateVitals(token, {
            measured_at: new Date().toISOString(),
            heart_rate: heartRate === "" ? null : Number(heartRate),
            systolic: systolic === "" ? null : Number(systolic),
            diastolic: diastolic === "" ? null : Number(diastolic),
            temperature_c: temperatureC === "" ? null : Number(temperatureC),
            spo2: spo2 === "" ? null : Number(spo2),
          });
        } catch (e) {
          // ignore vitals errors
        }
      }

      // 3) Create symptoms
      for (const s of symptoms) {
        if (s.name && s.name.trim()) {
          try {
            await apiCreateSymptom(token, { name: s.name.trim(), severity: s.severity ?? null, notes: s.notes ?? null });
          } catch (e) {
            // ignore individual symptom errors
          }
        }
      }

      // 4) Update preferences and spread hydration reminders across the user’s daily water target
      try {
        const dailyHydrationLiters = hydrationLitersPerDay === "" ? null : Number(hydrationLitersPerDay);
        await apiUpdatePreferences(token, {
          hydration_interval_minutes: dailyHydrationLiters === null ? null : computeHydrationIntervalMinutes(dailyHydrationLiters),
          hydration_enabled: dailyHydrationLiters !== null && dailyHydrationLiters > 0,
          exercise_enabled: exerciseMinutesPerDay !== "" ? true : false,
          exercise_time: null,
          daily_summary_enabled: false,
          daily_summary_time: null,
        });
      } catch (e) {
        // ignore preferences errors
      }

      // 5) Create medications
      for (const m of medications) {
        if (m.name && m.name.trim()) {
          try {
            await apiCreateMedication(token, { name: m.name.trim(), dosage: m.dosage ?? null });
          } catch (e) {}
        }
      }

      // 6) Create appointments
      for (const a of appointments) {
        if (a.title && a.scheduled_for) {
          try {
            await apiCreateAppointment(token, { title: a.title.trim(), scheduled_for: a.scheduled_for, remind_before_minutes: null });
          } catch (e) {}
        }
      }

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || `API error: ${err.status}`);
      } else {
        setError("Failed to save profile.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addSymptom = () => setSymptoms((s) => [...s, { name: "", severity: null, notes: "" }]);
  const updateSymptom = (idx: number, patch: Partial<{ name: string; severity?: number | null; notes?: string }>) =>
    setSymptoms((s) => s.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  const removeSymptom = (idx: number) => setSymptoms((s) => s.filter((_, i) => i !== idx));

  const addMedication = () => setMedications((m) => [...m, { name: "", dosage: "" }]);
  const updateMedication = (idx: number, patch: Partial<{ name: string; dosage?: string }>) =>
    setMedications((m) => m.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  const removeMedication = (idx: number) => setMedications((m) => m.filter((_, i) => i !== idx));

  const addAppointment = () => setAppointments((a) => [...a, { title: "", scheduled_for: "" }]);
  const updateAppointment = (idx: number, patch: Partial<{ title: string; scheduled_for: string }>) =>
    setAppointments((a) => a.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  const removeAppointment = (idx: number) => setAppointments((a) => a.filter((_, i) => i !== idx));

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-semibold">Set up your health profile</h1>
          <p className="mt-2 text-sm text-gray-600">A few details to personalize your dashboard and recommendations.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              {submitting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <Spinner size={28} className="text-teal-600" />
                </div>
              )}

              {/* Step indicator */}
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <span className={step === 1 ? "font-semibold text-teal-600" : ""}>1. Profile</span>
                <span>•</span>
                <span className={step === 2 ? "font-semibold text-teal-600" : ""}>2. Vitals</span>
                <span>•</span>
                <span className={step === 3 ? "font-semibold text-teal-600" : ""}>3. Symptoms</span>
                <span>•</span>
                <span className={step === 4 ? "font-semibold text-teal-600" : ""}>4. Habits</span>
                <span>•</span>
                <span className={step === 5 ? "font-semibold text-teal-600" : ""}>5. Meds & Appts</span>
              </div>

              {step === 1 && (
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="col-span-1">
                      <span className="block text-sm text-gray-600">Height (cm)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={heightCm as any} onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label className="col-span-1">
                      <span className="block text-sm text-gray-600">Weight (kg)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={weightKg as any} onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label className="col-span-1">
                      <span className="block text-sm text-gray-600">Age</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={age as any} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <label>
                      <span className="block text-sm text-gray-600">Body type (optional)</span>
                      <select className="mt-1 w-full rounded-md border px-3 py-2" value={bodyType ?? ""} onChange={(e) => setBodyType(e.target.value || null)}>
                        <option value="">Select</option>
                        <option value="slim">Slim</option>
                        <option value="slim-fit">Slim fit</option>
                        <option value="average">Average</option>
                        <option value="athletic">Athletic</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </label>
                    <label>
                      <span className="block text-sm text-gray-600">Activity level (optional)</span>
                      <select className="mt-1 w-full rounded-md border px-3 py-2" value={activityLevel ?? ""} onChange={(e) => setActivityLevel(e.target.value || null)}>
                        <option value="">Select</option>
                        <option value="sedentary">Sedentary</option>
                        <option value="light">Lightly active</option>
                        <option value="moderate">Moderately active</option>
                        <option value="active">Active</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-sm font-medium">Initial vitals (optional)</h3>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <label>
                      <span className="block text-sm text-gray-600">Heart rate (bpm)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={heartRate as any} onChange={(e) => setHeartRate(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="block text-sm text-gray-600">Systolic</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={systolic as any} onChange={(e) => setSystolic(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="block text-sm text-gray-600">Diastolic</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={diastolic as any} onChange={(e) => setDiastolic(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <label>
                      <span className="block text-sm text-gray-600">Temperature (°C)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" step="0.1" value={temperatureC as any} onChange={(e) => setTemperatureC(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="block text-sm text-gray-600">SpO₂ (%)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={spo2 as any} onChange={(e) => setSpo2(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-sm font-medium">Symptoms (optional)</h3>
                  <div className="space-y-3 mt-3">
                    {symptoms.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <label className="block text-sm text-gray-600">Name</label>
                          <input className="mt-1 w-full rounded-md border px-3 py-2" value={s.name} onChange={(e) => updateSymptom(idx, { name: e.target.value })} />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm text-gray-600">Severity (1-10)</label>
                          <input type="number" min={1} max={10} className="mt-1 w-full rounded-md border px-3 py-2" value={s.severity ?? ""} onChange={(e) => updateSymptom(idx, { severity: e.target.value === "" ? null : Number(e.target.value) })} />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-sm text-gray-600">Notes</label>
                          <input className="mt-1 w-full rounded-md border px-3 py-2" value={s.notes ?? ""} onChange={(e) => updateSymptom(idx, { notes: e.target.value })} />
                        </div>
                        <div className="col-span-1">
                          <button type="button" className="text-red-600" onClick={() => removeSymptom(idx)}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div>
                      <button type="button" onClick={addSymptom} className="rounded-md border px-3 py-1 text-sm">Add symptom</button>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="text-sm font-medium">Daily habits</h3>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <label>
                      <span className="block text-sm text-gray-600">Daily water target (liters)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" step="0.1" min="0.5" value={hydrationLitersPerDay as any} onChange={(e) => setHydrationLitersPerDay(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                    <label>
                      <span className="block text-sm text-gray-600">Exercise (minutes per day)</span>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" type="number" value={exerciseMinutesPerDay as any} onChange={(e) => setExerciseMinutesPerDay(e.target.value === "" ? "" : Number(e.target.value))} />
                    </label>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h3 className="text-sm font-medium">Medications & Appointments (optional)</h3>
                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium">Medications</h4>
                      {medications.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <label className="block text-sm text-gray-600">Name</label>
                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={m.name} onChange={(e) => updateMedication(idx, { name: e.target.value })} />
                          </div>
                          <div className="col-span-5">
                            <label className="block text-sm text-gray-600">Dosage</label>
                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={m.dosage ?? ""} onChange={(e) => updateMedication(idx, { dosage: e.target.value })} />
                          </div>
                          <div className="col-span-2">
                            <button type="button" className="text-red-600" onClick={() => removeMedication(idx)}>Remove</button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2">
                        <button type="button" onClick={addMedication} className="rounded-md border px-3 py-1 text-sm">Add medication</button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Appointments</h4>
                      {appointments.map((a, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-6">
                            <label className="block text-sm text-gray-600">Title</label>
                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={a.title} onChange={(e) => updateAppointment(idx, { title: e.target.value })} />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-sm text-gray-600">Scheduled for</label>
                            <input type="datetime-local" className="mt-1 w-full rounded-md border px-3 py-2" value={a.scheduled_for} onChange={(e) => updateAppointment(idx, { scheduled_for: e.target.value })} />
                          </div>
                          <div className="col-span-2">
                            <button type="button" className="text-red-600" onClick={() => removeAppointment(idx)}>Remove</button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2">
                        <button type="button" onClick={addAppointment} className="rounded-md border px-3 py-1 text-sm">Add appointment</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex items-center gap-3 mt-4">
                {step > 1 && (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-md border px-4 py-2">Back</button>
                )}

                {step < 5 && (
                  <button type="button" onClick={() => setStep((s) => s + 1)} className="rounded-md bg-gray-100 px-4 py-2">Next</button>
                )}

                {step === 5 && (
                  <button disabled={submitting} className="flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-white" type="submit">
                    {submitting ? (
                      <>
                        <Spinner size={16} className="text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save and continue"
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
