import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { FeatureTabs, learningTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getKnowledgeWorkspace } from "@/features/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const workspace = await getKnowledgeWorkspace();

  return (
    <PageContainer>
      <PageHeader eyebrow="Learning Center" title="学习中心" description="在一个入口完成新知识学习、到期复习和知识地图浏览。" />
      <FeatureTabs tabs={learningTabs} active="/knowledge" />
      <ContextHelpLink section="learning">了解知识地图和推荐顺序</ContextHelpLink>
      <div className="mt-8"><h2 className="text-2xl font-bold">知识地图</h2><p className="mt-2 text-sm leading-6 text-muted">138 个知识点构成六项能力的共同标准。状态来自真实学习与复习，不是阅读完成度。</p></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspace.capabilities.map((capability) => {
          const concepts = workspace.concepts.filter((concept) => concept.capabilityId === capability.id);
          const completed = concepts.filter((concept) => ["applied", "verified"].includes(workspace.progress[concept.code]?.status ?? "unknown")).length;
          return (
            <Link key={capability.id} href={`/knowledge/${capability.code}`} className="group rounded-2xl border border-line bg-white p-6 transition hover:border-accent hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><BookOpen size={21} /></span>
                <ArrowRight size={20} className="text-muted transition group-hover:translate-x-1 group-hover:text-accent" />
              </div>
              <p className="mt-6 text-sm font-bold text-muted">{capability.titleEn}</p>
              <h2 className="mt-1 text-2xl font-bold">{capability.titleZh}</h2>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                <span className="text-muted">{concepts.length} 个知识点</span>
                <span className="inline-flex items-center gap-1.5 font-semibold"><CheckCircle2 size={16} className="text-accent" />{completed} 已掌握</span>
              </div>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
