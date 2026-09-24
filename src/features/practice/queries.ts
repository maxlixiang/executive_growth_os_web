import { requireUser } from "@/lib/auth/require-user";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getCaptureEntries() {
  const { supabase, user } = await requireUser();
  const result = await supabase.from("capture_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  throwIfError(result.error);
  return result.data ?? [];
}

export async function getDailyFeed() {
  const { supabase, user } = await requireUser();
  const [daily, tags, gaps] = await Promise.all([
    supabase.from("daily_reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("daily_capability_tags").select("daily_reflection_id, capability_id, confidence, capabilities(code, title_en)").eq("user_id", user.id),
    supabase.from("growth_gaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  throwIfError(daily.error); throwIfError(tags.error); throwIfError(gaps.error);
  return { daily: daily.data ?? [], tags: tags.data ?? [], gaps: gaps.data ?? [] };
}

export async function getEvidenceFeed() {
  const { supabase, user } = await requireUser();
  const result = await supabase.from("practice_evidence").select("*, capabilities(code, title_en, title_zh)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  throwIfError(result.error);
  return result.data ?? [];
}
