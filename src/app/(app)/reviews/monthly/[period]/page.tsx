import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { monthPeriod } from "@/features/reviews/periods";
import { getMonthlyReview } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function MonthlyReviewPage({ params }: { params: Promise<{ period: string }> }) {
  const { period: key } = await params;
  const period = monthPeriod(key);
  if (!period) notFound();
  const review = await getMonthlyReview(period.start);
  if (!review) notFound();
  const challenges = Array.isArray(review.recommended_practice_challenges) ? review.recommended_practice_challenges.filter((item): item is string => typeof item === "string") : [];
  return <PageContainer>
    <Link href="/reviews" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={18} />返回 Reviews</Link>
    <PageHeader eyebrow="Monthly Review" title={`${key} 月度复盘`} description={`${review.period_start} 至 ${review.period_end}，严格按该用户自然月数据生成。`} />
    <article className="mt-8 rounded-2xl border border-line p-5 sm:p-7"><div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{review.review_markdown}</div></article>
    {challenges.length ? <section className="mt-8 rounded-2xl bg-soft p-5"><h2 className="font-bold">Recommended Practice Challenges</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">{challenges.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
  </PageContainer>;
}
