import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, History } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getRecommendation, getStudyHistory } from "@/features/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const [{ workspace, recommendation }, history] = await Promise.all([getRecommendation(), getStudyHistory()]);

  return (
    <PageContainer>
      <PageHeader eyebrow="Knowledge Engine" title="学习中心" description="Study 负责下一项新知识或继续深入；到期复习由 Quiz 负责。" />
      {recommendation ? (
        <section className="mt-8 rounded-2xl bg-accent-soft p-6 sm:p-8">
          <p className="text-sm font-bold text-accent-strong">Study Next</p>
          <p className="mt-5 text-lg font-medium text-muted">{recommendation.concept.capability} · {recommendation.concept.titleEn}</p>
          <h2 className="mt-1 text-[32px] font-bold tracking-[-0.03em]">{recommendation.concept.titleZh}</h2>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-muted">
            {recommendation.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-accent">•</span>{reason}</li>)}
          </ul>
          <Link href={`/study/${recommendation.concept.capability.toLocaleLowerCase()}/${recommendation.concept.code}`} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-white sm:w-auto">开始学习 <ArrowRight size={19} /></Link>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-line p-6"><h2 className="text-xl font-bold">当前没有合适的新知识</h2><p className="mt-2 text-muted">如果有到期内容，请前往 Quiz。</p></section>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center gap-3"><BookOpen className="text-accent" size={22} /><h2 className="text-xl font-bold">按能力浏览</h2></div>
          <div className="mt-4 divide-y divide-line">
            {workspace.capabilities.map((capability) => (
              <Link key={capability.id} href={`/study/${capability.code}`} className="flex min-h-16 items-center justify-between py-3 font-semibold hover:text-accent"><span>{capability.titleEn} · {capability.titleZh}</span><ArrowRight size={18} /></Link>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center gap-3"><History className="text-accent" size={22} /><h2 className="text-xl font-bold">学习历史</h2></div>
          <p className="mt-3 text-sm leading-6 text-muted">检查 AI 评分，作废错误记录，或恢复被误作废的 Session。</p>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><Clock3 size={17} />共 {history.length} 条记录</p>
          <Link href="/study/history" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-accent">查看全部 <ArrowRight size={18} /></Link>
        </section>
      </div>
    </PageContainer>
  );
}
