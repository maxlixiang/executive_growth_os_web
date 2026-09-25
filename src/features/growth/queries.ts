import "server-only";
import { requireUser } from "@/lib/auth/require-user";
import { calculateDiagnosticConfidence } from "./confidence";

const evidenceRanks: Record<string, number> = { E0: 0, E1: 1, E2: 2, E3: 3, E4: 4, E5: 5 };

export async function getGrowthPlanWorkspace() {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (journeyError || !journey) throw new Error(journeyError?.message ?? "Active learning journey required");
  const journeyId = journey.id;
  const [state, plans, focuses, capabilities, sessions, reflections, evidence, gaps, monthly, quarterly] = await Promise.all([
    supabase.from("user_growth_state").select("overall_goal, summary, recent_training_direction").eq("user_id", user.id).maybeSingle(),
    supabase.from("growth_plans").select("*").eq("user_id", user.id).filter("journey_id", "eq", journeyId).order("version", { ascending: false }).limit(20),
    supabase.from("user_focuses").select("priority, starts_at, capabilities(code, title_en, title_zh)").eq("user_id", user.id).eq("is_active", true).order("priority"),
    supabase.from("capabilities").select("id, code, title_en, title_zh, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("study_sessions").select("knowledge_concepts(capability_id)").eq("user_id", user.id).filter("journey_id", "eq", journeyId).eq("is_valid", true),
    supabase.from("daily_reflections").select("id").eq("user_id", user.id).filter("journey_id", "eq", journeyId).not("analysis", "is", null),
    supabase.from("practice_evidence").select("capability_id, evidence_level").eq("user_id", user.id).filter("journey_id", "eq", journeyId),
    supabase.from("growth_gaps").select("capability_id, gap_type").eq("user_id", user.id).filter("journey_id", "eq", journeyId).eq("status", "open"),
    supabase.from("monthly_reviews").select("id").eq("user_id", user.id).filter("journey_id", "eq", journeyId),
    supabase.from("quarterly_reviews").select("id").eq("user_id", user.id).filter("journey_id", "eq", journeyId).eq("status", "completed"),
  ]);
  const failed = [state, plans, focuses, capabilities, sessions, reflections, evidence, gaps, monthly, quarterly].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const studiedCapabilities = new Set((sessions.data ?? []).flatMap((item) => item.knowledge_concepts?.capability_id ? [item.knowledge_concepts.capability_id] : [])).size;
  const evidencedCapabilities = new Set((evidence.data ?? []).map((item) => item.capability_id)).size;
  const confidence = calculateDiagnosticConfidence({
    hasLongTermGoal: Boolean(state.data?.overall_goal?.trim()),
    validStudySessions: sessions.data?.length ?? 0,
    studiedCapabilities,
    analyzedReflections: reflections.data?.length ?? 0,
    practiceEvidence: evidence.data?.length ?? 0,
    evidencedCapabilities,
    monthlyReviews: monthly.data?.length ?? 0,
    completedQuarterlyReviews: quarterly.data?.length ?? 0,
  });
  const capabilitySignals = (capabilities.data ?? []).map((capability) => {
    const capabilityEvidence = (evidence.data ?? []).filter((item) => item.capability_id === capability.id);
    const highestEvidence = capabilityEvidence.reduce((best, item) => evidenceRanks[item.evidence_level] > evidenceRanks[best] ? item.evidence_level : best, "E0");
    return {
      code: capability.code,
      title: `${capability.title_en} · ${capability.title_zh}`,
      valid_study_sessions: (sessions.data ?? []).filter((item) => item.knowledge_concepts?.capability_id === capability.id).length,
      open_knowledge_gaps: (gaps.data ?? []).filter((item) => item.capability_id === capability.id && item.gap_type === "knowledge").length,
      open_practice_gaps: (gaps.data ?? []).filter((item) => item.capability_id === capability.id && item.gap_type === "practice").length,
      evidence_count: capabilityEvidence.length,
      highest_evidence_level: highestEvidence,
    };
  });

  return {
    state: state.data,
    currentPlan: plans.data?.find((plan) => plan.status === "active") ?? null,
    history: plans.data ?? [],
    focuses: focuses.data ?? [],
    capabilities: capabilities.data ?? [],
    confidence,
    planningSignals: {
      capability_signals: capabilitySignals,
      total_analyzed_reflections: reflections.data?.length ?? 0,
      monthly_reviews: monthly.data?.length ?? 0,
      completed_quarterly_reviews: quarterly.data?.length ?? 0,
    },
  };
}
