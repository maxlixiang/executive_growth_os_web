import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { quarterPeriod } from "@/features/reviews/periods";
import { getQuarterlyReview } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function QuarterlyReviewPage({ params }: { params: Promise<{ period: string }> }) {
  const { period: key } = await params;
  const period = quarterPeriod(key);
  if (!period) notFound();
  const review = await getQuarterlyReview(period.start);
  if (!review || review.status !== "completed" || !review.assessment_markdown) notFound();
  const gaps = strings(review.executive_level_gaps);
  const focuses = strings(review.next_quarter_focus);
  return <PageContainer>
    <Link href="/reviews" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={18} />返回 Reviews</Link>
    <PageHeader eyebrow="Quarterly Assessment" title={`${key} 高管评估`} description="评估来自周期成长记录与完整 Mock Executive Interview transcript。" />
    <article className="mt-8 rounded-2xl border border-line p-5 sm:p-7"><div className="whitespace-pre-wrap text-[15px] leading-7">{review.assessment_markdown}</div></article>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><ListCard title="Executive-Level Gaps" items={gaps} /><ListCard title="Next Quarter Focus" items={focuses} /></div>
  </PageContainer>;
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-2xl bg-soft p-5"><h2 className="font-bold">{title}</h2>{items.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-3 text-sm text-muted">无记录</p>}</section>;
}
