import { CheckCircle2 } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { FeatureTabs, recordTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { CaptureForm } from "@/features/practice/capture-form";
import { getCaptureEntries, getDailyFeed } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { work_event: "工作事件", idea: "想法", question: "问题", follow_up: "待跟进" };

export default async function CapturePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "summary" ? "summary" : "capture";
  const [entries, { daily, tags, gaps }] = await Promise.all([getCaptureEntries(), getDailyFeed()]);
  return <PageContainer>
    <PageHeader eyebrow="Work Records" title="工作记录" description="事情发生时随手记录；AI 自动整理分析，不需要下班后再次完整复述。" />
    <FeatureTabs tabs={recordTabs} active={view === "summary" ? "/capture?view=summary" : "/capture"} />

    {view === "capture" ? <>
      <section className="mt-7 rounded-2xl bg-soft px-5 py-5 sm:px-6">
        <h2 className="font-bold">让 AI 更准确地理解这条记录</h2>
        <p className="mt-2 text-sm leading-6 text-muted">尽量包含以下真实信息；暂时没有结果时，直接写“待验证”即可。</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {["背景与事件", "你的角色", "行动与判断", "参与人员", "取舍与依据", "结果或数字", "限制与风险", "尚未确定之处"].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="shrink-0 text-accent" size={16} />{item}</li>)}
        </ul>
        <ContextHelpLink section="records">查看高质量记录指南</ContextHelpLink>
      </section>
      <CaptureForm />
      <section className="mt-10"><h2 className="text-xl font-bold">最近记录</h2><div className="mt-4 divide-y divide-line border-y border-line">
        {entries.length ? entries.map((entry) => <article key={entry.id} className="py-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span>{labels[entry.entry_type]}</span><span>·</span><time>{new Date(entry.created_at).toLocaleString("zh-CN")}</time><span className="rounded-full bg-soft px-2 py-1">{entry.analysis_status}</span></div><h3 className="mt-2 font-bold">{entry.title || "无标题记录"}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">{entry.content}</p>{entry.analysis_error ? <p className="mt-2 text-sm text-red-700">{entry.analysis_error}</p> : null}</article>) : <p className="py-6 text-sm text-muted">还没有工作记录。</p>}
      </div></section>
    </> : <>
      <section className="mt-7 rounded-2xl bg-accent-soft p-5 sm:p-7">
        <h2 className="text-xl font-bold">不用重复写一遍今天做了什么</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">这里展示“保存并 AI 分析”的工作记录整理结果。你可以直接核对；没有补充内容时不需要进行额外的每日复盘，也不会因此扣分。</p>
        <ContextHelpLink section="records">AI 摘要从哪里来？</ContextHelpLink>
      </section>
      <section className="mt-9"><h2 className="text-xl font-bold">AI 整理结果</h2><div className="mt-4 space-y-4">
        {daily.length ? daily.map((item) => {
          const itemTags = tags.filter((tag) => tag.daily_reflection_id === item.id);
          const itemGaps = gaps.filter((gap) => gap.daily_reflection_id === item.id);
          return <article key={item.id} className="rounded-2xl border border-line p-5 sm:p-6"><time className="text-xs font-semibold text-muted">{new Date(item.created_at).toLocaleString("zh-CN")}</time><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{item.analysis}</p><div className="mt-4 flex flex-wrap gap-2">{itemTags.map((tag) => <span key={`${tag.daily_reflection_id}-${tag.capability_id}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">{tag.capabilities?.title_en ?? "Capability"} · {Math.round((tag.confidence ?? 0) * 100)}%</span>)}</div>{item.responsibility_hint ? <p className="mt-4 text-sm"><strong>Responsibility：</strong>{item.responsibility_hint}</p> : null}{itemGaps.length ? <div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold">仍需补充</h3><ul className="mt-2 space-y-2 text-sm text-muted">{itemGaps.map((gap) => <li key={gap.id}>• [{gap.gap_type}] {gap.title} — {gap.detail}</li>)}</ul></div> : null}</article>;
        }) : <p className="rounded-2xl border border-line p-6 text-sm text-muted">还没有 AI 整理结果。保存工作记录时选择“保存并 AI 分析”后，结果会出现在这里。</p>}
      </div></section>
    </>}
  </PageContainer>;
}
