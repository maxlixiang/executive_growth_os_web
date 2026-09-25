import type { ReactNode } from "react";
import { DesktopNavigation, MobileNavigation } from "./app-navigation";

export function AppShell({ children, displayName }: { children: ReactNode; displayName: string }) {
  return (
    <div className="min-h-dvh bg-white">
      <DesktopNavigation displayName={displayName} />
      <div className="min-h-dvh pb-24 lg:ml-64 lg:pb-0">{children}</div>
      <MobileNavigation />
    </div>
  );
}
