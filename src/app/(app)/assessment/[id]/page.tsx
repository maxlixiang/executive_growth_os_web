import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/page-header";
import { AssessmentRunner } from "@/features/assessment/assessment-runner";
import type { AssessmentQuestion } from "@/features/assessment/questions";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function AssessmentSessionPage({ params }: PageProps<"/assessment/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: session } = await supabase.from("assessment_sessions").select("id, assessment_type, status, question_set, readiness_score").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!session) notFound();
  const labels: Record<string, string> = { baseline: "基线诊断", self_check: "自主评估", formal: "双月正式评估" };
  if (session.status === "completed") {
    const [scoresResult, capabilitiesResult] = await Promise.all([
      supabase.from("assessment_capability_scores").select("*").eq("assessment_session_id", session.id).eq("user_id", user.id).order("created_at"),
      supabase.from("capabilities").select("id, title_en, title_zh"),
    ]);
    if (scoresResult.error || capabilitiesResult.error) throw new Error(scoresResult.error?.message ?? capabilitiesResult.error?.message);
    const capabilityById = new Map((capabilitiesResult.data ?? []).map((item) => [item.id, item]));
    return <PageContainer><PageHeader backHref="/assessment?view=history" eyebrow="Assessment Complete" title={labels[session.assessment_type] ?? "能力评估"} description={`本次评估已完成，综合评分 ${session.readiness_score ?? "待生成"} / 100。`} /><div className="mt-8 grid gap-4 sm:grid-cols-2">{scoresResult.data?.map((score) => { const capability = capabilityById.get(score.capability_id); return <article key={score.id} className="rounded-2xl border border-line p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-bold">{capability?.title_en} · {capability?.title_zh}</h2><strong>{score.capability_score}/100</strong></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl bg-soft p-3">知识<br /><strong>{score.knowledge_score}/30</strong></div><div className="rounded-xl bg-soft p-3">案例<br /><strong>{score.case_score}/30</strong></div><div className="rounded-xl bg-soft p-3">实践<br /><strong>{score.practice_score}/40</strong></div></div><p className="mt-4 text-sm leading-6 text-muted">{score.rationale}</p><p className="mt-3 text-xs font-bold text-accent">实践证据 {score.evidence_level}</p></article>; })}</div></PageContainer>;
  }
  if (session.status !== "in_progress") notFound();
  return <PageContainer><PageHeader backHref="/assessment" eyebrow="Assessment in Progress" title={labels[session.assessment_type] ?? "能力评估"} description="请独立回答六项能力的知识与案例问题。实践分只使用当前旅程中已确认的真实证据。" /><div className="mt-8"><AssessmentRunner sessionId={session.id} questions={session.question_set as unknown as AssessmentQuestion[]} /></div></PageContainer>;
}
