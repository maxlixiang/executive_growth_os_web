import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { assessmentTabs, FeatureTabs } from "@/components/feature-tabs";
import { InterviewStartForm } from "@/features/interviews/interview-start-form";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getReviewHistory } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const { interviews } = await getReviewHistory();
  return <PageContainer>
    <PageHeader eyebrow="Practice Interview" title="评估与复盘" description="模拟面试由你随时发起；它用于练习和教学反馈，不会直接改变正式评分。" />
    <FeatureTabs tabs={assessmentTabs} active="/interviews" />
    <ContextHelpLink section="interviews">怎样回答才能获得更有效的练习反馈？</ContextHelpLink>
    <InterviewStartForm />
    <section className="mt-10"><h2 className="text-xl font-bold">历次模拟面试</h2><div className="mt-4 divide-y divide-line border-y border-line">{interviews.length ? interviews.map((item) => <Link key={item.id} href={`/interviews/${item.id}`} className="flex min-h-20 items-center justify-between gap-4 py-4 hover:text-accent"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-muted">{item.status === "completed" ? "已完成" : "进行中"} · {new Date(item.started_at).toLocaleDateString("zh-CN")}</p></div><ArrowRight size={18} /></Link>) : <p className="py-8 text-muted">尚无模拟面试。</p>}</div></section>
  </PageContainer>;
}
