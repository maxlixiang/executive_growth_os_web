import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getKnowledgeWorkspace, getQuizQueue } from "@/features/knowledge/queries";
import { StatusBadge } from "@/features/knowledge/status";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [workspace, queue] = await Promise.all([getKnowledgeWorkspace(), getQuizQueue()]);
  const statuses = Object.values(workspace.progress).filter(Boolean);
  const mastered = statuses.filter((item) => item && ["applied", "verified"].includes(item.status)).length;
  const reviews = statuses.reduce((total, item) => total + (item?.reviewCount ?? 0), 0);

  return (
    <PageContainer>
      <PageHeader eyebrow="Knowledge Progress" title="学习进度" description="进度来自有效 Study Session。作废错误记录后，这里会按剩余有效历史重新计算。" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="课程标准" value={workspace.concepts.length} suffix="项" />
        <Metric label="已有记录" value={statuses.length} suffix="项" />
        <Metric label="Applied / Verified" value={mastered} suffix="项" />
        <Metric label="累计学习" value={reviews} suffix="次" />
      </div>
      <section className="mt-8 rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-accent">Quiz Queue</p><h2 className="mt-1 text-xl font-bold">到期复习</h2></div><Link href="/quiz" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent">开始 Quiz <ArrowRight size={18} /></Link></div>
        {queue.due.length ? <div className="mt-5 divide-y divide-line">{queue.due.slice(0, 5).map(({ concept, progress }) => <div key={concept.code} className="flex min-h-16 items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-bold">{concept.titleZh}</p><p className="mt-1 text-sm text-muted">{concept.capability} · 到期 {progress.nextReviewAt}</p></div><StatusBadge status={progress.status} /></div>)}</div> : <p className="mt-5 text-muted">目前没有到期项目。</p>}
      </section>
    </PageContainer>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div className="rounded-2xl bg-soft p-5"><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{value}<span className="ml-1 text-sm font-semibold text-muted">{suffix}</span></p></div>;
}
