"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { answerInterview, continueInterview, type WorkflowState } from "@/features/reviews/actions";

const initialState: WorkflowState = { ok: false, message: "" };

export function InterviewControls({ id, status, lastRole }: { id: string; status: string; lastRole?: string }) {
  const router = useRouter();
  const [answerState, answerAction, answerPending] = useActionState(answerInterview, initialState);
  const [continueState, continueAction, continuePending] = useActionState(continueInterview, initialState);
  useEffect(() => {
    const state = answerState.href ? answerState : continueState.href ? continueState : answerState.ok ? answerState : continueState;
    if (state.href) router.push(state.href);
    else if (state.ok) router.refresh();
  }, [answerState, continueState, router]);
  if (status !== "active") return null;
  if (lastRole === "interviewer") return <form action={answerAction} className="mt-8 rounded-2xl border border-line p-5">
    <input type="hidden" name="id" value={id} />
    <label className="font-bold">你的回答<textarea name="answer" required maxLength={8000} rows={8} placeholder="说明你本人采取的行动、数字、取舍、反对意见与最终结果。" className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
    <button disabled={answerPending} className="mt-4 min-h-12 w-full rounded-xl bg-accent px-5 font-bold text-white sm:w-auto">{answerPending ? "正在保存并分析…" : "提交回答"}</button>
    {answerState.message ? <p role="status" className={`mt-3 text-sm ${answerState.ok ? "text-emerald-700" : "text-red-700"}`}>{answerState.message}</p> : null}
  </form>;
  return <form action={continueAction} className="mt-8 rounded-2xl border border-line p-5">
    <input type="hidden" name="id" value={id} />
    <p className="text-sm leading-6 text-muted">上一条回答已经安全保存。继续后会生成下一问，或在第三轮后生成季度评估。</p>
    <button disabled={continuePending} className="mt-4 min-h-12 rounded-xl border border-accent px-5 font-bold text-accent">{continuePending ? "正在继续…" : "继续访谈"}</button>
    {continueState.message ? <p role="status" className={`mt-3 text-sm ${continueState.ok ? "text-emerald-700" : "text-red-700"}`}>{continueState.message}</p> : null}
  </form>;
}
