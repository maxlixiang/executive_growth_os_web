import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const routeTitles: Record<string, string> = {
  capture: "快速记录 Capture",
  daily: "每日复盘 Daily",
  study: "学习 Study",
  quiz: "复习 Quiz",
  knowledge: "知识地图 Knowledge",
  progress: "进度 Progress",
  evidence: "实践证据 Evidence",
  reviews: "复盘 Reviews",
  interviews: "模拟面试 Interviews",
  settings: "设置 Settings",
};

type PlaceholderPageProps = { params: Promise<{ placeholder: string[] }> };

export default async function PlaceholderPage({ params }: PlaceholderPageProps) {
  const { placeholder } = await params;
  const section = placeholder[0] ?? "";
  const title = routeTitles[section] ?? "Executive Growth OS";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-5 py-16 sm:px-8">
      <p className="text-sm font-bold text-accent">W1 · Mobile Layout</p>
      <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em]">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">页面入口和响应式导航已经建立。该功能将在对应阶段接入真实业务逻辑与 Supabase 数据。</p>
      <Link href="/" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-line px-5 text-sm font-bold hover:border-accent hover:text-accent">
        <ArrowLeft aria-hidden="true" size={18} /> 返回首页
      </Link>
    </main>
  );
}
