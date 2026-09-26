import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getFlexibleReview } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getFlexibleReview(id);
  if (!review) notFound();
  const challenges = Array.isArray(review.recommended_practice_challenges)
    ? review.recommended_practice_challenges.filter((item): item is string => typeof item === "string")
    : [];
  return <PageContainer>
    <Link href="/reviews" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={18} />返回自主复盘</Link>
    <PageHeader eyebrow={`Review #${review.review_number}`} title={review.title} description={`${review.period_start} 至 ${review.period_end}。本次复盘不更新正式评分，也不会自动修改成长计划。`} />
    <article className="mt-8 rounded-2xl border border-line p-5 sm:p-7"><div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{review.review_markdown}</div></article>
    {challenges.length ? <section className="mt-8 rounded-2xl bg-soft p-5"><h2 className="font-bold">下一步练习建议</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">{challenges.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
  </PageContainer>;
}
