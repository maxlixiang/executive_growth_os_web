import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { ReviewWorkflowButtons } from "@/features/reviews/workflow-buttons";
import { currentMonthKey, currentQuarterKey } from "@/features/reviews/periods";
import { getReviewHistory } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const history = await getReviewHistory();
  return <PageContainer>
    <PageHeader eyebrow="Periodic Review" title="复盘与评估" description="Monthly Review 按真实自然月复盘；Quarterly Review 通过三轮模拟高管面试形成评估。" />
    <ContextHelpLink section="reviews">复盘使用哪些数据？</ContextHelpLink>
    <ReviewWorkflowButtons month={currentMonthKey()} quarter={currentQuarterKey()} />
    <section className="mt-10"><h2 className="text-xl font-bold">Monthly History</h2><div className="mt-4 divide-y divide-line border-y border-line">{history.monthly.length ? history.monthly.map((item) => <Link key={item.id} href={`/reviews/monthly/${item.period_start.slice(0, 7)}`} className="flex min-h-16 items-center justify-between gap-4 py-3 font-semibold hover:text-accent"><span>{item.period_start.slice(0, 7)} Monthly Review</span><ArrowRight size={18} /></Link>) : <p className="py-5 text-muted">尚未生成 Monthly Review。</p>}</div></section>
    <section className="mt-10"><h2 className="text-xl font-bold">Quarterly History</h2><div className="mt-4 divide-y divide-line border-y border-line">{history.quarterly.length ? history.quarterly.map((item) => { const quarter = Math.floor((Number(item.period_start.slice(5, 7)) - 1) / 3) + 1; const key = `${item.period_start.slice(0, 4)}-Q${quarter}`; return <Link key={item.id} href={item.status === "completed" ? `/reviews/quarterly/${key}` : "/interviews"} className="flex min-h-16 items-center justify-between gap-4 py-3 font-semibold hover:text-accent"><span>{key} · {item.status}</span><ArrowRight size={18} /></Link>; }) : <p className="py-5 text-muted">尚未开始 Quarterly Review。</p>}</div></section>
  </PageContainer>;
}
