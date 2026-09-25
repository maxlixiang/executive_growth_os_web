import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";

export function ContextHelpLink({ section, children }: { section: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/help#${section}`}
      className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent hover:text-accent-strong"
    >
      <CircleHelp aria-hidden="true" size={18} />
      <span>{children}</span>
      <ArrowRight aria-hidden="true" size={17} />
    </Link>
  );
}
