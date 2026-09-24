"use client";

import { useActionState } from "react";
import { LoaderCircle, Save, Sparkles } from "lucide-react";
import { submitCapture, type CaptureState } from "./actions";

const initialState: CaptureState = { ok: false, message: "" };

export function CaptureForm() {
  const [state, action, pending] = useActionState(submitCapture, initialState);
  return (
    <form action={action} className="mt-8 space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
      <label className="block"><span className="text-sm font-semibold">标题（可选）</span><input name="title" maxLength={160} className="mt-2 min-h-12 w-full rounded-xl border border-line px-4" /></label>
      <label className="block"><span className="text-sm font-semibold">类型</span><select name="entryType" defaultValue="work_event" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4"><option value="work_event">工作事件</option><option value="idea">想法</option><option value="question">问题</option><option value="follow_up">待跟进</option></select></label>
      <label className="block"><span className="text-sm font-semibold">原始记录</span><textarea name="content" required rows={9} maxLength={20000} placeholder="发生了什么？你做了什么判断？结果如何？" className="mt-2 w-full resize-y rounded-xl border border-line px-4 py-3 leading-7" /></label>
      {state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button name="mode" value="save" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent font-bold text-accent disabled:opacity-60"><Save size={18} />仅保存</button>
        <button name="mode" value="analyze" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}保存并 AI 分析</button>
      </div>
      <p className="text-xs leading-5 text-muted">系统总是先保存原始记录；即使 AI 失败，输入也不会丢失。</p>
    </form>
  );
}
