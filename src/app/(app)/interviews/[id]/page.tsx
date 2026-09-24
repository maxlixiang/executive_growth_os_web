import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { InterviewControls } from "@/features/interviews/interview-controls";
import { getInterview } from "@/features/interviews/queries";

export const dynamic = "force-dynamic";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, messages } = await getInterview(id);
  if (!session) notFound();
  const review = session.quarterly_reviews;
  const answerCount = messages.filter((item) => item.role === "user").length;
  return <PageContainer>
    <Link href="/interviews" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={18} />返回 Interviews</Link>
    <PageHeader eyebrow="Mock Executive Interview" title="Evidence First 高管面试" description={`${review?.period_start ?? "Quarterly Review"} · ${session.status} · 已回答 ${answerCount}/3`} />
    <div className="mt-8 space-y-4">{messages.length ? messages.map((message) => <article key={message.id} className={`rounded-2xl p-5 ${message.role === "interviewer" ? "border border-line bg-white" : "ml-4 bg-accent-soft sm:ml-12"}`}><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-accent">{message.role === "interviewer" ? "Interviewer" : "你的回答"}</p>{message.capabilities ? <span className="rounded-full bg-soft px-2 py-1 text-xs text-muted">{message.capabilities.title_en}</span> : null}</div><p className="mt-3 whitespace-pre-wrap leading-7">{message.content}</p></article>) : <p className="rounded-2xl border border-line p-5 text-muted">第一问尚未生成，可以继续重试。</p>}</div>
    <InterviewControls id={id} status={session.status} lastRole={messages.at(-1)?.role} />
    {session.status === "completed" && review ? <Link href={`/reviews/quarterly/${review.period_start.slice(0, 4)}-Q${Math.floor((Number(review.period_start.slice(5, 7)) - 1) / 3) + 1}`} className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-bold text-white">查看 Quarterly Assessment</Link> : null}
  </PageContainer>;
}
