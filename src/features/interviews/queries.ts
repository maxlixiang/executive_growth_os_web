import "server-only";
import { requireUser } from "@/lib/auth/require-user";

export async function getInterview(id: string) {
  const { supabase, user } = await requireUser();
  const { data: journey, error: journeyError } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (journeyError) throw new Error(journeyError.message);
  if (!journey) return { session: null, messages: [] };
  const [session, messages] = await Promise.all([
    supabase.from("interview_sessions").select("*, quarterly_reviews(*)").eq("id", id).eq("user_id", user.id).eq("journey_id", journey.id).maybeSingle(),
    supabase.from("interview_messages").select("*, capabilities(code, title_en, title_zh)").eq("interview_session_id", id).eq("user_id", user.id).order("sequence_number"),
  ]);
  if (session.error) throw new Error(session.error.message);
  if (messages.error) throw new Error(messages.error.message);
  return { session: session.data, messages: messages.data ?? [] };
}
