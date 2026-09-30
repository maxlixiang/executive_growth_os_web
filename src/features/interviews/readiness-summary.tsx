import Link from "next/link";
import { cache } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { interviewReadiness } from "./readiness";

const latestReadiness = cache(async () => {
  const [{ supabase, user }, workspace] = await Promise.all([requireUser(), getJourneyWorkspace()]);
  if (!workspace.journey) return null;
  const session = await supabase.from("interview_sessions").select("id, title, completed_at, readiness_result").eq("user_id", user.id).eq("journey_id", workspace.journey.id).eq("status", "completed").eq("rubric_version", 2).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (session.error) throw new Error(session.error.message);
  if (!session.data) return null;
  const messages = await supabase.from("interview_messages").select("sequence_number").eq("user_id", user.id).filter("journey_id", "eq", workspace.journey.id).eq("interview_session_id", session.data.id).eq("role", "user").order("sequence_number");
  if (messages.error) throw new Error(messages.error.message);
  try { return { ...session.data, result: interviewReadiness(session.data.readiness_result, (messages.data ?? []).map(m => m.sequence_number)) }; }
  catch { return { ...session.data, result: null }; }
});

export async function InterviewReadinessSummary() {
  const latest = await latestReadiness();
  return <section className="mt-8 rounded-2xl border border-line bg-accent-soft p-5 sm:p-7">
    <h2 className="text-xl font-bold">管理者模拟面试准备度</h2>
    {latest?.result ? <><p className="mt-3 text-2xl font-bold text-accent">{latest.result.readiness}/100 · {latest.result.ready ? "达到本场面试通过标准" : "仍需准备"}</p><p className="mt-2 text-sm leading-6 text-muted">最近一次：{latest.title} · {latest.completed_at?.slice(0,10)}。这个结论对应本场独立回答、追问和证据陈述，不代表永久掌握或实际岗位表现。</p></> : <p className="mt-3 text-sm leading-6 text-muted">{latest ? "上次面试结论需要重新核对，请查看原始访谈。" : "尚无完整模拟面试结果。学习后可用六项能力各一问一追问（12次回答），检验是否准备好通过管理者面试。"}</p>}
    <p className="mt-3 text-sm leading-6 text-muted">没有真实管理经历时可使用明确标记的模拟案例。原有真实实践证据评分保留供对照；回答好问题仍需在实际工作中历练。</p>
    <Link href={latest ? `/interviews/${latest.id}` : "/interviews"} className="mt-4 inline-block font-bold text-accent">{latest ? "查看面试依据与下一步练习 →" : "前往模拟面试 →"}</Link>
  </section>;
}
