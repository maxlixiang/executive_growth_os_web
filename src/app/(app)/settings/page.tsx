import { PageContainer, PageHeader } from "@/components/page-header";
import { GrowthProfileForm } from "@/features/growth/growth-profile-form";
import { getKnowledgeWorkspace } from "@/features/knowledge/queries";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [{ supabase, user }, workspace] = await Promise.all([requireUser(), getKnowledgeWorkspace()]);
  const [{ data: state }, { data: focuses }] = await Promise.all([
    supabase.from("user_growth_state").select("overall_goal, summary, recent_training_direction").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_focuses").select("capabilities(code)").eq("user_id", user.id).eq("is_active", true).order("priority"),
  ]);
  const activeCodes = (focuses ?? []).flatMap((focus) => focus.capabilities?.code ? [focus.capabilities.code] : []);
  return <PageContainer>
    <PageHeader backHref="/" eyebrow="Long-term Memory" title="Growth Profile" description="目标和 Focus 会进入后续 Teacher、Daily、Review 与 Interview 的上下文。" />
    <GrowthProfileForm goal={state?.overall_goal ?? ""} activeCodes={activeCodes} capabilities={workspace.capabilities.map((item) => ({ code: item.code, titleEn: item.titleEn, titleZh: item.titleZh }))} />
    {(state?.summary || state?.recent_training_direction) ? <section className="mt-10 rounded-2xl border border-line p-6"><h2 className="text-xl font-bold">Current State</h2>{state.summary ? <p className="mt-4 whitespace-pre-wrap leading-7 text-muted">{state.summary}</p> : null}{state.recent_training_direction ? <p className="mt-4"><strong>近期训练方向：</strong>{state.recent_training_direction}</p> : null}</section> : null}
  </PageContainer>;
}
