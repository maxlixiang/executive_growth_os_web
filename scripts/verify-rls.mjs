import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries((await readFile(".env.local", "utf8"))
  .split(/\r?\n/)
  .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
  .map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Missing Supabase QA credentials.");

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, secretKey, options);
const anonymous = createClient(url, publishableKey, options);
const runId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const password = `Rls-${crypto.randomUUID()}-9!`;
const createdUserIds = [];

async function createTestUser(label) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `rls-${label}-${runId}@example.invalid`,
    password,
    email_confirm: true,
    user_metadata: { display_name: `RLS ${label}` },
  });
  if (error || !data.user) throw new Error(`Unable to create test user ${label}: ${error?.message}`);
  createdUserIds.push(data.user.id);
  const client = createClient(url, publishableKey, options);
  const { error: signInError } = await client.auth.signInWithPassword({ email: data.user.email, password });
  if (signInError) throw new Error(`Unable to sign in test user ${label}: ${signInError.message}`);
  return { id: data.user.id, client };
}

const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) throw new Error(`${name}: ${detail}`);
}

try {
  const userA = await createTestUser("a");
  const userB = await createTestUser("b");
  const { data: capture, error: insertError } = await userA.client.from("capture_entries").insert({
    user_id: userA.id,
    title: "RLS isolation probe",
    content: "Temporary automated RLS verification record.",
    entry_type: "work_event",
  }).select("id").single();
  check("User A can insert own row", !insertError && Boolean(capture?.id), insertError?.message ?? "inserted");

  const anonymousRead = await anonymous.from("capture_entries").select("id").eq("id", capture.id);
  check("Anonymous cannot read private row", Boolean(anonymousRead.error) || anonymousRead.data?.length === 0, anonymousRead.error?.message ?? `${anonymousRead.data?.length} rows`);

  const aRead = await userA.client.from("capture_entries").select("id").eq("id", capture.id);
  check("User A can read own row", !aRead.error && aRead.data?.length === 1, aRead.error?.message ?? `${aRead.data?.length} rows`);

  const bRead = await userB.client.from("capture_entries").select("id").eq("id", capture.id);
  check("User B cannot read User A row", !bRead.error && bRead.data?.length === 0, bRead.error?.message ?? `${bRead.data?.length} rows`);

  const bUpdate = await userB.client.from("capture_entries").update({ title: "RLS breach" }).eq("id", capture.id).select("id");
  check("User B cannot update User A row", !bUpdate.error && bUpdate.data?.length === 0, bUpdate.error?.message ?? `${bUpdate.data?.length} rows`);

  const bDelete = await userB.client.from("capture_entries").delete().eq("id", capture.id).select("id");
  check("User B cannot delete User A row", !bDelete.error && bDelete.data?.length === 0, bDelete.error?.message ?? `${bDelete.data?.length} rows`);

  const bImpersonation = await userB.client.from("capture_entries").insert({
    user_id: userA.id,
    title: "RLS impersonation probe",
    content: "This insert must be rejected.",
    entry_type: "work_event",
  });
  check("User B cannot insert as User A", Boolean(bImpersonation.error), bImpersonation.error?.message ?? "unexpected success");

  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} finally {
  const cleanup = [];
  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    cleanup.push({ userId: userId.slice(0, 8), deleted: !error, error: error?.message });
  }
  if (cleanup.some((item) => !item.deleted)) {
    console.error(JSON.stringify({ cleanup }, null, 2));
    process.exitCode = 1;
  }
}
