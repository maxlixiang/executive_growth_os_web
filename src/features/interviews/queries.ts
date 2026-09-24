import "server-only";
import { requireUser } from "@/lib/auth/require-user";

export async function getInterview(id: string) {
  const { supabase, user } = await requireUser();
  const [session, messages] = await Promise.all([
    supabase.from("interview_sessions").select("*, quarterly_reviews(*)").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("interview_messages").select("*, capabilities(code, title_en, title_zh)").eq("interview_session_id", id).eq("user_id", user.id).order("sequence_number"),
  ]);
  if (session.error) throw new Error(session.error.message);
  if (messages.error) throw new Error(messages.error.message);
  return { session: session.data, messages: messages.data ?? [] };
}
