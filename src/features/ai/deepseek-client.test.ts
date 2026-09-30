import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
vi.mock("server-only", () => ({}));
import { askDeepSeekJson } from "./deepseek-client";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const payload = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) }, finish_reason: "stop" }] }), { status: 200 });
describe("DeepSeek output contract", () => {
 it("repairs a wrong response once without silently accepting a score", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "synthetic-test-key");
  const fetch = vi.fn().mockResolvedValueOnce(payload({ wrong: "answer" })).mockResolvedValueOnce(payload({ score: 2 })); vi.stubGlobal("fetch", fetch);
  await expect(askDeepSeekJson({ system: "评估", user: "合成回答", schema: z.object({ score: z.number().int() }) })).resolves.toEqual({ score: 2 });
  const request = JSON.parse(fetch.mock.calls[1][1].body);
  expect(request.messages[0].content).toContain("结构修复重试"); expect(request.messages[0].content).toContain('"required":["score"]'); expect(fetch).toHaveBeenCalledTimes(2);
 });
 it("fails after the bounded repair instead of fabricating a valid response", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "synthetic-test-key"); vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(payload({ wrong: 1 }))));
  await expect(askDeepSeekJson({ system: "评估", user: "合成回答", schema: z.object({ score: z.number().int() }) })).rejects.toThrow("after repair");
 });
});
