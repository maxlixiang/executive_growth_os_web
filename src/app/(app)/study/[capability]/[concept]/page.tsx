import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getConcept } from "@/features/knowledge/queries";
import { StudyRunner } from "@/features/study/study-runner";

export const dynamic = "force-dynamic";

export default async function ConceptStudyPage({ params }: { params: Promise<{ capability: string; concept: string }> }) {
  const { capability, concept: conceptCode } = await params;
  const concept = await getConcept(capability, conceptCode);
  if (!concept) notFound();

  return (
    <PageContainer>
      <PageHeader backHref={`/study/${capability}`} eyebrow={`${concept.capability} · ${concept.category}`} title={concept.titleZh} description={concept.titleEn} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <StudyRunner conceptId={concept.id} sessionType="study" />
        <aside className="space-y-5">
          <section className="rounded-2xl bg-soft p-5"><h2 className="font-bold">为什么重要</h2><p className="mt-2 text-sm leading-6 text-muted">{concept.whyItMatters}</p></section>
          <section className="rounded-2xl border border-line p-5"><h2 className="font-bold">核心原则</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted">{concept.corePrinciples.map((item) => <li key={item}>• {item}</li>)}</ul></section>
          {concept.prerequisites.length ? <section className="rounded-2xl border border-line p-5"><h2 className="font-bold">前置知识</h2><p className="mt-2 text-sm text-muted">{concept.prerequisites.join(" · ")}</p></section> : null}
        </aside>
      </div>
    </PageContainer>
  );
}
