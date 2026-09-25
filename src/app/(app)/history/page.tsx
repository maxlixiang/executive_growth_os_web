import Link from "next/link";
import { History } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { getStudyHistory } from "@/features/knowledge/queries";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

const categories = [
  { key: "all", label: "全部" },
  { key: "learning", label: "学习" },
  { key: "records", label: "工作记录" },
  { key: "evidence", label: "实践证据" },
  { key: "reviews", label: "复盘" },
  { key: "assessment", label: "评估" },
  { key: "journey", label: "计划与旅程" },
  { key: "other", label: "其他" },
] as const;

type Category = typeof categories[number]["key"];
type ActivityEvent = { event_type: string; source_type: string | null };
type HistoryItem = { id: string; journeyId: string | null; category: Exclude<Category, "all">; title: string; summary: string | null; occurredAt: string; href?: string };

export function classifyHistoryEvent(event: ActivityEvent): Exclude<Category, "all"> {
  const type = event.event_type.toLocaleLowerCase();
  const source = event.source_type?.toLocaleLowerCase() ?? "";
  if (source.includes("study") || type.includes("study") || type.includes("quiz")) return "learning";
  if (source.includes("capture") || source.includes("daily") || type.includes("capture") || type.includes("daily")) return "records";
  if (source.includes("evidence") || type.includes("evidence")) return "evidence";
  if (source.includes("review") || type.includes("review") || type.includes("interview")) return "reviews";
  if (source.includes("assessment") || type.includes("assessment") || type.includes("baseline")) return "assessment";
  if (source.includes("growth_plan") || type.includes("journey") || type.includes("cycle") || type.includes("formal_learning") || type.includes("growth_plan")) return "journey";
  return "other";
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ scope?: string; category?: string }> }) {
  const params = await searchParams;
  const scope = params.scope === "all" ? "all" : "current";
  const category = categories.some((item) => item.key === params.category) ? params.category as Category : "all";
  const [workspace, { supabase, user }, studyHistory] = await Promise.all([getJourneyWorkspace(), requireUser(), getStudyHistory()]);
  let query = supabase.from("activity_events").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(200);
  if (scope === "current" && workspace.journey) query = query.eq("journey_id", workspace.journey.id);
  const [eventsResult, capturesResult, evidenceResult, assessmentsResult] = await Promise.all([
    query,
    supabase.from("capture_entries").select("id, journey_id, title, entry_type, content, analysis_status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("practice_evidence").select("id, journey_id, evidence_level, review_status, context, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("assessment_sessions").select("id, journey_id, assessment_type, status, readiness_score, completed_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [eventsResult, capturesResult, evidenceResult, assessmentsResult]) if (result.error) throw new Error(result.error.message);
  const journeyById = new Map(workspace.journeys.map((item) => [item.id, item]));
  const inScope = (journeyId: string | null) => scope === "all" || !workspace.journey || journeyId === workspace.journey.id;
  const assessmentLabels: Record<string, string> = { baseline: "基线诊断", self_check: "自主评估", formal: "双月正式评估" };
  const items: HistoryItem[] = [
    ...(eventsResult.data ?? []).map((event) => ({ id: `event-${event.id}`, journeyId: event.journey_id, category: classifyHistoryEvent(event), title: event.title, summary: event.summary, occurredAt: event.occurred_at })),
    ...studyHistory.map(({ session, concept }) => ({ id: `study-${session.id}`, journeyId: session.journey_id, category: "learning" as const, title: `${session.session_type === "quiz" ? "完成复习" : "完成学习"} · ${concept?.title_en ?? "Knowledge"} · ${concept?.title_zh ?? "知识点"}`, summary: session.is_valid ? `概念 ${session.concept_score}/3 · 应用 ${session.application_score}/3` : "该学习记录已作废，不参与进度。", occurredAt: session.committed_at, href: `/study/history/${session.id}` })),
    ...(capturesResult.data ?? []).map((entry) => ({ id: `capture-${entry.id}`, journeyId: entry.journey_id, category: "records" as const, title: entry.title || (entry.entry_type === "work_event" ? "工作事件" : "工作记录"), summary: `${entry.content.slice(0, 180)}${entry.content.length > 180 ? "…" : ""}`, occurredAt: entry.created_at, href: "/capture" })),
    ...(evidenceResult.data ?? []).map((evidence) => ({ id: `evidence-${evidence.id}`, journeyId: evidence.journey_id, category: "evidence" as const, title: `实践证据 · ${evidence.evidence_level} · ${evidence.review_status === "confirmed" ? "已确认" : evidence.review_status === "needs_more" ? "需补充" : evidence.review_status === "invalidated" ? "已失效" : "AI 候选"}`, summary: evidence.context, occurredAt: evidence.created_at, href: "/capture?view=analysis#evidence" })),
    ...(assessmentsResult.data ?? []).map((assessment) => ({ id: `assessment-${assessment.id}`, journeyId: assessment.journey_id, category: "assessment" as const, title: assessmentLabels[assessment.assessment_type] ?? "能力评估", summary: assessment.status === "completed" ? `正式结果：${assessment.readiness_score ?? "待生成"}/100` : `状态：${assessment.status}`, occurredAt: assessment.completed_at ?? assessment.created_at, href: "/assessment" })),
  ].filter((item) => inScope(item.journeyId)).toSorted((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  const visibleEvents = items.filter((item) => category === "all" || item.category === category);

  const hrefFor = (nextScope: string, nextCategory: string) => `/history?scope=${nextScope}&category=${nextCategory}`;

  return <PageContainer>
    <PageHeader backHref="/" eyebrow="Audit Trail" title="历史" description="按类型查找学习、工作、评估和旅程变化。历史只记录发生了什么，不等同于复习。" />
    <ContextHelpLink section="history">历史分类和旅程范围如何使用？</ContextHelpLink>
    <div className="mt-7 inline-flex rounded-xl bg-soft p-1">
      <Link href={hrefFor("current", category)} className={`rounded-lg px-4 py-2 text-sm font-bold ${scope === "current" ? "bg-white shadow-sm" : "text-muted"}`}>当前旅程</Link>
      <Link href={hrefFor("all", category)} className={`rounded-lg px-4 py-2 text-sm font-bold ${scope === "all" ? "bg-white shadow-sm" : "text-muted"}`}>全部旅程</Link>
    </div>
    <nav aria-label="历史分类" className="mt-5 flex flex-wrap gap-2">
      {categories.map((item) => <Link key={item.key} href={hrefFor(scope, item.key)} aria-current={category === item.key ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${category === item.key ? "bg-accent text-white" : "bg-soft text-muted hover:text-ink"}`}>{item.label}</Link>)}
    </nav>
    {scope === "all" ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">归档旅程可供回顾，但其中的数据不参与当前评分，也不会自动进入当前 AI 上下文。</p> : null}
    <section className="mt-7 border-y border-line">{visibleEvents.length ? visibleEvents.map((event) => {
      const journey = event.journeyId ? journeyById.get(event.journeyId) : null;
      const eventCategory = categories.find((item) => item.key === event.category);
      return <article key={event.id} className="flex gap-4 border-b border-line py-5 last:border-b-0"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-accent"><History size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{event.href ? <Link href={event.href} className="hover:text-accent">{event.title}</Link> : event.title}</h2><span className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted">{eventCategory?.label ?? "其他"}</span></div><time className="text-xs text-muted">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: workspace.profile?.timezone ?? "Asia/Shanghai" }).format(new Date(event.occurredAt))}</time></div>{event.summary ? <p className="mt-2 text-sm leading-6 text-muted">{event.summary}</p> : null}{journey ? <p className="mt-2 text-xs font-semibold text-accent">旅程 {journey.sequence_number} · {journey.mode === "trial" ? "试用" : "正式"}{journey.status === "archived" ? " · 已归档（不参与当前评分）" : ""}</p> : null}</div></article>;
    }) : <p className="py-10 text-center text-sm text-muted">当前范围和分类下还没有历史事件。</p>}</section>
  </PageContainer>;
}
