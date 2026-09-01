import tips from "./health-tips.json";

export type HealthTip = {
  id: string;
  title: string;
  category: string;
  message: string;
};

const HEALTH_TIP_HISTORY_KEY = "healthquest.health_tips.history";
const HEALTH_TIP_PENDING_KEY = "healthquest.health_tips.pending";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getHistory(): string[] {
  return readJson<string[]>(HEALTH_TIP_HISTORY_KEY) ?? [];
}

function setHistory(history: string[]) {
  writeJson(HEALTH_TIP_HISTORY_KEY, history);
}

function getTips(): HealthTip[] {
  return tips as HealthTip[];
}

export function queueNextHealthTip(): HealthTip | null {
  if (typeof window === "undefined") return null;

  const catalog = getTips();
  if (catalog.length === 0) return null;

  const history = getHistory();
  let tip = catalog.find((entry) => !history.includes(entry.id));

  if (!tip) {
    tip = catalog[0];
    setHistory([]);
  }

  writeJson(HEALTH_TIP_PENDING_KEY, {
    ...tip,
    queuedAt: Date.now(),
  });

  return tip;
}

export function getPendingHealthTip(): HealthTip | null {
  if (typeof window === "undefined") return null;
  const pending = readJson<HealthTip>(HEALTH_TIP_PENDING_KEY);
  return pending ?? null;
}

export function clearPendingHealthTip() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HEALTH_TIP_PENDING_KEY);
}

export function markHealthTipSeen(tipId: string) {
  if (typeof window === "undefined") return;

  const history = getHistory();
  if (!history.includes(tipId)) {
    history.push(tipId);
    const catalogLength = getTips().length;
    const trimmed = history.slice(-catalogLength);
    setHistory(trimmed);
  }

  clearPendingHealthTip();
}
