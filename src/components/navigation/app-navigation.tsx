"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { desktopNavItems, mobileNavItems, settingsItem } from "./nav-items";

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function DesktopNavigation({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-sidebar px-5 py-7 lg:flex">
      <Link href="/" className="px-2 text-[17px] font-bold tracking-[-0.02em] text-ink">
        Executive Growth OS
      </Link>
      <nav aria-label="主导航" className="mt-8 flex flex-1 flex-col gap-1">
        {desktopNavItems.map((item) => {
          const active = isCurrent(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors ${
                active ? "bg-accent-soft text-accent-strong" : "text-ink hover:bg-white"
              }`}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>{item.label}</span>
              <span className="text-muted">{item.secondary}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line pt-4">
        <Link
          href={settingsItem.href}
          className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-ink hover:bg-white"
        >
          <settingsItem.icon aria-hidden="true" size={20} strokeWidth={1.75} />
          <span>{settingsItem.label}</span>
          <span className="text-muted">{settingsItem.secondary}</span>
        </Link>
        <div className="mt-3 flex items-center gap-3 px-3 py-2 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-full bg-accent text-white">{displayName.slice(0, 1).toLocaleUpperCase()}</span>
          <span className="truncate">{displayName}</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden"
    >
      {mobileNavItems.map((item) => {
        const active = isCurrent(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.1 : 1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
