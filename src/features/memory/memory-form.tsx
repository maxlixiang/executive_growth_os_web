"use client";
import { useActionState } from "react";
import { saveLearnerMemory } from "./actions";
export function MemoryForm({ journeyId, markdown }: { journeyId: string; markdown: string }) {
  const [state, action, pending] = useActionState(saveLearnerMemory, { ok: false, message: "" });
  return <form action={action} className="mt-6 space-y-4">
    <input type="hidden" name="journeyId" value={journeyId} />
    <label htmlFor="learner-memory" className="block font-bold">我的背景与学习约定</label>
    <p className="text-sm leading-6 text-muted">记录岗位、已知基础、长期目标、每周学习时间、偏好、常见困难和可参与的工作机会。这里是你的自述，不会自动提高分数。AI也不会擅自覆盖你的档案。</p>
    <textarea id="learner-memory" name="markdown" defaultValue={markdown} maxLength={12000} rows={14} className="w-full rounded-xl border border-line p-4 leading-7" placeholder={"## 我的背景\n法务经验；其他管理领域从基础开始。\n## 当前基础\n例如：财务概念尚未学习。\n## 学习偏好\n先讲概念、例子和记忆要点，再独立回答；定期复习。\n## 时间与目标\n请填写实际可用时间、发展目标和工作机会。"} />
    <button disabled={pending} className="min-h-12 rounded-xl bg-accent px-5 font-bold text-white disabled:opacity-60">{pending ? "正在保存…" : "保存学习者档案"}</button>
    {state.message ? <p role="status" className={state.ok ? "text-emerald-700" : "text-red-700"}>{state.message}</p> : null}
  </form>;
}
export function MemoryExport({ markdown }: { markdown: string }) {
  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "my-teacher-memory.md"; link.click(); URL.revokeObjectURL(url);
  }
  return <button onClick={download} className="mt-4 min-h-11 rounded-xl border border-line px-4 font-bold">下载当前教学记忆 Markdown</button>;
}
