"use client";

import { useActionState } from "react";
import { saveGrowthProfile, type GrowthProfileState } from "./actions";

const initialState: GrowthProfileState = { ok: false, message: "" };

export function GrowthProfileForm({ goal, capabilities, activeCodes }: { goal: string; capabilities: Array<{ code: string; titleEn: string; titleZh: string }>; activeCodes: string[] }) {
  const [state, action, pending] = useActionState(saveGrowthProfile, initialState);
  return <form action={action} className="mt-8 space-y-7">
    <label className="block"><span className="font-bold">总体发展目标</span><textarea name="goal" defaultValue={goal} rows={5} maxLength={2000} placeholder="例如：建立能够独立负责北美业务单元的经营判断与组织影响力。" className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
    <fieldset><legend className="font-bold">Current Focus</legend><p className="mt-2 text-sm text-muted">可选择多个能力；保存顺序以课程标准顺序为准。</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{capabilities.map((capability) => <label key={capability.code} className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-4"><input type="checkbox" name="focus" value={capability.code} defaultChecked={activeCodes.includes(capability.code)} className="size-5 accent-[var(--color-accent)]" /><span className="font-semibold">{capability.titleEn} · {capability.titleZh}</span></label>)}</div></fieldset>
    {state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}
    <button disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-6 font-bold text-white sm:w-auto">{pending ? "正在保存…" : "保存 Growth Profile"}</button>
  </form>;
}
