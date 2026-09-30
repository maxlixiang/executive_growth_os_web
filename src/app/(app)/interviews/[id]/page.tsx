import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { InterviewControls } from "@/features/interviews/interview-controls";
import { interviewReadiness } from "@/features/interviews/readiness";
import { getInterview } from "@/features/interviews/queries";

export const dynamic = "force-dynamic";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, messages } = await getInterview(id);
  if (!session) notFound();
  const review = session.quarterly_reviews;
  const readiness = session.readiness_result ? interviewReadiness(session.readiness_result, messages.filter(m => m.role === "user").map(m => m.sequence_number)) : null;
  const answerCount = messages.filter((item) => item.role === "user").length;
  return <PageContainer>
    <Link href="/interviews" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={18} />返回 Interviews</Link>
    <PageHeader eyebrow="Mock Executive Interview" title={session.title} description={`${review ? `旧版季度练习 · ${review.period_start}` : "自主练习"} · ${session.status === "completed" ? "已完成" : "进行中"} · 已回答 ${answerCount}/${session.rubric_version === 2 ? 12 : 3}`} />
    <div className="mt-8 space-y-4">{messages.length ? messages.map((message) => <article key={message.id} className={`rounded-2xl p-5 ${message.role === "interviewer" ? "border border-line bg-white" : "ml-4 bg-accent-soft sm:ml-12"}`}><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-accent">{message.role === "interviewer" ? "Interviewer" : "你的回答"}</p>{message.capabilities ? <span className="rounded-full bg-soft px-2 py-1 text-xs text-muted">{message.capabilities.title_en}</span> : null}</div><p className="mt-3 whitespace-pre-wrap leading-7">{message.content}</p></article>) : <p className="rounded-2xl border border-line p-5 text-muted">第一问尚未生成，可以继续重试。</p>}</div>
    <InterviewControls id={id} status={session.status} lastRole={messages.at(-1)?.role} />
    {readiness ? <section className="mt-8 rounded-2xl border border-accent p-5"><h2 className="text-xl font-bold">{readiness.ready ? "达到模拟面试通过标准" : "仍需准备"} · {readiness.readiness}/100</h2><p className="mt-2 text-sm text-muted">规则v2：知识30、案例30、追问与证据陈述40；综合≥70、每能力≥55、知识≥18、追问≥16。置信度{readiness.confidence}%（仅针对本场面试判断）。</p><div className="mt-4 space-y-4">{readiness.scores.map(s => <div key={s.code}><h3 className="font-bold">{s.code} · {s.knowledge + s.case + s.defense}/100</h3><p className="text-sm leading-6">{s.rationale}</p><p className="text-sm text-muted">回答序号：{s.transcript_refs.join("、")}；下一步：{s.next_practice}</p></div>)}</div><p className="mt-4 font-bold">{readiness.limitation}</p></section> : null}
    {session.feedback_markdown ? <section className="mt-8 rounded-2xl bg-accent-soft p-5 sm:p-7"><h2 className="text-xl font-bold">练习反馈</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7">{session.feedback_markdown}</div><p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">这是练习反馈，不是正式评分，也不会直接改变最近正式评估结果。</p></section> : null}
    {session.status === "completed" && review ? <Link href={`/reviews/quarterly/${review.period_start.slice(0, 4)}-Q${Math.floor((Number(review.period_start.slice(5, 7)) - 1) / 3) + 1}`} className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-bold text-white">查看 Quarterly Assessment</Link> : null}
  </PageContainer>;
}
