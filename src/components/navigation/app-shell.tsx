import type { ReactNode } from "react";
import { DesktopNavigation, MobileNavigation } from "./app-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <DesktopNavigation />
      <div className="min-h-dvh pb-24 lg:ml-64 lg:pb-0">{children}</div>
      <MobileNavigation />
    </div>
  );
}
