import { cache } from "react";
import { requireUser } from "@/lib/auth/require-user";

export const getJourneyWorkspace = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (journeyError) throw new Error(journeyError.message);

  const [profileResult, journeysResult, capabilitiesResult, progressResult] = await Promise.all([
    supabase.from("profiles").select("display_name, timezone").eq("id", user.id).maybeSingle(),
    supabase.from("learning_journeys").select("*").eq("user_id", user.id).order("sequence_number", { ascending: false }),
    supabase.from("capabilities").select("id, code, title_en, title_zh, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("knowledge_progress").select("concept_id, status").eq("user_id", user.id),
  ]);
  for (const result of [profileResult, journeysResult, capabilitiesResult, progressResult]) if (result.error) throw new Error(result.error.message);

  let cycle = null;
  let latestAssessment = null;
  let latestSelfAssessment = null;
  let currentEstimate = null;
  if (journey) {
    const [cycleResult, assessmentResult] = await Promise.all([
      supabase.from("learning_cycles").select("*").eq("journey_id", journey.id).eq("status", "current").maybeSingle(),
      supabase.from("assessment_sessions").select("*").eq("journey_id", journey.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(20),
    ]);
    if (cycleResult.error) throw new Error(cycleResult.error.message);
    if (assessmentResult.error) throw new Error(assessmentResult.error.message);
    cycle = cycleResult.data;
    const assessments = assessmentResult.data ?? [];
    latestAssessment = assessments.find((item) => item.assessment_type !== "self_check") ?? null;
    latestSelfAssessment = assessments.find((item) => item.assessment_type === "self_check") ?? null;
    currentEstimate = assessments[0] ?? null;
  }

  const capabilities = capabilitiesResult.data ?? [];
  const conceptResult = capabilities.length
    ? await supabase.from("knowledge_concepts").select("id, capability_id, concept_code, title_en, title_zh, sort_order").in("capability_id", capabilities.map((item) => item.id)).eq("is_active", true).order("sort_order")
    : { data: [], error: null };
  if (conceptResult.error) throw new Error(conceptResult.error.message);
  const counts = new Map<string, number>();
  const foundation = (conceptResult.data ?? []).filter((concept) => {
    const count = counts.get(concept.capability_id) ?? 0;
    if (count >= 4) return false;
    counts.set(concept.capability_id, count + 1);
    return true;
  });
  const learned = new Set((progressResult.data ?? []).filter((item) => ["understood", "applied", "verified"].includes(item.status)).map((item) => item.concept_id));

  return {
    user: { id: user.id, email: user.email ?? "" }, profile: profileResult.data, journey,
    journeys: journeysResult.data ?? [], cycle, latestAssessment, latestSelfAssessment, currentEstimate, capabilities, foundation,
    foundationCompleted: foundation.filter((item) => learned.has(item.id)).length,
    foundationTotal: foundation.length,
  };
});

export async function requireActiveJourney() {
  const workspace = await getJourneyWorkspace();
  if (!workspace.journey) throw new Error("Active learning journey required");
  return workspace.journey;
}
