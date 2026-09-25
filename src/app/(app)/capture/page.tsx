import { AlertCircle, CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { FeatureTabs, recordTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { CaptureForm } from "@/features/practice/capture-form";
import { analyzeCapture, analyzePendingCaptures, reviewEvidence } from "@/features/practice/actions";
import { getCaptureEntries, getDailyFeed } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { work_event: "工作事件", idea: "想法", question: "问题", follow_up: "待跟进" };
const analysisLabels: Record<string, string> = { not_requested: "尚未分析", pending: "等待分析", processing: "分析中", completed: "已分析", failed: "分析失败" };
const evidenceStatus = {
  candidate: { label: "AI 候选", className: "bg-amber-50 text-amber-800" },
  confirmed: { label: "已确认", className: "bg-emerald-50 text-emerald-800" },
  needs_more: { label: "需补充", className: "bg-blue-50 text-blue-800" },
  invalidated: { label: "已失效", className: "bg-soft text-muted" },
} as const;

export default async function CapturePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requestedView = (await searchParams).view;
  const view = requestedView === "analysis" || requestedView === "summary" ? "analysis" : "capture";
  const [entries, { daily, tags, gaps, evidences }] = await Promise.all([getCaptureEntries(), getDailyFeed()]);
  const pendingEntries = entries.filter((entry) => entry.analysis_status === "not_requested" || entry.analysis_status === "failed");
  return <PageContainer>
    <PageHeader eyebrow="Work Records" title="工作记录" description="记录真实工作，立即获得 AI 分析，并在同一处核对可用于能力评估的实践证据。" />
    <FeatureTabs tabs={recordTabs} active={view === "analysis" ? "/capture?view=analysis" : "/capture"} />

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
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">最近记录</h2><p className="mt-1 text-sm text-muted">AI 只分析你明确选择的记录，不会因为分析新记录而自动读取此前仅保存的内容。</p></div>{pendingEntries.length ? <form action={analyzePendingCaptures}><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent px-4 text-sm font-bold text-accent hover:bg-accent-soft"><Sparkles size={17} />{pendingEntries.length > 20 ? `分析下一批（20/${pendingEntries.length}）` : `分析全部待处理记录（${pendingEntries.length}）`}</button></form> : null}</div>
        <div className="mt-4 divide-y divide-line border-y border-line">
        {entries.length ? entries.map((entry) => {
          const canAnalyze = entry.analysis_status === "not_requested" || entry.analysis_status === "failed";
          return <article key={entry.id} className="py-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span>{labels[entry.entry_type]}</span><span>·</span><time>{new Date(entry.created_at).toLocaleString("zh-CN")}</time><span className="rounded-full bg-soft px-2 py-1">{analysisLabels[entry.analysis_status] ?? entry.analysis_status}</span></div><h3 className="mt-2 font-bold">{entry.title || "无标题记录"}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">{entry.content}</p>{entry.analysis_status === "not_requested" ? <p className="mt-3 flex items-center gap-2 text-sm text-amber-800"><CircleDashed size={16} />尚未进行 AI 分析，不会生成能力标签和实践证据。</p> : null}{entry.analysis_error ? <p className="mt-2 flex items-center gap-2 text-sm text-red-700"><AlertCircle size={16} />{entry.analysis_error}</p> : null}{canAnalyze ? <form action={analyzeCapture} className="mt-4"><input type="hidden" name="captureId" value={entry.id} /><button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white"><Sparkles size={16} />分析这条记录</button></form> : null}</article>;
        }) : <p className="py-6 text-sm text-muted">还没有工作记录。</p>}
      </div></section>
    </> : <>
      <section className="mt-7 rounded-2xl bg-accent-soft p-5 sm:p-7">
        <h2 className="text-xl font-bold">一次分析，同时生成摘要与候选证据</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">AI 会解释这条记录反映了什么，并提炼角色、行动、判断和结果。实践证据默认是候选项；你确认事实准确后，它才会参与正式能力评估。</p>
        <ContextHelpLink section="records">AI 分析与证据确认如何工作？</ContextHelpLink>
      </section>
      <section className="mt-9"><h2 className="text-xl font-bold">AI 分析结果</h2><div className="mt-4 space-y-5">
        {daily.length ? daily.map((item) => {
          const itemTags = tags.filter((tag) => tag.daily_reflection_id === item.id);
          const itemGaps = gaps.filter((gap) => gap.daily_reflection_id === item.id);
          const itemEvidence = evidences.filter((evidence) => evidence.source_daily_id === item.id);
          return <article key={item.id} className="rounded-2xl border border-line p-5 sm:p-6"><time className="text-xs font-semibold text-muted">{new Date(item.created_at).toLocaleString("zh-CN")}</time><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{item.analysis}</p><div className="mt-4 flex flex-wrap gap-2">{itemTags.map((tag) => <span key={`${tag.daily_reflection_id}-${tag.capability_id}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">{tag.capabilities?.title_en ?? "Capability"} · {Math.round((tag.confidence ?? 0) * 100)}%</span>)}</div>{item.responsibility_hint ? <p className="mt-4 text-sm"><strong>Responsibility：</strong>{item.responsibility_hint}</p> : null}{itemGaps.length ? <div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold">仍需补充</h3><ul className="mt-2 space-y-2 text-sm text-muted">{itemGaps.map((gap) => <li key={gap.id}>• [{gap.gap_type}] {gap.title} — {gap.detail}</li>)}</ul></div> : null}<div id="evidence" className="mt-6 border-t border-line pt-5"><div className="flex items-center gap-2"><CheckCircle2 className="text-accent" size={18} /><h3 className="font-bold">实践证据</h3></div>{itemEvidence.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{itemEvidence.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}</div> : <p className="mt-3 text-sm text-muted">这条记录没有提炼出可用的实践证据。</p>}</div></article>;
        }) : <p className="rounded-2xl border border-line p-6 text-sm text-muted">还没有 AI 分析结果。保存工作记录时选择“保存并分析”后，结果会出现在这里。</p>}
      </div></section>
    </>}
  </PageContainer>;
}

type Evidence = Awaited<ReturnType<typeof getDailyFeed>>["evidences"][number];

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const status = evidenceStatus[evidence.review_status as keyof typeof evidenceStatus] ?? evidenceStatus.candidate;
  return <section className="rounded-xl bg-soft p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{evidence.capabilities?.title_en} · {evidence.capabilities?.title_zh}</p><div className="flex items-center gap-2"><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">{evidence.evidence_level}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></div></div><dl className="mt-4 space-y-3 text-sm leading-6"><EvidenceField label="Context" value={evidence.context} /><EvidenceField label="User Role" value={evidence.user_role} /><EvidenceField label="Action" value={evidence.action} /><EvidenceField label="Decision" value={evidence.decision} /><EvidenceField label="Outcome" value={evidence.outcome} /><EvidenceField label="Limitations" value={evidence.limitations} /><EvidenceField label="Next Evidence" value={evidence.next_evidence_needed} /></dl>{evidence.review_status === "candidate" ? <form action={reviewEvidence} className="mt-5 flex flex-wrap gap-2"><input type="hidden" name="evidenceId" value={evidence.id} /><button name="status" value="confirmed" className="min-h-10 rounded-lg bg-accent px-3 text-sm font-bold text-white">事实准确，确认采用</button><button name="status" value="needs_more" className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-bold">需要补充</button><button name="status" value="invalidated" className="min-h-10 rounded-lg px-3 text-sm font-bold text-muted">不采用</button></form> : null}</section>;
}

function EvidenceField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="font-bold text-muted">{label}</dt><dd>{value}</dd></div>;
}
