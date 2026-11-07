// ひな形（shared-workflows template/qa/sw-check.mjs）。ゲームでは直さず写す。
// sw.js を Node の中で動かし、返事の仕方を確かめる（ブラウザ無し）。qa/run.mjs から checkSwStall(sw の中身) を呼ぶ。
// 本文の途中で通信が止まっても、保存したものへ切り替わるか（2026-11-07 CodeRabbit の指摘）。
// 時間は100分の1で進める（4秒＝40ms）。切り替えが4秒より大きく遅いと落ちる・少し遅い通信（1秒）はネットの返事のまま（2026-11-07 amida-haitatsu #14 の CodeRabbit）。
import vm from "node:vm";

export async function checkSwStall(code) {
  const listeners = {};
  const cached = new Response("cached-page", { status: 200 });
  let mode = "stall";
  const ctx = {
    self: { addEventListener: (t, f) => (listeners[t] = f), location: { origin: "https://x.test" }, skipWaiting() {}, clients: { claim() {} } },
    caches: { match: async () => cached.clone(), open: async () => ({ put: async () => {} }), keys: async () => [] },
    fetch: async () => {
      if (mode === "ok") { await new Promise((r) => setTimeout(r, 1000 / 100)); return new Response("net-page", { status: 200 }); }
      // 見出しは届くが本文が終わらない返事
      return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode("half")); } }), { status: 200 });
    },
    setTimeout: (f, ms) => setTimeout(f, ms / 100), clearTimeout, URL, Request, Response, Promise, console,
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const ask = () => new Promise((resolve) => {
    listeners.fetch({ request: { method: "GET", url: "https://x.test/index.html", mode: "navigate" }, waitUntil() {}, respondWith: (p) => p.then(resolve) });
  });
  // 4秒で切り替わるなら40ms。10秒（100ms）を過ぎたら遅すぎる
  const stalled = await Promise.race([ask().then((r) => r.text()), new Promise((r) => setTimeout(() => r("timeout"), 100))]);
  mode = "ok";
  const normal = await Promise.race([ask().then((r) => r.text()), new Promise((r) => setTimeout(() => r("timeout"), 300))]);
  return { stalled, normal, ok: stalled === "cached-page" && normal === "net-page" };
}
