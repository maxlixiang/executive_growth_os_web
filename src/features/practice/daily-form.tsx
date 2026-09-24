"use client";

import { useActionState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { submitDaily, type CaptureState } from "./actions";

const initialState: CaptureState = { ok: false, message: "" };

export function DailyForm() {
  const [state, action, pending] = useActionState(submitDaily, initialState);
  return (
    <form action={action} className="mt-8 space-y-5 rounded-2xl bg-accent-soft p-5 sm:p-7">
      <label className="block"><span className="text-sm font-bold text-accent-strong">今天发生了什么？</span><textarea name="content" required rows={10} maxLength={20000} placeholder="自然地写，不需要整理成表格。可以包含你的角色、判断、取舍、数字、结果和仍然不理解的地方。" className="mt-3 w-full resize-y rounded-xl border border-line bg-white px-4 py-3 leading-7" /></label>
      {state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-white text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}
      <button disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-white sm:w-auto">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}保存并分析</button>
    </form>
  );
}
