"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createGoal,
  deleteGoal,
  getAiGoalSuggestions,
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
  Droplets,
  Activity,
  Loader2,
  X,
} from "lucide-react";
import { useToasts, ToastContainer } from "@/components/Toast";
import { EmptyState, GoalProgressRing, PageHeader, Panel, SectionHeader, ui } from "@/components/ui";

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTailored, setAiTailored] = useState(false);

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

  const handleGenerateAiSuggestions = async () => {
    if (!token || aiLoading) return;
    setAiLoading(true);
    try {
      const suggestions = await getAiGoalSuggestions(token);
      setGoalSuggestions(suggestions);
      setAiTailored(true);
      setShowSuggestions(true);
      success(
        suggestions.length > 0
          ? `HealthQuest AI proposed ${suggestions.length} goal${suggestions.length === 1 ? "" : "s"} from your health data.`
          : "No new goals to suggest right now.",
      );
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      error("Unable to generate AI goals right now. Try again in a moment.");
    } finally {
      setAiLoading(false);
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
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <PageHeader
        kicker="Goals"
        title="Build healthy momentum"
        description="Create, track, and complete goals. Use AI suggestions or set your own targets."
      />

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${ui.card} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={ui.iconBadge}>
                <Droplets size={16} />
              </span>
              <div>
                <p className={ui.cardTitle}>Hydration</p>
                <p className="text-xs text-[var(--muted)]">Log water intake to keep your streak alive.</p>
              </div>
            </div>
            <button
              onClick={handleLogHydration}
              disabled={actionLoading === "hydration"}
              className={ui.btnPrimary}
            >
              {actionLoading === "hydration" ? "Logging…" : "Log"}
            </button>
          </div>
          <label className="mt-4 block">
            <span className={ui.label}>Amount (mL)</span>
            <input
              type="number"
              min={50}
              value={hydrationAmount}
              onChange={(e) => setHydrationAmount(Math.max(50, Number(e.target.value) || 50))}
              className={`mt-1 ${ui.input}`}
            />
          </label>
        </div>

        <div className={`${ui.card} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={ui.iconBadge}>
                <Activity size={16} />
              </span>
              <div>
                <p className={ui.cardTitle}>Exercise</p>
                <p className="text-xs text-[var(--muted)]">Log a quick workout to build habit streaks.</p>
              </div>
            </div>
            <button
              onClick={handleLogExercise}
              disabled={actionLoading === "exercise"}
              className={ui.btnPrimary}
            >
              {actionLoading === "exercise" ? "Logging…" : "Log"}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={ui.label}>Minutes</span>
              <input
                type="number"
                min={5}
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(Math.max(5, Number(e.target.value) || 5))}
                className={`mt-1 ${ui.input}`}
              />
            </label>
            <label className="block">
              <span className={ui.label}>Intensity</span>
              <select
                value={exerciseIntensity}
                onChange={(e) => setExerciseIntensity(e.target.value)}
                className={`mt-1 ${ui.input}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Goal suggestions */}
      {showSuggestions && (
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={ui.kicker}>Suggestions</p>
              <div className="mt-2 flex items-center gap-2">
                <h2 className={ui.sectionTitle}>
                  {aiTailored ? "Tailored to your health status" : "Suggested for you"}
                </h2>
                {goalSuggestions.length > 0 && (
                  <span className={ui.chip}>{goalSuggestions.length}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAiSuggestions}
                disabled={aiLoading}
                className={ui.btnPrimary}
              >
                {aiLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {aiLoading ? "Reading your health data…" : "Generate from my health data"}
              </button>
              <button
                onClick={() => setShowSuggestions(false)}
                className={ui.btnGhost}
              >
                Hide
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            AI goals are built from your profile, latest vitals, recent symptoms, medications, and
            the last 7 days of activity. They are wellness habits, not medical advice.
          </p>

          {aiLoading ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 w-72 flex-shrink-0 animate-pulse rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)]"
                />
              ))}
            </div>
          ) : goalSuggestions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--bg-soft)] p-6 text-sm text-[var(--muted)]">
              No suggestions right now. Tap &ldquo;Generate from my health data&rdquo; for goals based
              on your current health status.
            </div>
          ) : (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {goalSuggestions.map((suggestion) => (
                <button
                  key={suggestion.title}
                  onClick={() => setPopupSuggestion(suggestion)}
                  className="w-72 flex-shrink-0 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-4 text-left transition hover:border-[var(--accent)]/40 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{suggestion.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-[var(--muted)]">
                    {suggestion.description}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-[var(--accent)]">
                    {suggestion.reason}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                    <Plus size={12} /> Tap to add
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Suggestion detail popup modal */}
      {popupSuggestion && (
        <div className={ui.modalOverlay}>
          <div className={ui.modalCard}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={ui.kicker}>Suggested goal</p>
                <h3 className="mt-2 text-xl font-bold text-[var(--text)]">
                  {popupSuggestion.title}
                </h3>
              </div>
              <button
                onClick={() => setPopupSuggestion(null)}
                className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-[var(--muted)]">{popupSuggestion.description}</p>
            <p className="mt-3 border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--text)]">
              {popupSuggestion.reason}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => handleCreateGoalFromSuggestion(popupSuggestion)}
                disabled={savingGoalId === popupSuggestion.title}
                className={`flex-1 ${ui.btnPrimary}`}
              >
                {savingGoalId === popupSuggestion.title ? "Adding…" : "Add this goal"}
              </button>
              <button onClick={() => setPopupSuggestion(null)} className={ui.btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create custom goal */}
      <Panel>
        <SectionHeader title="Create" subtitle="Set your own goal" />
        <form onSubmit={handleCreateNewGoal} className="mt-4 space-y-4">
          {goalFormError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {goalFormError}
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)]">Goal title *</span>
            <input
              type="text"
              value={createGoalTitle}
              onChange={(e) => setCreateGoalTitle(e.target.value)}
              placeholder="e.g. Run a 5K, Meditate daily"
              className={`mt-1 ${ui.input}`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)]">Description</span>
            <textarea
              value={createGoalDescription}
              onChange={(e) => setCreateGoalDescription(e.target.value)}
              placeholder="Why is this goal important?"
              rows={2}
              className={`mt-1 ${ui.input}`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)]">Target value (optional)</span>
            <input
              type="number"
              value={createGoalTarget}
              onChange={(e) =>
                setCreateGoalTarget(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 5, 30, 100"
              min={1}
              className={`mt-1 ${ui.input}`}
            />
          </label>
          <button type="submit" disabled={creatingGoal} className={`w-full ${ui.btnPrimary}`}>
            {creatingGoal ? "Creating…" : "Create goal"}
          </button>
        </form>
      </Panel>

      {/* Active goals */}
      <Panel>
        <SectionHeader
          title="Active"
          subtitle="Goals in progress"
          action={<span className={ui.chip}>{activeGoals.length}</span>}
        />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)]"
                />
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <EmptyState
              title="No active goals yet"
              description="Create one or add a suggestion above to get started."
            />
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const target = goal.target_value ?? 1;
                const current = goal.current_value ?? 0;
                const progress = Math.min(Math.round((current / target) * 100), 100);
                return (
                  <div key={goal.id} className={`group ${ui.card} p-4`}>
                    <div className="flex items-start gap-3">
                      <Circle size={18} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">{goal.title}</p>
                            {goal.description && (
                              <p className="mt-1 text-xs text-[var(--muted)]">{goal.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            disabled={savingGoalId === goal.id}
                            className="rounded-lg p-1.5 text-[var(--muted)] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            aria-label="Delete goal"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {target ? (
                          <div className="mt-4 flex items-center gap-4">
                            <GoalProgressRing
                              value={current}
                              target={target}
                              size={60}
                              strokeWidth={8}
                              color="blue"
                            />
                            <div className="flex-1">
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="font-medium text-[var(--muted)]">Progress</span>
                                <span className="font-semibold text-[var(--text)]">{progress}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--panel-border)]">
                                <div
                                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-[var(--muted)]">
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
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                className="w-24 rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateGoalProgress(
                                    goal.id,
                                    typeof editingGoalValue === "number" ? editingGoalValue : 0
                                  )
                                }
                                disabled={savingGoalId === goal.id}
                                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                              >
                                {savingGoalId === goal.id ? "…" : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingGoalId(null)}
                                className="rounded-lg border border-[var(--panel-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
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
                                  className="rounded-lg border border-[var(--panel-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:opacity-60"
                                >
                                  Update
                                </button>
                              )}
                              {target && progress < 100 && (
                                <button
                                  onClick={() => handleCompleteGoal(goal.id)}
                                  disabled={savingGoalId === goal.id}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
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
      </Panel>

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <Panel>
          <SectionHeader
            title="Completed"
            subtitle="Done and dusted"
            action={<span className={ui.chip}>{completedGoals.length}</span>}
          />
          <div className="mt-4 divide-y divide-[var(--panel-border)]">
            {completedGoals.map((goal) => {
              const target = goal.target_value ?? 1;
              const current = goal.current_value ?? 0;
              return (
                <div key={goal.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--muted)] line-through">
                      {goal.title}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-[var(--muted)]">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {target && (
                      <span className="text-xs text-[var(--muted)]">
                        {current}/{target}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Done
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={savingGoalId === goal.id}
                      className="rounded-lg p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
