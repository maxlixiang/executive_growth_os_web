import { AppShell } from "@/components/navigation/app-shell";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
