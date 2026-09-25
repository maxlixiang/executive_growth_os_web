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
  { href: "/capture?view=summary", label: "AI 今日摘要" },
] as const;
