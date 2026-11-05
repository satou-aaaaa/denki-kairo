// アプリのアイコン（icon-192.png・icon-512.png・icon-512-maskable.png）を作る。maskable は絵を中心から0.75倍にして、丸く切られても欠けないようにする（安全な範囲は中心の直径80%）。紺の地に、電池と導線でつないだ光る豆電球。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const [s, name, k] of [[192, "icon-192.png", 1], [512, "icon-512.png", 1], [512, "icon-512-maskable.png", 0.75]]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#151a2e"/><g transform="translate(50 50) scale(${k}) translate(-50 -50)">
      <polyline points="24,36 24,16 76,16 76,36" fill="none" stroke="#ffb35c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="24,64 24,84 76,84 76,64" fill="none" stroke="#ffb35c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      <rect x="12" y="36" width="24" height="28" rx="5" fill="#2d3550" stroke="#9aa6c8" stroke-width="2.5"/>
      <text x="24" y="49" fill="#ffd45a" font-size="12" font-weight="800" text-anchor="middle" font-family="sans-serif">+</text>
      <circle cx="76" cy="50" r="15" fill="#ffe27a" stroke="#fff" stroke-width="2.5" style="filter:drop-shadow(0 0 6px #ffe27a)"/></g></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", name), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
