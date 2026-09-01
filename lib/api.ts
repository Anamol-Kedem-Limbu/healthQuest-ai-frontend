import type {
  AppointmentEntry,
  AnalyticsTrendPayload,
  Badge,
  ChatLog,
  Dashboard,
  HealthReportAnalysisResult,
  Goal,
  GoalSuggestion,
  HealthProfile,
  MedicationReminder,
  NotificationItem,
  NotificationPreference,
  Streak,
  SymptomEntry,
  SymptomTriage,
  TokenResponse,
  UserResponse,
  VitalsAnalysisResult,
  VitalsEntry,
} from "./types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "healthquest.access_token";
const REFRESH_TOKEN_STORAGE_KEY = "healthquest.refresh_token";
const TOKEN_EXPIRES_AT_STORAGE_KEY = "healthquest.token_expires_at";
export const AUTH_TOKENS_CHANGED_EVENT = "healthquest.auth.tokens.changed";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStoredValue(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
}

function readStoredTimestamp(key: string): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeStoredTimestamp(key: string, value: number | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, String(value));
  }
}

function emitAuthTokens(accessToken: string | null, refreshToken: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_TOKENS_CHANGED_EVENT, { detail: { accessToken, refreshToken } }));
}

export function persistAuthTokens(accessToken: string, refreshToken: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  writeStoredValue(TOKEN_STORAGE_KEY, accessToken);
  writeStoredValue(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  writeStoredTimestamp(TOKEN_EXPIRES_AT_STORAGE_KEY, expiresAt);
  emitAuthTokens(accessToken, refreshToken);
}

export function clearAuthTokens() {
  writeStoredValue(TOKEN_STORAGE_KEY, null);
  writeStoredValue(REFRESH_TOKEN_STORAGE_KEY, null);
  writeStoredTimestamp(TOKEN_EXPIRES_AT_STORAGE_KEY, null);
  emitAuthTokens(null, null);
}

export function getStoredAccessToken(): string | null {
  const accessToken = readStoredValue(TOKEN_STORAGE_KEY);
  const expiresAt = readStoredTimestamp(TOKEN_EXPIRES_AT_STORAGE_KEY);
  if (!accessToken || !expiresAt) {
    if (accessToken || expiresAt) {
      clearAuthTokens();
    }
    return null;
  }
  if (Date.now() > expiresAt) {
    clearAuthTokens();
    return null;
  }
  return accessToken;
}

export function getStoredRefreshToken(): string | null {
  const refreshToken = readStoredValue(REFRESH_TOKEN_STORAGE_KEY);
  const expiresAt = readStoredTimestamp(TOKEN_EXPIRES_AT_STORAGE_KEY);
  if (!refreshToken || !expiresAt) {
    if (refreshToken || expiresAt) {
      clearAuthTokens();
    }
    return null;
  }
  if (Date.now() > expiresAt) {
    clearAuthTokens();
    return null;
  }
  return refreshToken;
}

export function getSessionExpiryTime(): number | null {
  return readStoredTimestamp(TOKEN_EXPIRES_AT_STORAGE_KEY);
}

export async function refreshAccessToken(): Promise<{ access_token: string; refresh_token: string }> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    throw new ApiError(401, "No refresh token available.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    clearAuthTokens();
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }

  const payload = (await response.json()) as TokenResponse;
  persistAuthTokens(payload.access_token, payload.refresh_token);
  return { access_token: payload.access_token, refresh_token: payload.refresh_token };
}

async function requestJson<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const authToken = token ?? getStoredAccessToken();
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Unable to reach the server at ${API_BASE_URL}. Make sure the backend is running.`);
  }

  if (!response.ok && response.status === 401 && authToken && path !== "/auth/login" && path !== "/auth/register" && path !== "/auth/refresh") {
    try {
      const refreshed = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${refreshed.access_token}`);
      try {
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
          cache: "no-store",
        });
      } catch {
        throw new ApiError(0, `Unable to reach the server at ${API_BASE_URL}. Make sure the backend is running.`);
      }
    } catch {
      throw new ApiError(401, "Your session expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message = response.statusText;
    if (text) {
      try {
        const body = JSON.parse(text);
        if (body.detail) {
          message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        } else if (body.error) {
          message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
        } else {
          message = text;
        }
      } catch {
        message = text;
      }
    }
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return requestJson<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: {
  email: string;
  password: string;
  display_name?: string;
  consent_data_storage?: boolean;
  consent_model_training?: boolean;
}): Promise<UserResponse> {
  return requestJson<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string): Promise<UserResponse> {
  return requestJson<UserResponse>("/auth/me", { method: "GET" }, token);
}

export async function getDashboard(token: string): Promise<Dashboard> {
  return requestJson<Dashboard>("/dashboard", { method: "GET" }, token);
}

export async function getHealthTrends(token: string): Promise<AnalyticsTrendPayload> {
  const payload = await requestJson<AnalyticsTrendPayload>("/health/analytics/trends", { method: "GET" }, token);

  return {
    ...payload,
    hydration: (payload.hydration ?? []).map((point) => ({
      ...point,
      value: typeof point.value === "number" ? point.value : Number(point.amount_ml ?? 0),
    })),
  };
}

export async function getLeaderboard(token: string): Promise<Array<{ user_id: string; display_name: string | null; total_points: number }>> {
  return requestJson<Array<{ user_id: string; display_name: string | null; total_points: number }>>("/leaderboard", { method: "GET" }, token);
}

export async function listGoals(token: string): Promise<Goal[]> {
  return requestJson<Goal[]>("/goals", { method: "GET" }, token);
}

export async function createGoal(token: string, payload: { title: string; description?: string; target_value?: number | null }): Promise<Goal> {
  return requestJson<Goal>("/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateGoal(token: string, goalId: string, payload: { current_value?: number | null; is_completed?: boolean | null }): Promise<Goal> {
  return requestJson<Goal>(`/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteGoal(token: string, goalId: string): Promise<void> {
  await requestJson<void>(`/goals/${goalId}`, { method: "DELETE" }, token);
}

export async function getStreak(token: string): Promise<Streak | null> {
  return requestJson<Streak | null>("/streaks/me", { method: "GET" }, token);
}

export async function getBadges(token: string): Promise<Badge[]> {
  return requestJson<Badge[]>("/badges/me", { method: "GET" }, token);
}

export async function getGoalSuggestions(token: string): Promise<GoalSuggestion[]> {
  return requestJson<GoalSuggestion[]>("/goals/suggestions", { method: "GET" }, token);
}

export async function getAiGoalSuggestions(token: string): Promise<GoalSuggestion[]> {
  return requestJson<GoalSuggestion[]>("/goals/suggestions/ai", { method: "POST" }, token);
}

export async function triageSymptoms(token: string, payload: { symptom_text: string; severity?: number | null; duration_days?: number | null }): Promise<SymptomTriage> {
  return requestJson<SymptomTriage>("/monitor/symptoms/triage", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function sendChat(token: string, message: string): Promise<{ response: string; confidence: number; retrieval_failed: boolean }> {
  return requestJson<{ response: string; confidence: number; retrieval_failed: boolean }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  }, token);
}

export async function runAgent(token: string, message: string): Promise<import("./types").AgentResponse> {
  return requestJson<import("./types").AgentResponse>("/chat/agent", {
    method: "POST",
    body: JSON.stringify({ message }),
  }, token);
}

export async function getRecentChatLogs(token: string): Promise<ChatLog[]> {
  const dashboard = await getDashboard(token);
  return dashboard.recent_chat_logs;
}

export async function getMyProfile(token: string): Promise<HealthProfile> {
  return requestJson<HealthProfile>("/profiles/me", { method: "GET" }, token);
}

export async function createProfile(token: string, payload: {
  height_cm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
  body_type?: string | null;
  activity_level?: string | null;
}): Promise<HealthProfile> {
  return requestJson<HealthProfile>("/profiles/me", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateProfile(token: string, payload: {
  height_cm?: number | null;
  weight_kg?: number | null;
  age?: number | null;
  body_type?: string | null;
  activity_level?: string | null;
}): Promise<HealthProfile> {
  return requestJson<HealthProfile>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export async function getBMI(token: string): Promise<{ bmi: number }> {
  return requestJson<{ bmi: number }>("/profiles/me/bmi", { method: "GET" }, token);
}

export async function getVitals(token: string): Promise<VitalsEntry[]> {
  return requestJson<VitalsEntry[]>("/monitor/vitals", { method: "GET" }, token);
}

export async function createVitals(token: string, payload: {
  measured_at?: string | null;
  heart_rate?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  temperature_c?: number | null;
  spo2?: number | null;
}): Promise<VitalsEntry> {
  return requestJson<VitalsEntry>("/monitor/vitals", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function analyzeVitals(token: string, payload: {
  heart_rate?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  temperature_c?: number | null;
  spo2?: number | null;
}): Promise<VitalsAnalysisResult> {
  return requestJson<VitalsAnalysisResult>("/monitor/vitals/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function analyzeHealthReport(token: string): Promise<HealthReportAnalysisResult> {
  return requestJson<HealthReportAnalysisResult>("/monitor/report/analyze", {
    method: "POST",
  }, token);
}

export async function getLatestHealthReport(token: string): Promise<HealthReportAnalysisResult> {
  return requestJson<HealthReportAnalysisResult>("/monitor/report/latest", { method: "GET" }, token);
}

export async function listHealthReports(token: string): Promise<HealthReportAnalysisResult[]> {
  return requestJson<HealthReportAnalysisResult[]>("/monitor/report", { method: "GET" }, token);
}

export async function getHealthReport(token: string, reportId: string): Promise<HealthReportAnalysisResult> {
  return requestJson<HealthReportAnalysisResult>(`/monitor/report/${reportId}`, { method: "GET" }, token);
}

export async function downloadHealthReportPdf(token: string, reportId: string): Promise<Blob> {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/monitor/report/${reportId}/pdf`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Unable to reach the server at ${API_BASE_URL}. Make sure the backend is running.`);
  }

  if (!response.ok && response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${refreshed.access_token}`);
    try {
      response = await fetch(`${API_BASE_URL}/monitor/report/${reportId}/pdf`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, `Unable to reach the server at ${API_BASE_URL}. Make sure the backend is running.`);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message = response.statusText;
    if (text) {
      try {
        const body = JSON.parse(text);
        if (body.detail) {
          message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        } else if (body.error) {
          message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
        } else {
          message = text;
        }
      } catch {
        message = text;
      }
    }
    throw new ApiError(response.status, message || response.statusText);
  }

  return response.blob();
}

export async function getSymptoms(token: string): Promise<SymptomEntry[]> {
  return requestJson<SymptomEntry[]>("/monitor/symptoms", { method: "GET" }, token);
}

export async function createSymptom(token: string, payload: {
  name: string;
  severity?: number | null;
  notes?: string | null;
}): Promise<SymptomEntry> {
  return requestJson<SymptomEntry>("/monitor/symptoms", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteSymptom(token: string, symptomId: string): Promise<void> {
  await requestJson<void>(`/monitor/symptoms/${symptomId}`, { method: "DELETE" }, token);
}

export async function getPreferences(token: string): Promise<NotificationPreference> {
  return requestJson<NotificationPreference>("/monitor/preferences", { method: "GET" }, token);
}

export async function updatePreferences(token: string, payload: {
  hydration_interval_minutes?: number | null;
  hydration_enabled?: boolean | null;
  exercise_enabled?: boolean | null;
  exercise_time?: string | null;
  daily_summary_enabled?: boolean | null;
  daily_summary_time?: string | null;
}): Promise<NotificationPreference> {
  return requestJson<NotificationPreference>("/monitor/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function saveAllSettings(token: string, payload: {
  profile?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  vitals?: Record<string, unknown> | null;
  symptom?: Record<string, unknown> | null;
  symptoms?: Record<string, unknown>[] | null;
  medication?: Record<string, unknown> | null;
  appointment?: Record<string, unknown> | null;
}): Promise<{ status: string; saved: string[] }> {
  return requestJson<{ status: string; saved: string[] }>("/monitor/settings/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getMedications(token: string): Promise<MedicationReminder[]> {
  return requestJson<MedicationReminder[]>("/monitor/medications", { method: "GET" }, token);
}

export async function createMedication(token: string, payload: {
  name: string;
  dosage?: string | null;
  schedule_cron?: string | null;
  next_due?: string | null;
}): Promise<MedicationReminder> {
  return requestJson<MedicationReminder>("/monitor/medications", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteMedication(token: string, medicationId: string): Promise<void> {
  await requestJson<void>(`/monitor/medications/${medicationId}`, { method: "DELETE" }, token);
}

export async function getAppointments(token: string): Promise<AppointmentEntry[]> {
  return requestJson<AppointmentEntry[]>("/monitor/appointments", { method: "GET" }, token);
}

export async function createAppointment(token: string, payload: {
  title: string;
  notes?: string | null;
  scheduled_for: string;
  remind_before_minutes?: number | null;
}): Promise<AppointmentEntry> {
  return requestJson<AppointmentEntry>("/monitor/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAppointment(token: string, appointmentId: string): Promise<void> {
  await requestJson<void>(`/monitor/appointments/${appointmentId}`, { method: "DELETE" }, token);
}

export async function getNotifications(token: string): Promise<NotificationItem[]> {
  return requestJson<NotificationItem[]>("/monitor/notifications", { method: "GET" }, token);
}

export async function markNotificationRead(token: string, notificationId: string): Promise<void> {
  await requestJson<void>(`/monitor/notifications/${notificationId}/read`, { method: "POST" }, token);
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await requestJson<void>("/monitor/notifications/read-all", { method: "POST" }, token);
}

export async function logHydration(token: string, amountMl: number): Promise<unknown> {
  return requestJson("/monitor/hydration", {
    method: "POST",
    body: JSON.stringify({ amount_ml: amountMl }),
  }, token);
}

export async function logExercise(token: string, durationMinutes: number, intensity?: string | null): Promise<unknown> {
  return requestJson("/monitor/exercise", {
    method: "POST",
    body: JSON.stringify({ duration_minutes: durationMinutes, intensity: intensity ?? null }),
  }, token);
}

export async function takeMedication(token: string, medicationId: string): Promise<unknown> {
  return requestJson(`/monitor/medications/${medicationId}/take`, {
    method: "POST",
  }, token);
}

export async function attendAppointment(token: string, appointmentId: string): Promise<unknown> {
  return requestJson(`/monitor/appointments/${appointmentId}/attend`, {
    method: "POST",
  }, token);
}
