"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startPracticeInterview, type WorkflowState } from "@/features/reviews/actions";

const initialState: WorkflowState = { ok: false, message: "" };

export function InterviewStartForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(startPracticeInterview, initialState);
  useEffect(() => { if (state.href) router.push(state.href); }, [state.href, router]);
  return <form action={action} className="mt-7 rounded-2xl border border-line p-5 sm:p-7">
    <h2 className="text-xl font-bold">随时开始一次练习</h2>
    <p className="mt-2 text-sm leading-6 text-muted">模拟面试由你决定何时开始。结果只用于练习反馈和教学建议，不会改变正式评分。</p>
    <label className="mt-5 block text-sm font-bold">面试标题（可选）<input name="title" maxLength={120} placeholder="例如：财务与经营数字专项面试" className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
    <button disabled={pending} className="mt-5 min-h-12 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? "正在准备第一问…" : "开始模拟面试"}</button>
    {state.message ? <p role="status" className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
  </form>;
}
