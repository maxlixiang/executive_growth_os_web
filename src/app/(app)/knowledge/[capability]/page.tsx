import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getKnowledgeWorkspace } from "@/features/knowledge/queries";
import { StatusBadge } from "@/features/knowledge/status";

export const dynamic = "force-dynamic";

export default async function CapabilityKnowledgePage({ params }: { params: Promise<{ capability: string }> }) {
  const { capability: capabilityCode } = await params;
  const workspace = await getKnowledgeWorkspace();
  const capability = workspace.capabilities.find((item) => item.code === capabilityCode.toLocaleLowerCase());
  if (!capability) notFound();
  const concepts = workspace.concepts.filter((concept) => concept.capabilityId === capability.id);
  const grouped = Map.groupBy(concepts, (concept) => concept.category);

  return (
    <PageContainer>
      <PageHeader backHref="/knowledge" eyebrow={capability.titleEn} title={capability.titleZh} description={`共 ${concepts.length} 个知识点。课程顺序用于建立基础，真实 Knowledge Gap 可在前置条件满足时提高推荐优先级。`} />
      <div className="mt-8 space-y-9">
        {[...grouped.entries()].map(([category, items]) => (
          <section key={category}>
            <div className="flex items-end justify-between border-b border-line pb-3"><h2 className="text-xl font-bold">{category}</h2><span className="text-sm text-muted">{items.length} 项</span></div>
            <div className="divide-y divide-line">
              {items.map((concept) => {
                const status = workspace.progress[concept.code]?.status ?? "unknown";
                return (
                  <Link key={concept.id} href={`/study/${capability.code}/${concept.code}`} className="group flex min-h-24 items-center gap-4 py-4">
                    <span className="w-8 shrink-0 text-sm font-bold tabular-nums text-muted">{String(concept.sortOrder).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1"><p className="text-[17px] font-bold group-hover:text-accent">{concept.titleEn}</p><p className="mt-1 truncate text-sm text-muted">{concept.titleZh}</p></div>
                    <StatusBadge status={status} />
                    <ArrowRight size={18} className="hidden text-muted sm:block" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
