import { AppShell } from "@/components/navigation/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const displayName = profile?.display_name || user.email?.split("@")[0] || "Executive";
  return <AppShell displayName={displayName}>{children}</AppShell>;
}
