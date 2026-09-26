"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { runFlexibleReview, type WorkflowState } from "./actions";

const initialState: WorkflowState = { ok: false, message: "" };

export function ReviewWorkflowButtons({ today }: { today: string }) {
  const router = useRouter();
  const [review, reviewAction, pending] = useActionState(runFlexibleReview, initialState);
  const todayDate = new Date(`${today}T00:00:00Z`);
  const weekAgo = new Date(todayDate);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  useEffect(() => {
    if (review.href) router.push(review.href);
  }, [review.href, router]);
  return <form action={reviewAction} className="mt-7 rounded-2xl border border-line p-5 sm:p-7">
    <h2 className="text-xl font-bold">发起一次自主复盘</h2>
    <p className="mt-2 text-sm leading-6 text-muted">时间范围完全由你决定，可以是一周、十天、一个月或某个项目阶段。复盘只生成总结与建议，不更新正式评分，也不会自动修改成长计划。</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold sm:col-span-2">标题（可选）<input name="title" maxLength={120} placeholder="例如：Cycle 1 前半程复盘" className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
      <label className="block text-sm font-bold">开始日期<input type="date" name="start" defaultValue={iso(weekAgo)} max={today} required className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
      <label className="block text-sm font-bold">结束日期<input type="date" name="end" defaultValue={today} max={today} required className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
    </div>
    <button disabled={pending} className="mt-5 min-h-12 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? "正在整理所选时段…" : "生成本次复盘"}</button>
    {review.message ? <p role="status" className={`mt-3 text-sm ${review.ok ? "text-emerald-700" : "text-red-700"}`}>{review.message}</p> : null}
  </form>;
}
