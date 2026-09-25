import Link from "next/link";
import { History } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const scope = (await searchParams).scope === "all" ? "all" : "current";
  const [workspace, { supabase, user }] = await Promise.all([getJourneyWorkspace(), requireUser()]);
  let query = supabase.from("activity_events").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(200);
  if (scope === "current" && workspace.journey) query = query.eq("journey_id", workspace.journey.id);
  const { data: events, error } = await query;
  if (error) throw new Error(error.message);
  const journeyById = new Map(workspace.journeys.map((item) => [item.id, item]));
  return <PageContainer><PageHeader backHref="/" eyebrow="Audit Trail" title="历史" description="按时间查看目标、学习、记录、评估和旅程变化。历史只记录发生了什么，不等同于复习。" /><div className="mt-7 inline-flex rounded-xl bg-soft p-1"><Link href="/history?scope=current" className={`rounded-lg px-4 py-2 text-sm font-bold ${scope === "current" ? "bg-white shadow-sm" : "text-muted"}`}>当前旅程</Link><Link href="/history?scope=all" className={`rounded-lg px-4 py-2 text-sm font-bold ${scope === "all" ? "bg-white shadow-sm" : "text-muted"}`}>全部旅程</Link></div>{scope === "all" ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">归档旅程可供回顾，但其中的数据不参与当前评分，也不会自动进入当前 AI 上下文。</p> : null}<section className="mt-7 border-y border-line">{events?.length ? events.map((event) => { const journey = event.journey_id ? journeyById.get(event.journey_id) : null; return <article key={event.id} className="flex gap-4 border-b border-line py-5 last:border-b-0"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-accent"><History size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{event.title}</h2><time className="text-xs text-muted">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: workspace.profile?.timezone ?? "Asia/Shanghai" }).format(new Date(event.occurred_at))}</time></div>{event.summary ? <p className="mt-2 text-sm leading-6 text-muted">{event.summary}</p> : null}{journey ? <p className="mt-2 text-xs font-semibold text-accent">旅程 {journey.sequence_number} · {journey.mode === "trial" ? "试用" : "正式"}{journey.status === "archived" ? " · 已归档（不参与当前评分）" : ""}</p> : null}</div></article>; }) : <p className="py-10 text-center text-sm text-muted">当前范围还没有历史事件。</p>}</section></PageContainer>;
}
