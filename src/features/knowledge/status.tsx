import type { ProgressStatus } from "./domain";

export const statusMeta: Record<ProgressStatus, { label: string; symbol: string; className: string }> = {
  unknown: { label: "未学习", symbol: "○", className: "bg-soft text-muted" },
  learning: { label: "学习中", symbol: "◐", className: "bg-blue-50 text-blue-700" },
  understood: { label: "已理解", symbol: "✓", className: "bg-sky-50 text-sky-700" },
  applied: { label: "已应用", symbol: "✓", className: "bg-accent-soft text-accent-strong" },
  verified: { label: "已验证", symbol: "★", className: "bg-amber-50 text-amber-700" },
  needs_review: { label: "需要复习", symbol: "↻", className: "bg-orange-50 text-orange-700" },
};

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const meta = statusMeta[status];
  return <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${meta.className}`}><span>{meta.symbol}</span>{meta.label}</span>;
}
