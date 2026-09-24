import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_MODEL: z.string().min(1).default("deepseek-chat"),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
});

const responseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export async function askDeepSeekJson<T>({
  system,
  user,
  schema,
}: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const env = envSchema.parse({
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  });
  const response = await fetch(`${env.DEEPSEEK_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.25,
      messages: [
        { role: "system", content: `${system}\n只输出合法 JSON，不要使用 Markdown 代码块。` },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const payload = responseSchema.parse(await response.json());
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.choices[0].message.content);
  } catch {
    throw new Error("DeepSeek returned invalid JSON.");
  }
  return schema.parse(parsed);
}
