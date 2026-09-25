import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function buildGrowthContext(
  client: SupabaseClient<Database>,
  userId: string,
  capabilityId?: string,
) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: journey, error: journeyError } = await client.from("learning_journeys").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (journeyError || !journey) throw new Error(journeyError?.message ?? "Active learning journey required");
  const journeyId = journey.id;
  const [state, focuses, progress, daily, evidence, gaps, monthly, quarterly] = await Promise.all([
    client.from("user_growth_state").select("*").eq("user_id", userId).maybeSingle(),
    client.from("user_focuses").select("priority, note, capabilities(code, title_en)").eq("user_id", userId).eq("is_active", true).order("priority"),
    client.from("knowledge_progress").select("status, review_count, consecutive_successes, last_concept_score, last_application_score, next_review_at, knowledge_concepts(concept_code, title_en, capability_id)").eq("user_id", userId),
    client.from("daily_reflections").select("reflection_date, analysis, responsibility_hint").eq("user_id", userId).filter("journey_id", "eq", journeyId).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
    client.from("practice_evidence").select("evidence_level, context, user_role, action, decision, outcome, limitations, next_evidence_needed, capability_id").eq("user_id", userId).filter("journey_id", "eq", journeyId).eq("review_status", "confirmed").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
    client.from("growth_gaps").select("gap_type, title, detail, status, capability_id, concept_id").eq("user_id", userId).filter("journey_id", "eq", journeyId).eq("status", "open").order("created_at", { ascending: false }).limit(30),
    client.from("monthly_reviews").select("period_start, review_markdown").eq("user_id", userId).filter("journey_id", "eq", journeyId).order("period_start", { ascending: false }).limit(1).maybeSingle(),
    client.from("quarterly_reviews").select("period_start, assessment_markdown, executive_level_gaps, next_quarter_focus").eq("user_id", userId).filter("journey_id", "eq", journeyId).eq("status", "completed").order("period_start", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const failed = [state, focuses, progress, daily, evidence, gaps, monthly, quarterly].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  const relevant = <T extends { capability_id?: string | null }>(items: T[]) => capabilityId ? items.filter((item) => !item.capability_id || item.capability_id === capabilityId) : items;
  return JSON.stringify({
    growth_state: state.data,
    current_focus: focuses.data,
    knowledge_progress: (progress.data ?? []).filter((item) => !capabilityId || item.knowledge_concepts?.capability_id === capabilityId),
    recent_daily: daily.data,
    recent_evidence: relevant(evidence.data ?? []),
    open_gaps: relevant(gaps.data ?? []),
    latest_monthly_review: monthly.data,
    latest_quarterly_review: quarterly.data,
  });
}
