import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getKnowledgeWorkspace } from "@/features/knowledge/queries";
import { StatusBadge } from "@/features/knowledge/status";

export const dynamic = "force-dynamic";

export default async function CapabilityStudyPage({ params }: { params: Promise<{ capability: string }> }) {
  const { capability: capabilityCode } = await params;
  const workspace = await getKnowledgeWorkspace();
  const capability = workspace.capabilities.find((item) => item.code === capabilityCode.toLocaleLowerCase());
  if (!capability) notFound();
  const concepts = workspace.concepts.filter((concept) => concept.capabilityId === capability.id);

  return (
    <PageContainer>
      <PageHeader backHref="/study" eyebrow={`${capability.titleEn} Learning Path`} title={capability.titleZh} description="选择知识点进入 Active Recall 与 Application Question。建议优先遵循 Study Next。" />
      <div className="mt-8 divide-y divide-line border-y border-line">
        {concepts.map((concept) => (
          <Link key={concept.id} href={`/study/${capability.code}/${concept.code}`} className="group flex min-h-24 items-center gap-4 py-4">
            <span className="w-8 shrink-0 text-sm font-bold tabular-nums text-muted">{String(concept.sortOrder).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1"><p className="font-bold group-hover:text-accent">{concept.titleZh}</p><p className="mt-1 truncate text-sm text-muted">{concept.titleEn}</p></div>
            <StatusBadge status={workspace.progress[concept.code]?.status ?? "unknown"} />
            <ArrowRight size={18} className="hidden text-muted sm:block" />
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
