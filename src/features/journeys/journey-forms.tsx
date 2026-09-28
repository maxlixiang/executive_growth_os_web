"use client";

import { useActionState } from "react";
import { confirmFormalLearningStart, correctPreparationDate, restartJourney, startInitialJourney, updateNickname, type JourneyActionState } from "./actions";

const initial: JourneyActionState = { ok: false, message: "" };
const field = "mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4";

function Status({ state }: { state: JourneyActionState }) {
  return state.message ? <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

export function NicknameForm({ nickname, email }: { nickname: string; email: string }) {
  const [state, action, pending] = useActionState(updateNickname, initial);
  return <form action={action} className="rounded-2xl border border-line p-5 sm:p-7"><h2 className="text-xl font-bold">个人称呼</h2><p className="mt-2 text-sm leading-6 text-muted">昵称只用于界面称呼。系统始终以登录账户的内部 ID 识别你，修改昵称不会产生新用户。</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="font-semibold">昵称<input className={field} name="nickname" defaultValue={nickname} required maxLength={40} /></label><label className="font-semibold text-muted">登录邮箱<input className={`${field} bg-soft`} value={email} readOnly /></label></div><Status state={state} /><button disabled={pending} className="mt-5 min-h-12 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? "保存中…" : "保存昵称"}</button></form>;
}

export function InitialJourneyForm() {
  const [state, action, pending] = useActionState(startInitialJourney, initial);
  const today = new Date().toISOString().slice(0, 10);
  return <form action={action} className="rounded-2xl border border-accent bg-white p-5 sm:p-7"><p className="text-sm font-bold text-accent">FIRST JOURNEY</p><h2 className="mt-2 text-2xl font-bold">建立你的第一段学习旅程</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">先选择试用或正式旅程，再确认基础预学习起点。两种旅程都从 24 项基础概念开始；试用数据会保留，但不会自动进入正式评分。</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="font-semibold">旅程类型<select name="mode" defaultValue="trial" className={field}><option value="trial">试用旅程 · 先熟悉产品</option><option value="official">正式旅程 · 完成基线后进入 Cycle 1</option></select></label><label className="font-semibold">基础预学习开始日<input type="date" name="startDate" defaultValue={today} max={today} required className={field} /></label></div><label className="mt-5 block font-semibold">长期目标（可稍后完善）<textarea name="longTermGoal" rows={3} maxLength={2000} className={`${field} py-3`} placeholder="例如：从法务岗位成长为能够独立负责业务单元的管理者" /></label><div className="mt-5 rounded-xl bg-accent-soft p-4 text-sm leading-6 text-accent-strong"><strong>试用旅程：</strong>适合当前产品试用；以后开始正式旅程时，旧数据会归档且不参与新的 AI 判断。<br /><strong>正式旅程：</strong>基础预学习和基线诊断属于准备阶段，完成基线后仍需你再次确认正式开始日期。</div><Status state={state} /><button disabled={pending} className="mt-5 min-h-12 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? "正在建立…" : "确认并开始基础预学习"}</button></form>;
}

export function FormalStartForm({ baselineDate }: { baselineDate: string }) {
  const [state, action, pending] = useActionState(confirmFormalLearningStart, initial);
  const today = new Date().toISOString().slice(0, 10);
  return <form action={action} className="rounded-2xl border border-accent bg-accent-soft p-5 sm:p-7"><p className="text-sm font-bold text-accent">BASELINE COMPLETE</p><h2 className="mt-2 text-2xl font-bold">确认进入正式学习</h2><p className="mt-2 text-sm leading-6 text-muted">基线诊断已建立初始分数。正式开始后将创建 Cycle 1，并以开始日为锚点安排两个月后的正式评估。</p><label className="mt-5 block max-w-sm font-semibold">正式学习开始日<input type="date" name="date" defaultValue={today} min={baselineDate} max={today} required className={field} /></label><Status state={state} /><button disabled={pending} className="mt-5 min-h-12 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? "正在开始…" : "确认开始 Cycle 1"}</button></form>;
}

export function JourneyControls({ mode, startDate, baselineCompleted }: { mode: string; startDate: string; baselineCompleted: boolean }) {
  const [dateState, dateAction, datePending] = useActionState(correctPreparationDate, initial);
  const [restartState, restartAction, restartPending] = useActionState(restartJourney, initial);
  return <div className="space-y-6"><form action={dateAction} className="rounded-2xl border border-line p-5 sm:p-7"><h2 className="text-xl font-bold">预学习开始日期</h2><p className="mt-2 text-sm leading-6 text-muted">这是两周基础准备的起点，不是正式学习周期起点。完成基线诊断后将不能直接修改。</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="font-semibold">日期<input type="date" name="date" defaultValue={startDate} required disabled={baselineCompleted} className={field} /></label><label className="font-semibold">更正原因<input name="reason" minLength={5} maxLength={1000} required disabled={baselineCompleted} placeholder="为什么需要更正？" className={field} /></label></div><Status state={dateState} /><button disabled={datePending || baselineCompleted} className="mt-5 min-h-12 rounded-xl border border-accent px-6 font-bold text-accent disabled:opacity-40">{datePending ? "保存中…" : "更正日期"}</button></form><details className="rounded-2xl border border-red-200 p-5 sm:p-7"><summary className="cursor-pointer text-lg font-bold text-red-800">重启学习旅程</summary><p className="mt-3 text-sm leading-6 text-muted">旧旅程会归档而不是删除。新旅程的学习、证据、分数与 AI 判断从“尚未评估”开始，旧数据不会自动带入。</p><form action={restartAction} className="mt-6 space-y-5"><label className="block font-semibold">新旅程类型<select name="mode" defaultValue={mode} className={field}><option value="trial">试用旅程</option><option value="official">正式旅程（先进入预学习）</option></select></label><label className="block font-semibold">新旅程预学习开始日<input type="date" name="startDate" defaultValue={new Date().toISOString().slice(0, 10)} required className={field} /></label><label className="block font-semibold">重启原因<textarea name="reason" required minLength={5} maxLength={1000} rows={3} className={`${field} py-3`} /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" name="copyGoal" className="mt-1 size-5 accent-[var(--color-accent)]" /><span>把上一旅程的长期目标复制为草稿（需要重新确认，不会自动启用旧计划）</span></label><label className="block font-semibold">输入“重新开始学习旅程”确认<input name="confirmation" required autoComplete="off" className={field} /></label><Status state={restartState} /><button disabled={restartPending} className="min-h-12 rounded-xl bg-red-700 px-6 font-bold text-white disabled:opacity-60">{restartPending ? "正在重启…" : "归档当前旅程并重新开始"}</button></form></details></div>;
}
