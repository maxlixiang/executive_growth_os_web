import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { requireUser } from "@/lib/auth/require-user";
import type { ReviewPeriod } from "./periods";

function localDate(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function withinPeriod(value: string, timezone: string, period: ReviewPeriod) {
  const date = localDate(value, timezone);
  return date >= period.start && date <= period.end;
}

function assertResults(results: Array<{ error: { message: string } | null }>) {
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function buildPeriodContext(
  client: SupabaseClient<Database>,
  userId: string,
  period: ReviewPeriod,
) {
  const { data: journey, error: journeyError } = await client.from("learning_journeys").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (journeyError) throw new Error(journeyError.message);
  if (!journey) throw new Error("Active journey required");
  const wideStart = new Date(`${period.start}T00:00:00.000Z`);
  wideStart.setUTCDate(wideStart.getUTCDate() - 1);
  const wideEnd = new Date(`${period.nextStart}T00:00:00.000Z`);
  wideEnd.setUTCDate(wideEnd.getUTCDate() + 1);
  const [profile, state, focuses, daily, sessions, evidence, gaps, progress] = await Promise.all([
    client.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    client.from("user_growth_state").select("overall_goal, capability_assessments, strengths, weaknesses, knowledge_gaps, practice_gaps, recent_training_direction, summary").eq("user_id", userId).filter("journey_id", "eq", journey.id).maybeSingle(),
    client.from("user_focuses").select("priority, capabilities(code, title_en)").eq("user_id", userId).filter("journey_id", "eq", journey.id).eq("is_active", true).order("priority"),
    client.from("daily_reflections").select("reflection_date, raw_content, analysis, responsibility_hint").eq("user_id", userId).filter("journey_id", "eq", journey.id).gte("reflection_date", period.start).lte("reflection_date", period.end).order("reflection_date"),
    client.from("study_sessions").select("session_type, concept_score, application_score, resulting_status, committed_at, knowledge_concepts(concept_code, title_en, capability_id)").eq("user_id", userId).filter("journey_id", "eq", journey.id).eq("is_valid", true).gte("committed_at", wideStart.toISOString()).lt("committed_at", wideEnd.toISOString()).order("committed_at"),
    client.from("practice_evidence").select("evidence_level, context, user_role, action, decision, outcome, limitations, next_evidence_needed, created_at, capabilities(code, title_en)").eq("user_id", userId).filter("journey_id", "eq", journey.id).eq("review_status", "confirmed").gte("created_at", wideStart.toISOString()).lt("created_at", wideEnd.toISOString()).order("created_at"),
    client.from("growth_gaps").select("gap_type, title, detail, status, created_at, capabilities(code, title_en), knowledge_concepts(concept_code, title_en)").eq("user_id", userId).filter("journey_id", "eq", journey.id).gte("created_at", wideStart.toISOString()).lt("created_at", wideEnd.toISOString()).order("created_at"),
    client.from("knowledge_progress").select("status, review_count, consecutive_successes, last_concept_score, last_application_score, next_review_at, updated_at, knowledge_concepts(concept_code, title_en, capability_id)").eq("user_id", userId).filter("journey_id", "eq", journey.id),
  ]);
  assertResults([profile, state, focuses, daily, sessions, evidence, gaps, progress]);
  const timezone = profile.data?.timezone ?? "Asia/Shanghai";
  return JSON.stringify({
    period: { start: period.start, end: period.end, timezone },
    growth_state_before_review: state.data,
    current_focus: focuses.data,
    daily_reflections: daily.data,
    study_and_quiz_sessions: (sessions.data ?? []).filter((item) => withinPeriod(item.committed_at, timezone, period)),
    practice_evidence: (evidence.data ?? []).filter((item) => withinPeriod(item.created_at, timezone, period)),
    gaps_created_in_period: (gaps.data ?? []).filter((item) => withinPeriod(item.created_at, timezone, period)),
    current_knowledge_progress: progress.data,
  });
}

export async function getReviewHistory() {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (journeyError) throw new Error(journeyError.message);
  if (!journey) return { monthly: [], quarterly: [], interviews: [] };
  const [monthly, quarterly, interviews] = await Promise.all([
    supabase.from("monthly_reviews").select("id, review_number, title, period_start, period_end, created_at").eq("user_id", user.id).eq("journey_id", journey.id).order("review_number", { ascending: false }),
    supabase.from("quarterly_reviews").select("id, period_start, period_end, status, created_at").eq("user_id", user.id).filter("journey_id", "eq", journey.id).order("period_start", { ascending: false }),
    supabase.from("interview_sessions").select("id, title, feedback_markdown, status, started_at, completed_at, quarterly_reviews(period_start)").eq("user_id", user.id).filter("journey_id", "eq", journey.id).order("started_at", { ascending: false }),
  ]);
  assertResults([monthly, quarterly, interviews]);
  return { monthly: monthly.data ?? [], quarterly: quarterly.data ?? [], interviews: interviews.data ?? [] };
}

export async function getFlexibleReview(id: string) {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (journeyError) throw new Error(journeyError.message);
  if (!journey) return null;
  const { data, error } = await supabase.from("monthly_reviews").select("*").eq("id", id).eq("user_id", user.id).eq("journey_id", journey.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMonthlyReview(periodStart: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("monthly_reviews").select("*").eq("user_id", user.id).eq("period_start", periodStart).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getQuarterlyReview(periodStart: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("quarterly_reviews").select("*").eq("user_id", user.id).eq("period_start", periodStart).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
