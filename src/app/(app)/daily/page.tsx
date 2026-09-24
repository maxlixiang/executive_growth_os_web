import { PageContainer, PageHeader } from "@/components/page-header";
import { DailyForm } from "@/features/practice/daily-form";
import { getDailyFeed } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const { daily, tags, gaps } = await getDailyFeed();
  return <PageContainer>
    <PageHeader eyebrow="Practice Engine" title="Daily Reflection" description="用自然语言复盘真实工作。AI 会识别责任、判断、取舍、结果、证据与缺口。" />
    <DailyForm />
    <section className="mt-10"><h2 className="text-xl font-bold">最近分析</h2><div className="mt-4 space-y-4">
      {daily.length ? daily.map((item) => {
        const itemTags = tags.filter((tag) => tag.daily_reflection_id === item.id);
        const itemGaps = gaps.filter((gap) => gap.daily_reflection_id === item.id);
        return <article key={item.id} className="rounded-2xl border border-line p-5 sm:p-6"><time className="text-xs font-semibold text-muted">{new Date(item.created_at).toLocaleString("zh-CN")}</time><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{item.analysis}</p><div className="mt-4 flex flex-wrap gap-2">{itemTags.map((tag) => <span key={`${tag.daily_reflection_id}-${tag.capability_id}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">{tag.capabilities?.title_en ?? "Capability"} · {Math.round((tag.confidence ?? 0) * 100)}%</span>)}</div>{item.responsibility_hint ? <p className="mt-4 text-sm"><strong>Responsibility：</strong>{item.responsibility_hint}</p> : null}{itemGaps.length ? <div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold">Gaps</h3><ul className="mt-2 space-y-2 text-sm text-muted">{itemGaps.map((gap) => <li key={gap.id}>• [{gap.gap_type}] {gap.title} — {gap.detail}</li>)}</ul></div> : null}</article>;
      }) : <p className="rounded-2xl border border-line p-6 text-sm text-muted">还没有 Daily Reflection。</p>}
    </div></section>
  </PageContainer>;
}
