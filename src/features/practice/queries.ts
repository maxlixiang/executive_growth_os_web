import { requireUser } from "@/lib/auth/require-user";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getCaptureEntries() {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  throwIfError(journeyError);
  if (!journey) return [];
  const result = await supabase.from("capture_entries").select("*").eq("user_id", user.id).eq("journey_id", journey.id).order("created_at", { ascending: false }).limit(50);
  throwIfError(result.error);
  return result.data ?? [];
}

export async function getDailyFeed() {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  throwIfError(journeyError);
  if (!journey) return { daily: [], tags: [], gaps: [], evidences: [] };
  const [daily, tags, gaps, evidences] = await Promise.all([
    supabase.from("daily_reflections").select("*").eq("user_id", user.id).filter("journey_id", "eq", journey.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("daily_capability_tags").select("daily_reflection_id, capability_id, confidence, capabilities(code, title_en)").eq("user_id", user.id),
    supabase.from("growth_gaps").select("*").eq("user_id", user.id).filter("journey_id", "eq", journey.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("practice_evidence").select("*, capabilities(code, title_en, title_zh)").eq("user_id", user.id).eq("journey_id", journey.id).order("created_at", { ascending: false }).limit(100),
  ]);
  throwIfError(daily.error); throwIfError(tags.error); throwIfError(gaps.error); throwIfError(evidences.error);
  return { daily: daily.data ?? [], tags: tags.data ?? [], gaps: gaps.data ?? [], evidences: evidences.data ?? [] };
}
