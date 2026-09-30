"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { submitAssessment } from "./actions";
import type { AssessmentQuestion } from "./questions";

type Answer = { knowledge: string; case: string };

export function AssessmentRunner({ sessionId, questions }: { sessionId: string; questions: AssessmentQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(Object.fromEntries(questions.map((item) => [item.code, { knowledge: "", case: "" }])));
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  function update(code: string, field: keyof Answer, value: string) { setAnswers((current) => ({ ...current, [code]: { ...current[code], [field]: value } })); }
  function submit() { setError(""); startTransition(async () => { const response = await submitAssessment(sessionId, answers); if (!response.ok) return setError(response.error); setResult(response.data.readiness); }); }
  if (result != null) return <section className="rounded-2xl border border-accent bg-accent-soft p-6 sm:p-8"><CheckCircle2 className="text-accent" size={42} /><h2 className="mt-4 text-2xl font-bold">评估已完成</h2><p className="mt-2 leading-7 text-muted">综合评分为 <strong className="text-ink">{result.toFixed(2)} / 100</strong>。分项理由、证据和置信度已经保存。</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/assessment?view=history" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-bold text-white">查看评估历史</Link><Link href="/assessment" className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-5 font-bold">返回评估中心</Link></div></section>;
  return <div className="space-y-6">{questions.map((question, index) => <section key={question.code} className="rounded-2xl border border-line bg-white p-5 sm:p-7"><p className="text-sm font-bold text-accent">{index + 1} / 6 · {question.title}</p><label className="mt-5 block"><span className="font-bold">知识理解</span><span className="mt-2 block leading-7">{question.knowledgeQuestion}</span><textarea value={answers[question.code]?.knowledge ?? ""} onChange={(event) => update(question.code, "knowledge", event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7 outline-none focus:border-accent" placeholder="不知道也可以直接写不知道；请只依据自己的理解回答。" /></label><label className="mt-6 block"><span className="font-bold">案例分析</span><span className="mt-2 block leading-7">{question.caseQuestion}</span><textarea value={answers[question.code]?.case ?? ""} onChange={(event) => update(question.code, "case", event.target.value)} rows={6} className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7 outline-none focus:border-accent" placeholder="说明你需要的数据、判断过程、取舍、风险和下一步行动。" /></label></section>)}<section className="rounded-2xl bg-soft p-5 sm:p-7"><h2 className="text-xl font-bold">提交前确认</h2><p className="mt-2 text-sm leading-6 text-muted">系统会把本次回答、当前旅程的私人教学记忆、知识进度和已确认实践证据发送给现有 DeepSeek 服务。AI 给出分项判断；系统再执行证据等级上限和确定性总分计算。</p>{error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<button type="button" onClick={submit} disabled={pending} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={19} /> : null}{pending ? "AI 正在评估…" : "提交并生成评分"}</button></section></div>;
}
