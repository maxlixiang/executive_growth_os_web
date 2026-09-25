import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import type { DiagnosticConfidence } from "./confidence";

type Plan = Tables<"growth_plans">;

export function GrowthPlanSummary({
  plan,
  confidence,
  capabilityLabels,
  compact = false,
  showManage = true,
}: {
  plan: Plan | null;
  confidence: DiagnosticConfidence;
  capabilityLabels: Record<string, string>;
  compact?: boolean;
  showManage?: boolean;
}) {
  if (!plan) {
    return <section className="rounded-2xl border border-line p-6"><p className="text-sm font-bold text-accent">当前成长计划</p><h2 className="mt-2 text-xl font-bold">先确定长期方向，再开始阶段训练</h2><p className="mt-3 text-sm leading-6 text-muted">AI 会根据能力级聚合数据生成一项低置信度初始计划，由你确认后才会启用。</p><Link href="/plan" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-accent">建立成长计划 <ArrowRight size={18} /></Link></section>;
  }

  return (
    <section className={`rounded-2xl border border-line ${compact ? "p-5 sm:p-6" : "p-6 sm:p-7"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3"><p className="text-sm font-bold text-accent">当前成长计划 · v{plan.version}</p><span className="text-xs font-semibold text-muted">{plan.source === "ai" ? "AI 建议，用户确认" : plan.source === "migration" ? "从原 Growth Profile 迁移" : "用户制定"}</span></div>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">{plan.phase_goal}</h2>
          {!compact ? <p className="mt-3 max-w-3xl leading-7 text-muted"><strong className="text-foreground">长期目标：</strong>{plan.long_term_goal}</p> : null}
        </div>
        {showManage ? <Link href="/plan" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-bold hover:border-accent hover:text-accent">管理计划 <ArrowRight size={17} /></Link> : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{plan.focus_codes.map((code) => <span key={code} className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent-strong">{capabilityLabels[code] ?? code}</span>)}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold">当前诊断置信度</span><span className="font-bold text-accent">{confidence.score}/100 · {confidence.label}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-accent" style={{ width: `${confidence.score}%` }} /></div>
          <p className="mt-2 text-xs leading-5 text-muted">随有效学习、真实工作复盘、实践证据和周期评估自动变化；它表示数据充分程度，不是能力等级。</p>
        </div>
        <p className="flex items-center gap-2 text-sm font-semibold text-muted"><CalendarRange aria-hidden="true" size={17} />{plan.starts_at} — {plan.target_ends_at}</p>
      </div>
    </section>
  );
}
