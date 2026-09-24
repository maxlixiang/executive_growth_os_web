"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { runMonthlyReview, startQuarterlyInterview, type WorkflowState } from "./actions";

const initialState: WorkflowState = { ok: false, message: "" };

export function ReviewWorkflowButtons({ month, quarter }: { month: string; quarter: string }) {
  const router = useRouter();
  const [monthly, monthlyAction, monthlyPending] = useActionState(runMonthlyReview, initialState);
  const [quarterly, quarterlyAction, quarterlyPending] = useActionState(startQuarterlyInterview, initialState);
  useEffect(() => {
    const href = monthly.href || quarterly.href;
    if (href) router.push(href);
  }, [monthly.href, quarterly.href, router]);
  return <div className="mt-6 grid gap-4 md:grid-cols-2">
    <form action={monthlyAction} className="rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">Monthly Review</h2>
      <p className="mt-2 text-sm leading-6 text-muted">严格按所选自然月读取 Daily、Study、Quiz、Evidence 与 Gap。</p>
      <label className="mt-5 block text-sm font-bold">月份<input type="month" name="period" defaultValue={month} required className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
      <button disabled={monthlyPending} className="mt-4 min-h-12 w-full rounded-xl bg-accent px-5 font-bold text-white">{monthlyPending ? "正在生成…" : "生成 Monthly Review"}</button>
      {monthly.message ? <p role="status" className={`mt-3 text-sm ${monthly.ok ? "text-emerald-700" : "text-red-700"}`}>{monthly.message}</p> : null}
    </form>
    <form action={quarterlyAction} className="rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">Quarterly Mock Executive Review</h2>
      <p className="mt-2 text-sm leading-6 text-muted">启动三轮 Evidence First 高管模拟面试，完成后生成季度评估。</p>
      <input type="hidden" name="period" value={quarter} />
      <p className="mt-5 text-sm font-bold">当前季度：{quarter}</p>
      <button disabled={quarterlyPending} className="mt-4 min-h-12 w-full rounded-xl border border-accent px-5 font-bold text-accent">{quarterlyPending ? "正在准备第一问…" : "开始 / 继续季度面试"}</button>
      {quarterly.message ? <p role="status" className={`mt-3 text-sm ${quarterly.ok ? "text-emerald-700" : "text-red-700"}`}>{quarterly.message}</p> : null}
    </form>
  </div>;
}
