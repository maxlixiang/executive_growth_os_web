import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-soft px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-[0_18px_55px_rgba(11,24,48,0.08)] sm:p-9">
        <p className="text-sm font-bold text-accent">Executive Growth OS</p>
        <h1 className="mt-7 text-3xl font-bold tracking-[-0.04em]">欢迎回来</h1>
        <p className="mt-3 text-sm leading-6 text-muted">登录后继续你的学习、实践与复盘。</p>
        <LoginForm />
      </div>
    </main>
  );
}
