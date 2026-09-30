"use client";
export default function MemoryError({ reset }: { reset: () => void }) {
  return <section className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">学习记忆暂时无法读取</h1><p className="mt-4 leading-7">当前无法确认老师的记忆是否完整。请稍后重试；已有学习记录仍保留。如果刚更新应用，请确认数据库迁移已完成。</p><button onClick={reset} className="mt-5 min-h-12 rounded-xl bg-accent px-5 font-bold text-white">重新读取</button></section>;
}
