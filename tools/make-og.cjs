// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題は入れず、見本の回路（電池1こに豆電球2こを並列）だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const S = 80, X0 = 700, Y0 = 115, cx = (c) => X0 + S * c + S / 2, cy = (r) => Y0 + S * r + S / 2;
  const cells = [...Array(5)].map((_, r) => [...Array(5)].map((_, c) => `<rect x="${X0 + S * c}" y="${Y0 + S * r}" width="${S}" height="${S}" fill="#ffffff08" stroke="#ffffff1c" stroke-width="2"/>`).join("")).join("");
  const bulb = (r, c) => `<circle cx="${cx(c)}" cy="${cy(r)}" r="${S * 0.27}" fill="#ffe27a" stroke="#fff" stroke-width="3" style="filter:drop-shadow(0 0 16px #ffe27a)"/>`;
  const svg = `<svg width="1200" height="630" style="position:absolute;left:0;top:0">${cells}
    <rect x="${cx(4) - S * 0.36}" y="${cy(4) - S * 0.36}" width="${S * 0.72}" height="${S * 0.72}" rx="16" fill="#3a4160" stroke="#555f86" stroke-width="3"/>
    <g fill="none" stroke="#ffb35c" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px #ffb35c)">
      <polyline points="${cx(0)},${cy(1)} ${cx(0)},${cy(0)} ${cx(3)},${cy(0)} ${cx(3)},${cy(1)}"/><polyline points="${cx(1)},${cy(0)} ${cx(1)},${cy(1)}"/>
      <polyline points="${cx(0)},${cy(3)} ${cx(0)},${cy(4)} ${cx(3)},${cy(4)} ${cx(3)},${cy(3)}"/><polyline points="${cx(1)},${cy(4)} ${cx(1)},${cy(3)}"/></g>
    <rect x="${cx(0) - S * 0.3}" y="${cy(2) - S * 0.45}" width="${S * 0.6}" height="${S * 0.9}" rx="10" fill="#2d3550" stroke="#9aa6c8" stroke-width="3"/>
    <text x="${cx(0)}" y="${cy(2) - 8}" fill="#ffd45a" font-size="30" font-weight="800" text-anchor="middle">+</text>
    <text x="${cx(0)}" y="${cy(2) + 30}" fill="#c8d0e8" font-size="30" font-weight="800" text-anchor="middle">−</text>
    <g stroke="#9aa6c8" stroke-width="5" stroke-linecap="round"><line x1="${cx(1)}" y1="${cy(1)}" x2="${cx(1)}" y2="${cy(3)}"/><line x1="${cx(3)}" y1="${cy(1)}" x2="${cx(3)}" y2="${cy(3)}"/></g>
    ${bulb(2, 1)}${bulb(2, 3)}</svg>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:70px 80px;background:#151a2e;color:#eef1fa;position:relative;overflow:hidden">
    ${svg}
    <div style="position:relative;font-size:34px;color:#ffd45a;letter-spacing:.1em">だれでも同じ 1日3問・小4理科</div>
    <div style="position:relative;font-size:104px;font-weight:900;margin-top:16px;letter-spacing:.06em;text-shadow:0 0 30px #ffd45a66">でんき回路</div>
    <div style="position:relative;font-size:40px;margin-top:18px;line-height:1.5">いちばん少ない導線で、<br>豆電球を点けられる？</div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
