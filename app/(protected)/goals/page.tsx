"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createGoal,
  deleteGoal,
  getGoalSuggestions,
  listGoals,
  logHydration,
  logExercise,
  updateGoal,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Goal, GoalSuggestion } from "@/lib/types";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Plus,
  Zap,
  Activity,
  X,
} from "lucide-react";
import { useToasts, ToastContainer } from "@/components/Toast";
import { GoalProgressRing } from "@/components/ui";

export default function GoalsPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { toasts, removeToast, success, error } = useToasts();

  // State – identical to original
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  const [createGoalTitle, setCreateGoalTitle] = useState("");
  const [createGoalDescription, setCreateGoalDescription] = useState("");
  const [createGoalTarget, setCreateGoalTarget] = useState<number | "">("");

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalValue, setEditingGoalValue] = useState<number | "">("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  // New state for suggestion popup
  const [popupSuggestion, setPopupSuggestion] = useState<GoalSuggestion | null>(null);

  const [hydrationAmount, setHydrationAmount] = useState(250);
  const [exerciseMinutes, setExerciseMinutes] = useState(15);
  const [exerciseIntensity, setExerciseIntensity] = useState("low");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- All handlers kept exactly the same ---
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [goalsList, suggestions] = await Promise.all([
          listGoals(token),
          getGoalSuggestions(token),
        ]);
        if (!mounted) return;
        setGoals(goalsList);
        setGoalSuggestions(suggestions);
      } catch (caughtError) {
        if (!mounted) return;
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (caughtError instanceof ApiError && caughtError.status === 429) {
          return;
        }
        error("Unable to load goals.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, logout, router, error]);

  const handleLogHydration = async () => {
    if (!token) return;
    setActionLoading("hydration");
    try {
      await logHydration(token, hydrationAmount);
      success(`💧 Hydration logged: ${hydrationAmount} mL — Keep it up!`);
    } catch {
      error("Unable to log hydration right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogExercise = async () => {
    if (!token) return;
    setActionLoading("exercise");
    try {
      await logExercise(token, exerciseMinutes, exerciseIntensity);
      success(
        `🏃 Exercise logged: ${exerciseMinutes} min (${exerciseIntensity}) — Great work!`
      );
    } catch {
      error("Unable to log exercise right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateGoalFromSuggestion = async (suggestion: GoalSuggestion) => {
    if (!token) return;
    setSavingGoalId(suggestion.title);
    try {
      const goal = await createGoal(token, {
        title: suggestion.title,
        description: suggestion.description,
        target_value: suggestion.target_value,
      });
      setGoals((current) => [goal, ...current]);
      setGoalSuggestions((current) =>
        current.filter((item) => item.title !== suggestion.title)
      );
      success(`✨ Goal added: "${suggestion.title}"`);
      setPopupSuggestion(null); // close popup if open
    } catch (caughtError) {
      error("Unable to add suggested goal. Please try again.");
    } finally {
      setSavingGoalId(null);
    }
  };

  const handleCreateNewGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!createGoalTitle.trim()) {
      setGoalFormError("Goal title is required.");
      return;
    }
    setGoalFormError(null);
    setCreatingGoal(true);
    try {
      const created = await createGoal(token, {
        title: createGoalTitle.trim(),
        description: createGoalDescription.trim() || undefined,
        target_value: createGoalTarget === "" ? null : Number(createGoalTarget),
      });
      setGoals((current) => [created, ...current]);
      setCreateGoalTitle("");
      setCreateGoalDescription("");
      setCreateGoalTarget("");
      success(`🎯 Goal created: "${created.title}"`);
    } catch (caughtError) {
      setGoalFormError("Unable to create the goal. Please try again.");
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, newValue: number) => {
    if (!token) return;
    setSavingGoalId(goalId);
    try {
      const updatedGoal = await updateGoal(token, goalId, {
        current_value: newValue,
      });
      setGoals((current) =>
        current.map((item) => (item.id === goalId ? updatedGoal : item))
      );
      setEditingGoalId(null);
      success("📈 Goal progress updated!");
    } catch (caughtError) {
      error("Unable to update goal progress.");
    } finally {
      setSavingGoalId(null);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!token) return;
    setSavingGoalId(goalId);
    try {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return;
      const updatedGoal = await updateGoal(token, goalId, {
        current_value: goal.target_value ?? goal.current_value,
        is_completed: true,
      });
      setGoals((current) =>
        current.map((item) => (item.id === goalId ? updatedGoal : item))
      );
      success(`🏆 Goal completed: "${goal.title}"!`);
    } catch (caughtError) {
      error("Unable to complete goal.");
    } finally {
      setSavingGoalId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!token || !window.confirm("Are you sure you want to delete this goal?"))
      return;
    setSavingGoalId(goalId);
    try {
      await deleteGoal(token, goalId);
      setGoals((current) => current.filter((item) => item.id !== goalId));
      success("Goal deleted.");
    } catch (caughtError) {
      error("Unable to delete goal.");
    } finally {
      setSavingGoalId(null);
    }
  };

  if (!token) return null;

  const completedGoals = goals.filter((g) => g.is_completed);
  const activeGoals = goals.filter((g) => !g.is_completed);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page title – no card, just elegant typography */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          Goal Management
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Build healthy momentum
        </h1>
        <p className="mt-2 text-slate-500">
          Create, track, and complete goals. Use AI suggestions or set your own targets.
        </p>
      </div>

      {/* Quick actions – large, impossible to miss */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Hydration card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-sky-50/80 to-blue-50/80 p-6 backdrop-blur-sm transition hover:shadow-xl hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Zap size={20} className="text-sky-500" />
                Hydration
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Log water intake and keep your streak alive.
              </p>
            </div>
            <button
              onClick={handleLogHydration}
              disabled={actionLoading === "hydration"}
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 active:scale-95 disabled:opacity-60"
            >
              {actionLoading === "hydration" ? "Logging…" : "Log hydration"}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex-1">
              <span className="text-xs font-medium text-slate-500">Amount (mL)</span>
              <input
                type="number"
                min={50}
                value={hydrationAmount}
                onChange={(e) =>
                  setHydrationAmount(Math.max(50, Number(e.target.value) || 50))
                }
                className="mt-1 w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              />
            </label>
          </div>
        </div>

        {/* Exercise card */}
        <div className="group relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-6 backdrop-blur-sm transition hover:shadow-xl hover:-translate-y-1">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Activity size={20} className="text-emerald-500" />
                Exercise
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Log a quick workout to build habit streaks.
              </p>
            </div>
            <button
              onClick={handleLogExercise}
              disabled={actionLoading === "exercise"}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95 disabled:opacity-60"
            >
              {actionLoading === "exercise" ? "Logging…" : "Log exercise"}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label>
              <span className="text-xs font-medium text-slate-500">Minutes</span>
              <input
                type="number"
                min={5}
                value={exerciseMinutes}
                onChange={(e) =>
                  setExerciseMinutes(Math.max(5, Number(e.target.value) || 5))
                }
                className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-slate-500">Intensity</span>
              <select
                value={exerciseIntensity}
                onChange={(e) => setExerciseIntensity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Goal suggestions – redesigned as a focusable carousel with popup */}
      {showSuggestions && goalSuggestions.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Suggested for you
              </h2>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                {goalSuggestions.length}
              </span>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Hide
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {goalSuggestions.map((suggestion) => (
              <button
                key={suggestion.title}
                onClick={() => setPopupSuggestion(suggestion)}
                className="flex-shrink-0 w-72 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="font-bold text-slate-900">{suggestion.title}</p>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                  {suggestion.description}
                </p>
                <p className="mt-2 text-[11px] font-medium text-amber-700">
                  {suggestion.reason}
                </p>
                <div className="mt-3 inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                  Tap to add
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion detail popup modal */}
      {popupSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">
                  Suggested Goal
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {popupSuggestion.title}
                </h3>
              </div>
              <button
                onClick={() => setPopupSuggestion(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-slate-600">{popupSuggestion.description}</p>
            <p className="mt-3 text-sm text-amber-700 font-medium">
              {popupSuggestion.reason}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleCreateGoalFromSuggestion(popupSuggestion)}
                disabled={savingGoalId === popupSuggestion.title}
                className="flex-1 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:opacity-60"
              >
                {savingGoalId === popupSuggestion.title
                  ? "Adding…"
                  : "Add this goal"}
              </button>
              <button
                onClick={() => setPopupSuggestion(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create custom goal – cleaner form */}
      <div className="rounded-[2rem] border border-white/50 bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={18} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            Create your own goal
          </h2>
        </div>
        <form onSubmit={handleCreateNewGoal} className="space-y-4">
          {goalFormError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {goalFormError}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Goal title *
            </label>
            <input
              type="text"
              value={createGoalTitle}
              onChange={(e) => setCreateGoalTitle(e.target.value)}
              placeholder="e.g., Run a 5K, Meditate daily"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={createGoalDescription}
              onChange={(e) => setCreateGoalDescription(e.target.value)}
              placeholder="Why is this goal important?"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Target value (optional)
            </label>
            <input
              type="number"
              value={createGoalTarget}
              onChange={(e) =>
                setCreateGoalTarget(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="e.g., 5, 30, 100"
              min={1}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creatingGoal}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {creatingGoal ? "Creating…" : "Create goal"}
          </button>
        </form>
      </div>

      {/* Active goals – airy list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Active goals{" "}
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700">
            {activeGoals.length}
          </span>
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            No active goals yet. Create one or add a suggestion above.
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const target = goal.target_value ?? 1;
              const current = goal.current_value ?? 0;
              const progress = Math.min(
                Math.round((current / target) * 100),
                100
              );
              return (
                <div
                  key={goal.id}
                  className="group rounded-2xl border border-white/50 bg-white/70 p-4 backdrop-blur-sm transition hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <Circle
                      size={20}
                      className="mt-1 flex-shrink-0 text-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={savingGoalId === goal.id}
                          className="rounded-lg p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 transition hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {target ? (
                        <div className="mt-4 flex items-center gap-4">
                          <GoalProgressRing
                            value={current}
                            target={target}
                            size={64}
                            strokeWidth={8}
                            color="blue"
                          />
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="font-medium text-slate-500">
                                Progress
                              </span>
                              <span className="font-semibold text-blue-600">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {current} / {target}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {editingGoalId === goal.id ? (
                          <>
                            <input
                              type="number"
                              min={0}
                              value={editingGoalValue}
                              onChange={(e) =>
                                setEditingGoalValue(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                            />
                            <button
                              onClick={() =>
                                handleUpdateGoalProgress(
                                  goal.id,
                                  typeof editingGoalValue === "number"
                                    ? editingGoalValue
                                    : 0
                                )
                              }
                              disabled={savingGoalId === goal.id}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingGoalId === goal.id ? "…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingGoalId(null)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {target && (
                              <button
                                onClick={() => {
                                  setEditingGoalId(goal.id);
                                  setEditingGoalValue(goal.current_value ?? 0);
                                }}
                                disabled={savingGoalId === goal.id}
                                className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Update
                              </button>
                            )}
                            {target && progress < 100 && (
                              <button
                                onClick={() => handleCompleteGoal(goal.id)}
                                disabled={savingGoalId === goal.id}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Complete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed goals – muted list */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Completed goals{" "}
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-700">
              {completedGoals.length}
            </span>
          </h2>
          <div className="space-y-2">
            {completedGoals.map((goal) => {
              const target = goal.target_value ?? 1;
              const current = goal.current_value ?? 0;
              return (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3"
                >
                  <CheckCircle2
                    size={18}
                    className="flex-shrink-0 text-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 line-through">
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-slate-400">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {target && (
                      <span className="text-xs text-slate-400">
                        {current}/{target}
                      </span>
                    )}
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Done
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={savingGoalId === goal.id}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}