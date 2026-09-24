"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, X } from "lucide-react";
import {
  cancelStudyAttempt,
  confirmStudyAttempt,
  evaluateStudyAttempt,
  startStudyAttempt,
} from "./actions";

type Attempt = {
  id: string;
  recallQuestion: string;
  applicationQuestion: string;
};

type Evaluation = {
  teaching: string;
  rationale: string;
  conceptScore: number;
  applicationScore: number;
};

export function StudyRunner({
  conceptId,
  sessionType,
}: {
  conceptId: string;
  sessionType: "study" | "quiz";
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [phase, setPhase] = useState<"intro" | "recall" | "application" | "feedback" | "saved" | "cancelled">("intro");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [applicationAnswer, setApplicationAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [saved, setSaved] = useState<{ sessionId: string; nextReviewAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startStudyAttempt(conceptId, sessionType);
      if (!result.ok) return setError(result.error);
      setAttempt({
        id: result.data.attemptId,
        recallQuestion: result.data.recallQuestion,
        applicationQuestion: result.data.applicationQuestion,
      });
      setPhase("recall");
    });
  }

  function evaluate() {
    if (!attempt) return;
    setError(null);
    startTransition(async () => {
      const result = await evaluateStudyAttempt({ attemptId: attempt.id, recallAnswer, applicationAnswer });
      if (!result.ok) return setError(result.error);
      setEvaluation(result.data);
      setPhase("feedback");
    });
  }

  function confirm() {
    if (!attempt) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmStudyAttempt(attempt.id);
      if (!result.ok) return setError(result.error);
      setSaved(result.data);
      setPhase("saved");
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      if (attempt) await cancelStudyAttempt(attempt.id);
      setPhase("cancelled");
    });
  }

  if (phase === "saved" && saved) {
    return (
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Check /></span>
        <h2 className="mt-5 text-2xl font-bold">本次结果已保存</h2>
        <p className="mt-2 leading-7 text-muted">Knowledge Progress 已更新。下次复习日期：{saved.nextReviewAt}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/study/history/${saved.sessionId}`} className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-bold text-white">查看学习记录</Link>
          <Link href={sessionType === "quiz" ? "/quiz" : "/study"} className="inline-flex min-h-12 items-center rounded-xl border border-line px-5 font-bold">返回学习中心</Link>
        </div>
      </section>
    );
  }

  if (phase === "cancelled") {
    return (
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-soft text-muted"><X /></span>
        <h2 className="mt-5 text-2xl font-bold">本次学习已取消</h2>
        <p className="mt-2 leading-7 text-muted">回答和评分没有写入 Study Session，也没有更新 Knowledge Progress。</p>
        <Link href={sessionType === "quiz" ? "/quiz" : "/study"} className="mt-6 inline-flex min-h-12 items-center rounded-xl border border-line px-5 font-bold">返回</Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-8">
      {phase === "intro" ? (
        <>
          <p className="text-sm font-bold text-accent">{sessionType === "quiz" ? "到期复习" : "主动回忆"}</p>
          <h2 className="mt-3 text-2xl font-bold">先回答，再看反馈</h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">Teacher 会先检查概念理解，再用真实管理情境检查应用能力。最终确认前不会污染你的学习进度。</p>
          <button type="button" onClick={start} disabled={isPending} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60 sm:w-auto">
            {isPending ? <LoaderCircle className="animate-spin" size={20} /> : null}
            生成诊断问题 <ArrowRight size={19} />
          </button>
        </>
      ) : null}

      {phase === "recall" && attempt ? (
        <QuestionStep eyebrow="1 / 2 · Recall" question={attempt.recallQuestion} value={recallAnswer} onChange={setRecallAnswer}>
          <button type="button" onClick={() => recallAnswer.trim() ? setPhase("application") : setError("请先回答 Recall Question。") } className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-white sm:w-auto">继续 Application <ArrowRight size={18} /></button>
        </QuestionStep>
      ) : null}

      {phase === "application" && attempt ? (
        <QuestionStep eyebrow="2 / 2 · Application" question={attempt.applicationQuestion} value={applicationAnswer} onChange={setApplicationAnswer}>
          <button type="button" onClick={() => setPhase("recall")} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line px-4 font-bold"><ArrowLeft size={18} /> 返回</button>
          <button type="button" onClick={evaluate} disabled={isPending || !applicationAnswer.trim()} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-white disabled:opacity-60 sm:flex-none">
            {isPending ? <LoaderCircle className="animate-spin" size={20} /> : null}提交评估
          </button>
        </QuestionStep>
      ) : null}

      {phase === "feedback" && evaluation ? (
        <div>
          <p className="text-sm font-bold text-accent">Teacher Feedback</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
            <Score label="Concept" value={evaluation.conceptScore} />
            <Score label="Application" value={evaluation.applicationScore} />
          </div>
          <div className="mt-6 space-y-5 text-[15px] leading-7">
            <div><h3 className="font-bold">教学反馈</h3><p className="mt-2 whitespace-pre-wrap text-muted">{evaluation.teaching}</p></div>
            <div><h3 className="font-bold">判断理由</h3><p className="mt-2 whitespace-pre-wrap text-muted">{evaluation.rationale}</p></div>
          </div>
          <div className="mt-7 rounded-xl bg-accent-soft p-4 text-sm leading-6 text-accent-strong">只有点击“确认保存”后，才会创建 Study Session 并更新 Knowledge Progress。</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={confirm} disabled={isPending} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-white disabled:opacity-60 sm:flex-none"><Check size={18} />确认保存</button>
            <button type="button" onClick={cancel} disabled={isPending} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-5 font-bold">放弃结果</button>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
      {attempt && !["feedback"].includes(phase) ? (
        <button type="button" onClick={cancel} disabled={isPending} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><X size={17} />取消本次学习</button>
      ) : null}
    </section>
  );
}

function QuestionStep({ eyebrow, question, value, onChange, children }: { eyebrow: string; question: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-accent">{eyebrow}</p>
      <h2 className="mt-4 text-xl font-bold leading-8 sm:text-2xl">{question}</h2>
      <label className="mt-6 block text-sm font-bold" htmlFor="study-answer">你的回答</label>
      <textarea id="study-answer" value={value} onChange={(event) => onChange(event.target.value)} rows={8} autoFocus className="mt-2 w-full resize-y rounded-xl border border-line bg-white px-4 py-3 leading-7 outline-none focus:border-accent" placeholder="不知道也可以直接写不知道。请先依靠自己的理解回答。" />
      <div className="mt-5 flex gap-3">{children}</div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p><p className="mt-1 text-3xl font-bold">{value}<span className="text-base text-muted"> / 3</span></p></div>;
}
