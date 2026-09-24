import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <header>
      {backHref ? (
        <Link href={backHref} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={18} />返回
        </Link>
      ) : null}
      {eyebrow ? <p className="text-sm font-bold text-accent">{eyebrow}</p> : null}
      <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-[-0.04em] sm:text-[42px]">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl text-[16px] leading-7 text-muted">{description}</p> : null}
    </header>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-7 sm:px-8 lg:px-12 lg:pb-16 lg:pt-10">{children}</main>;
}
