import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { FeatureTabs, learningTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getRecommendation } from "@/features/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const { workspace, recommendation } = await getRecommendation();

  return (
    <PageContainer>
      <PageHeader eyebrow="Learning Center" title="学习中心" description="在一个入口完成新知识学习、到期复习和知识地图浏览。" />
      <FeatureTabs tabs={learningTabs} active="/study" />
      <ContextHelpLink section="learning">了解学习中心的完整流程</ContextHelpLink>
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

      <div className="mt-8">
        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center gap-3"><BookOpen className="text-accent" size={22} /><h2 className="text-xl font-bold">按能力浏览</h2></div>
          <div className="mt-4 divide-y divide-line">
            {workspace.capabilities.map((capability) => (
              <Link key={capability.id} href={`/study/${capability.code}`} className="flex min-h-16 items-center justify-between py-3 font-semibold hover:text-accent"><span>{capability.titleEn} · {capability.titleZh}</span><ArrowRight size={18} /></Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
