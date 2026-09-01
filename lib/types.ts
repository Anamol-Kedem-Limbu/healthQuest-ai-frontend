export type UserResponse = {
  id: string;
  email: string;
  display_name: string | null;
  consent_data_storage: boolean;
  consent_model_training: boolean;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  is_completed: boolean;
};

export type GoalSuggestion = {
  title: string;
  description: string;
  target_value: number | null;
  reason: string;
  category: string;
};

export type SymptomTriage = {
  category: string;
  recommendation: string;
  confidence: number;
};

export type Streak = {
  id: string;
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
};

export type Badge = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  awarded_at: string | null;
};

export type ChatLog = {
  id: string;
  user_id: string | null;
  user_message: string;
  assistant_response: string | null;
  confidence_score: number | null;
  retrieval_failed: number | null;
  created_at: string | null;
};

export type Dashboard = {
  goals: Goal[];
  streak: Streak | null;
  badges: Badge[];
  recent_chat_logs: ChatLog[];
  total_points: number;
};

export type AnalyticsTrendPoint = {
  timestamp: string;
  value?: number;
  amount_ml?: number;
};

export type AnalyticsTrendPayload = {
  hydration: AnalyticsTrendPoint[];
  exercise: Array<{
    timestamp: string;
    duration_minutes: number;
    intensity: string;
  }>;
  vitals: {
    heart_rate: AnalyticsTrendPoint[];
    systolic: AnalyticsTrendPoint[];
    diastolic: AnalyticsTrendPoint[];
    temperature_c: AnalyticsTrendPoint[];
    spo2: AnalyticsTrendPoint[];
  };
};

export type LeaderboardEntry = {
  user_id: string;
  display_name: string | null;
  total_points: number;
};

export type HealthProfile = {
  id: string;
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  body_type: string | null;
  activity_level: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type VitalsEntry = {
  id: string;
  user_id: string;
  measured_at: string | null;
  heart_rate: number | null;
  systolic: number | null;
  diastolic: number | null;
  temperature_c: number | null;
  spo2: number | null;
};

export type VitalsAnalysisResult = {
  is_anomalous: boolean;
  severity: string;
  summary: string;
  triggered_fields: string[];
  probable_condition: string | null;
  diet_suggestions: string[];
};

export type HealthReportAnalysisResult = {
  id?: string;
  created_at?: string | null;
  patient_name?: string;
  patient_sex?: string | null;
  is_complete: boolean;
  missing_sections: string[];
  report_title: string;
  watermark: string;
  sections: Array<{ title: string; content: string }>;
  suggested_goals: Array<{ title: string; description: string; target_value: number | null; reason: string }>;
  report_text: string;
  confidence: number | null;
};

export type AgentStep = {
  tool: string;
  input: Record<string, unknown> | string | null;
  output: Record<string, unknown> | string | null;
};

export type AgentResponse = {
  response: string;
  notification_created: boolean;
  steps: AgentStep[];
};

export type SymptomEntry = {
  id: string;
  user_id: string;
  reported_at: string | null;
  name: string;
  severity: number | null;
  notes: string | null;
};

export type NotificationPreference = {
  id: string;
  user_id: string;
  hydration_interval_minutes: number | null;
  hydration_enabled: boolean;
  exercise_enabled: boolean;
  exercise_time: string | null;
  daily_summary_enabled: boolean;
  daily_summary_time: string | null;
  updated_at: string | null;
};

export type MedicationReminder = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule_cron: string | null;
  next_due: string | null;
  active: boolean;
};

export type AppointmentEntry = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  scheduled_for: string;
  remind_before_minutes: number | null;
  notified: boolean;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  created_at: string | null;
  read: boolean;
};
