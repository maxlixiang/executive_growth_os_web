import Link from "next/link";

type Tab = {
  href: string;
  label: string;
  description?: string;
};

export function FeatureTabs({ tabs, active }: { tabs: readonly Tab[]; active: string }) {
  return (
    <nav aria-label="页面功能" className="mt-7 flex gap-1 overflow-x-auto rounded-xl bg-soft p-1">
      {tabs.map((tab) => {
        const selected = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`min-w-fit flex-1 rounded-lg px-4 py-3 text-center text-sm font-bold transition-colors ${selected ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const learningTabs = [
  { href: "/study", label: "学习" },
  { href: "/quiz", label: "复习" },
  { href: "/knowledge", label: "知识地图" },
] as const;

export const recordTabs = [
  { href: "/capture", label: "随手记录" },
  { href: "/capture?view=analysis", label: "AI 分析与实践证据" },
] as const;

export const growthTabs = [
  { href: "/plan", label: "成长概览与计划" },
  { href: "/progress", label: "能力进度" },
] as const;

export const assessmentTabs = [
  { href: "/assessment", label: "当前评估" },
  { href: "/reviews", label: "自主复盘" },
  { href: "/interviews", label: "模拟面试" },
  { href: "/assessment?view=history", label: "历史结果" },
] as const;
