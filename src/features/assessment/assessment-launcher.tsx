"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { startAssessment } from "./actions";

export function AssessmentLauncher({ type, disabled, activeSessionId }: { type: "baseline" | "self_check" | "formal"; disabled?: boolean; activeSessionId?: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const label = activeSessionId ? "继续进行中的评估" : type === "baseline" ? "开始基线诊断" : type === "formal" ? "开始双月正式评估" : "开始自主评估";
  function start() {
    if (activeSessionId) return router.push(`/assessment/${activeSessionId}`);
    setError("");
    startTransition(async () => {
      const result = await startAssessment(type);
      if (!result.ok) return setError(result.error);
      router.push(`/assessment/${result.data.sessionId}`);
    });
  }
  return <div className="mt-5"><button type="button" onClick={start} disabled={disabled || pending} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">{pending ? <LoaderCircle size={17} className="animate-spin" /> : null}{label}<ArrowRight size={16} /></button>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</div>;
}
