// でんき回路：ますに導線を置いて電池と豆電球をつなぎ、◎の豆電球だけを点ける。make(seed, L) が種から盤を作り、solve がいちばん少ない導線の数を数える。
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seedOf(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // 大きさ：横 W・縦 H・点ける豆電球 on・点けない豆電球 off・かべ wall・いちばん少ない導線の数 min（幅320pxでも1ますが40px以上になるよう横は6まで）
  const SIZES = [
    { name: "豆電球1こ", W: 5, H: 5, on: 1, off: 0, wall: 3, min: [3, 6] },
    { name: "2こ", W: 5, H: 6, on: 2, off: 0, wall: 4, min: [4, 8] },
    { name: "消したまま", W: 6, H: 6, on: 2, off: 1, wall: 5, min: [5, 9] },
  ];
  const HARD = { name: "上級", W: 6, H: 7, on: 2, off: 2, wall: 6, min: [6, 11] };
  // ますの中身：0 空き・1 かべ・2 電池や豆電球（dev に書く）。dev：{ t: "B" 電池 | "L" 豆電球, r, c, o: 0 よこ向き（左右に口）| 1 たて向き（上下に口）, want: 1 点ける | 0 点けない }
  // 電池の＋は左（よこ向き）か上（たて向き）。導線は上下左右のとなりの導線とつながり、電池・豆電球の口のますにある導線とつながる
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const sides = (d) => (d.o === 0 ? [[d.r, d.c - 1], [d.r, d.c + 1]] : [[d.r - 1, d.c], [d.r + 1, d.c]]);
  const inside = (p, r, c) => r >= 0 && r < p.H && c >= 0 && c < p.W;
  const EPS = 1e-9;
  // 回路を解く。put[r][c] が 1 のますに導線。返り値：short（＋と−が豆電球を通らずにつながった）・amp[i]（dev[i] の豆電球に流れる電流、電池1こ・豆電球1こで1）・closed（電池から電流が流れている）
  function evaluate(p, put) {
    const W = p.W, H = p.H, id = new Int32Array(W * H).fill(-1);
    let n = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (!put[r][c] || id[r * W + c] >= 0) continue;
      const st = [r * W + c]; id[r * W + c] = n;
      while (st.length) { const k = st.pop(), kr = Math.floor(k / W), kc = k % W; for (let d = 0; d < 4; d++) { const nr = kr + DY[d], nc = kc + DX[d]; if (inside(p, nr, nc) && put[nr][nc] && id[nr * W + nc] < 0) { id[nr * W + nc] = n; st.push(nr * W + nc); } } }
      n++;
    }
    const node = (r, c) => (inside(p, r, c) && put[r][c] ? id[r * W + c] : -1);
    const amp = p.dev.map(() => 0), bat = p.dev.find((d) => d.t === "B");
    const [sa, sb] = sides(bat), P = node(sa[0], sa[1]), N = node(sb[0], sb[1]);
    if (P < 0 || N < 0) return { short: false, amp, closed: false };
    if (P === N) return { short: true, amp, closed: true };
    const edges = [];
    p.dev.forEach((d, i) => { if (d.t !== "L") return; const [a, b] = sides(d), u = node(a[0], a[1]), v = node(b[0], b[1]); if (u >= 0 && v >= 0 && u !== v) edges.push([u, v, i]); });
    // ＋からたどれる節だけで解く
    const adj = [...Array(n)].map(() => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const seen = new Array(n).fill(false), q = [P]; seen[P] = true;
    while (q.length) { const u = q.pop(); for (const v of adj[u]) if (!seen[v]) { seen[v] = true; q.push(v); } }
    if (!seen[N]) return { short: false, amp, closed: false };
    const nodes = [], ix = new Array(n).fill(-1);
    for (let u = 0; u < n; u++) if (seen[u] && u !== P && u !== N) { ix[u] = nodes.length; nodes.push(u); }
    // 豆電球はどれも同じ抵抗1。節の電圧 V（＋は1・−は0）をキルヒホッフの法則で解く
    const m = nodes.length, A = [...Array(m)].map(() => new Array(m + 1).fill(0));
    for (const [u, v] of edges) {
      if (!seen[u]) continue;
      for (const [x, y] of [[u, v], [v, u]]) {
        if (ix[x] < 0) continue;
        A[ix[x]][ix[x]] += 1;
        if (ix[y] >= 0) A[ix[x]][ix[y]] -= 1; else if (y === P) A[ix[x]][m] += 1;
      }
    }
    for (let i = 0; i < m; i++) {
      let piv = i; for (let k = i + 1; k < m; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
      [A[i], A[piv]] = [A[piv], A[i]];
      if (Math.abs(A[i][i]) < EPS) continue;
      for (let k = 0; k < m; k++) { if (k === i) continue; const f = A[k][i] / A[i][i]; if (f) for (let j = i; j <= m; j++) A[k][j] -= f * A[i][j]; }
    }
    const V = new Array(n).fill(0); V[P] = 1;
    nodes.forEach((u, i) => { V[u] = Math.abs(A[i][i]) < EPS ? 0 : A[i][m] / A[i][i]; });
    for (const [u, v, i] of edges) if (seen[u]) amp[i] = Math.abs(V[u] - V[v]);
    return { short: false, amp, closed: true };
  }
  // 豆電球が点いているか（電流がほんの少しでも流れていれば点く）
  const lit = (a) => a > 1e-6;
  // できたか：ショートしていない・◎は全部点く・×は全部消えている
  function solved(p, put) {
    const e = evaluate(p, put);
    if (e.short) return false;
    return p.dev.every((d, i) => d.t !== "L" || (d.want ? lit(e.amp[i]) : !lit(e.amp[i])));
  }
  const count = (put) => put.flat().filter(Boolean).length;
  // いちばん少ない導線の数と、その置き方の1つ。fixed[r][c] は動かせない導線（ヒントで置いた導線、d には数えない）。max を超えたら null
  // 役に立つ導線は、どのかたまりも電池か豆電球の口に触れている。口のますから広げるかたまりだけを、重ならないように数える（Redelmeier の数え方）
  function solve(p, fixed, max = 14) {
    const W = p.W, H = p.H, put = [...Array(H)].map(() => Array(W).fill(0));
    let base = 0;
    if (fixed) for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (fixed[r] && fixed[r][c]) { put[r][c] = 1; base++; }
    // 電池の口と、点ける豆電球の口には、どの答えでも導線が要る（先に置いて数に入れる）
    let must = 0;
    for (const d of p.dev) if (d.t === "B" || d.want) for (const [r, c] of sides(d)) if (!put[r][c]) { put[r][c] = 1; must++; }
    const free = (r, c) => inside(p, r, c) && p.cell[r][c] === 0 && !put[r][c];
    const seeds = [];
    const seen0 = new Uint8Array(W * H);
    const addSeed = (r, c, list, seen) => { if (free(r, c) && !seen[r * W + c]) { seen[r * W + c] = 1; list.push(r * W + c); } };
    for (const d of p.dev) for (const [r, c] of sides(d)) addSeed(r, c, seeds, seen0);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (put[r][c]) for (let k = 0; k < 4; k++) addSeed(r + DY[k], c + DX[k], seeds, seen0);
    if (solved(p, put)) return { d: must, put: put.map((x) => x.slice()) };
    let found = null;
    function rec(untried, seen, used, budget) {
      while (untried.length) {
        const k = untried.pop(), r = Math.floor(k / W), c = k % W;
        put[r][c] = 1;
        if (solved(p, put)) { found = put.map((x) => x.slice()); put[r][c] = 0; return true; }
        if (used + 1 < budget) {
          const nu = untried.slice(), ns = seen.slice();
          for (let d = 0; d < 4; d++) addSeed(r + DY[d], c + DX[d], nu, ns);
          if (rec(nu, ns, used + 1, budget)) { put[r][c] = 0; return true; }
        }
        put[r][c] = 0;
      }
      return false;
    }
    for (let b = 1; b + must <= max; b++) if (rec(seeds.slice(), seen0.slice(), 0, b)) return { d: b + must, put: found };
    return null;
  }
  // 盤を作る：電池と豆電球とかべを置き、いちばん少ない数が min の幅に入るものを選ぶ
  function make(seed, L) {
    const R = rng(seed);
    for (let t = 0; t < 600; t++) {
      const cell = [...Array(L.H)].map(() => Array(L.W).fill(0)), dev = [];
      const block = new Set(); // 電池・豆電球と、その口のます（ほかの物を置かない）
      const place = (tt, want) => {
        for (let k = 0; k < 40; k++) {
          const o = R() < 0.5 ? 0 : 1, r = Math.floor(R() * L.H), c = Math.floor(R() * L.W);
          const d = { t: tt, r, c, o, want };
          const s = sides(d);
          if (!s.every(([a, b]) => inside({ W: L.W, H: L.H }, a, b))) continue;
          if (block.has(r * L.W + c) || s.some(([a, b]) => cell[a][b] !== 0)) continue;
          cell[r][c] = 2; dev.push(d); block.add(r * L.W + c); for (const [a, b] of s) block.add(a * L.W + b);
          return true;
        }
        return false;
      };
      if (!place("B", 0)) continue;
      let ok = true;
      for (let k = 0; k < L.on && ok; k++) ok = place("L", 1);
      for (let k = 0; k < L.off && ok; k++) ok = place("L", 0);
      if (!ok) continue;
      const open = []; for (let r = 0; r < L.H; r++) for (let c = 0; c < L.W; c++) if (!block.has(r * L.W + c)) open.push([r, c]);
      for (let k = 0; k < L.wall && open.length; k++) { const x = open.splice(Math.floor(R() * open.length), 1)[0]; cell[x[0]][x[1]] = 1; }
      const p = { W: L.W, H: L.H, cell, dev, name: L.name };
      const s = solve(p, null, L.min[1]);
      if (!s || s.d < L.min[0]) continue;
      p.d = s.d; p.sol = s.put;
      return p;
    }
    return null;
  }
  const B = { rng, seedOf, SIZES, HARD, DX, DY, sides, evaluate, lit, solved, solve, count, make };
  if (typeof module !== "undefined") module.exports = B; else root.DNK = B;
})(this);
