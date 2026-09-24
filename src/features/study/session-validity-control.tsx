"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Undo2 } from "lucide-react";
import { setStudySessionValidity } from "./actions";

export function SessionValidityControl({ sessionId, valid }: { sessionId: string; valid: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await setStudySessionValidity(sessionId, !valid, reason);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-line p-5">
      <h2 className="font-bold">人工纠错</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{valid ? "作废后，这条记录不再影响 Knowledge Progress；历史仍然保留。" : "恢复后，系统会把这条记录重新纳入进度重建。"}</p>
      {valid ? <label className="mt-4 block text-sm font-semibold">作废原因（可选）<input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label> : null}
      <button type="button" onClick={submit} disabled={isPending} className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold ${valid ? "border border-red-200 text-red-700" : "bg-accent text-white"}`}>
        {isPending ? <LoaderCircle size={18} className="animate-spin" /> : valid ? <Undo2 size={18} /> : <Check size={18} />}
        {valid ? "标记为无效" : "恢复为有效"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}
