"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-semibold">邮箱</span>
        <input name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border border-line px-4 text-base text-ink placeholder:text-muted/70" placeholder="name@example.com" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">密码</span>
        <input name="password" type="password" autoComplete="current-password" required minLength={8} className="mt-2 min-h-12 w-full rounded-xl border border-line px-4 text-base text-ink" />
      </label>
      {state.error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60">
        {pending ? "正在登录…" : "登录"}
      </button>
    </form>
  );
}
