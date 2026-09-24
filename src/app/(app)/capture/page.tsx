import { PageContainer, PageHeader } from "@/components/page-header";
import { CaptureForm } from "@/features/practice/capture-form";
import { getCaptureEntries } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { work_event: "工作事件", idea: "想法", question: "问题", follow_up: "待跟进" };

export default async function CapturePage() {
  const entries = await getCaptureEntries();
  return <PageContainer>
    <PageHeader eyebrow="Quick Capture" title="记录工作 / 想法" description="手机上先把原始信息安全保存，再选择是否让 AI 提取 Evidence、Knowledge Gap 与 Practice Gap。" />
    <CaptureForm />
    <section className="mt-10"><h2 className="text-xl font-bold">最近记录</h2><div className="mt-4 divide-y divide-line border-y border-line">
      {entries.length ? entries.map((entry) => <article key={entry.id} className="py-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span>{labels[entry.entry_type]}</span><span>·</span><time>{new Date(entry.created_at).toLocaleString("zh-CN")}</time><span className="rounded-full bg-soft px-2 py-1">{entry.analysis_status}</span></div><h3 className="mt-2 font-bold">{entry.title || "无标题记录"}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">{entry.content}</p>{entry.analysis_error ? <p className="mt-2 text-sm text-red-700">{entry.analysis_error}</p> : null}</article>) : <p className="py-6 text-sm text-muted">还没有 Capture。</p>}
    </div></section>
  </PageContainer>;
}
