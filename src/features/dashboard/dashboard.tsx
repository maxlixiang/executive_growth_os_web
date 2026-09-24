import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, ClipboardCheck, FileText, Plus } from "lucide-react";
import { getQuizQueue, getRecommendation, getStudyHistory } from "@/features/knowledge/queries";
import { requireUser } from "@/lib/auth/require-user";

function formatDate(value: string | Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: timezone, ...options }).format(new Date(value));
}

export async function Dashboard() {
  const [{ workspace, recommendation }, { due }, history, { supabase, user }] = await Promise.all([
    getRecommendation(),
    getQuizQueue(),
    getStudyHistory(),
    requireUser(),
  ]);
  const [{ data: profile }, { data: review }] = await Promise.all([
    supabase.from("profiles").select("display_name, timezone").eq("id", user.id).maybeSingle(),
    supabase.from("monthly_reviews").select("id, period_start").eq("user_id", user.id).order("period_start", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const timezone = profile?.timezone ?? "Asia/Shanghai";
  const displayName = profile?.display_name || user.email?.split("@")[0] || "Executive";
  const today = formatDate(new Date(), timezone, { month: "long", day: "numeric", weekday: "long" });
  const recentGap = workspace.recentGapText.split("\n").find(Boolean);
  const focusItems = workspace.focusCapabilities;
  const latestHistory = history.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-[1220px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink lg:hidden">Executive Growth OS</p>
          <h1 className="mt-9 break-words text-[36px] font-bold leading-none tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-[42px] lg:mt-0 lg:text-[46px]">
            你好，{displayName}
          </h1>
          <p className="mt-3 text-[17px] text-muted">{today}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-soft text-base font-semibold lg:hidden">{displayName.slice(0, 1).toLocaleUpperCase()}</span>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl bg-accent-soft p-6 sm:p-8 lg:min-h-72">
          <p className="text-sm font-bold text-accent-strong">今日建议学习</p>
          <div className="mt-6 flex flex-col justify-between gap-6 lg:h-[188px]">
            {recommendation ? <>
              <div>
                <p className="text-[22px] font-medium text-muted sm:text-[25px]">{recommendation.concept.titleEn}</p>
                <h2 className="mt-1 text-[34px] font-bold leading-tight tracking-[-0.035em] sm:text-[38px]">{recommendation.concept.titleZh}</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted sm:text-base">{recommendation.reasons[0]}</p>
              </div>
              <Link
                href={`/study/${recommendation.concept.capability.toLocaleLowerCase()}/${recommendation.concept.code}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-strong sm:w-fit"
              >
                开始学习 <ArrowRight aria-hidden="true" size={19} />
              </Link>
            </> : <div><h2 className="text-2xl font-bold">当前没有新的推荐项</h2><p className="mt-3 text-muted">到期内容会出现在 Quiz，或从 Knowledge Map 选择知识点。</p></div>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex min-h-32 items-center justify-between rounded-2xl border border-line bg-white p-6 lg:min-h-36">
            <div>
              <h2 className="text-lg font-bold">今日待复习</h2>
              <p className="mt-2 text-2xl font-bold">{due.length} 项</p>
            </div>
            <Link href="/quiz" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-accent px-5 text-sm font-bold text-accent hover:bg-accent-soft">
              开始 Quiz
            </Link>
          </div>
          <Link href="/capture" aria-label="＋ 记录工作 / 想法" className="flex min-h-[76px] items-center justify-center gap-3 rounded-xl bg-accent px-6 text-base font-bold text-white transition-colors hover:bg-accent-strong lg:min-h-28">
            <Plus aria-hidden="true" size={23} />记录工作 / 想法
          </Link>
        </div>
      </section>

      <div className="dashboard-details mt-9 lg:gap-x-8">
        <section className="dashboard-gap border-b border-line pb-8 lg:pr-0">
          <SectionTitle title="最近 Knowledge Gap" href="/knowledge" />
          {recentGap ? <p className="mt-5 max-w-2xl text-[15px] leading-6 text-muted">{recentGap}</p> : <p className="mt-5 text-[15px] text-muted">最近 30 天还没有 Knowledge Gap。</p>}
        </section>

        <section className="dashboard-focus border-b border-line py-8 lg:border-l lg:pl-8 lg:pt-0">
          <SectionTitle title="Current Focus" href="/progress" />
          <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {focusItems.length > 0 ? focusItems.map((item) => (
              <li key={item} className="rounded-full bg-soft px-4 py-2 text-sm font-medium lg:rounded-none lg:bg-transparent lg:px-0 lg:py-3 lg:text-base">{item}</li>
            )) : <li className="py-3 text-sm text-muted">尚未设置 Focus</li>}
          </ul>
        </section>

        <section className="dashboard-activity pt-8">
          <SectionTitle title="最近活动" />
          <div className="mt-4 divide-y divide-line border-y border-line">
            {latestHistory.length > 0 ? latestHistory.map(({ session, concept }) => (
              <ActivityRow
                key={session.id}
                icon={session.session_type === "quiz" ? ClipboardCheck : BookOpen}
                kind={session.session_type === "quiz" ? "Quiz" : "Study"}
                title={concept ? `${concept.title_en} · ${concept.title_zh}` : "Knowledge session"}
                date={formatDate(session.committed_at, timezone, { month: "numeric", day: "numeric" })}
                href={`/study/history/${session.id}`}
              />
            )) : <p className="py-6 text-sm text-muted">完成第一次 Study 后，活动会出现在这里。</p>}
          </div>
        </section>

        <section className="dashboard-review border-t border-line pt-8 lg:border-l lg:pl-8">
          <SectionTitle title="最近 Review" />
          <Link href={review ? `/reviews/monthly/${review.period_start.slice(0, 7)}` : "/reviews"} className="mt-4 flex min-h-16 items-center gap-3 border-b border-line py-3 hover:text-accent">
            <span className="grid size-10 place-items-center rounded-full bg-soft"><FileText aria-hidden="true" size={20} strokeWidth={1.75} /></span>
            <span className="flex-1 font-semibold">{review ? `${formatDate(review.period_start, timezone, { year: "numeric", month: "long" })} Monthly Review` : "尚未生成 Monthly Review"}</span>
            <ChevronRight aria-hidden="true" size={19} className="text-muted" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  const content = (
    <><h2 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h2>{href ? <ChevronRight aria-hidden="true" size={20} className="text-muted" /> : null}</>
  );
  return href ? <Link href={href} className="flex min-h-11 items-center justify-between hover:text-accent">{content}</Link> : <div className="flex min-h-11 items-center justify-between">{content}</div>;
}

function ActivityRow({ icon: Icon, kind, title, date, href }: { icon: typeof BookOpen; kind: string; title: string; date: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-20 items-center gap-3 py-3 hover:text-accent">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-soft"><Icon aria-hidden="true" size={21} strokeWidth={1.75} /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted">{kind}</p><p className="mt-1 truncate text-[15px] font-semibold">{title}</p></div>
      <time className="shrink-0 text-sm text-muted">{date}</time>
      <ChevronRight aria-hidden="true" size={18} className="text-muted" />
    </Link>
  );
}
