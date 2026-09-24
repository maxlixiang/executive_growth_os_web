"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({ email: z.string().email("请输入有效邮箱。"), password: z.string().min(8, "密码至少需要 8 个字符。") });
export type LoginState = { error: string | null };

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "登录信息不完整。" };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: "邮箱或密码不正确。" };
  } catch (error) {
    console.error("Supabase login configuration error", error);
    return { error: "登录服务尚未配置，请先完成 Supabase 环境变量。" };
  }
  redirect("/");
}
