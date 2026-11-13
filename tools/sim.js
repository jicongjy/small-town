// 난이도 확인 도구. 의뢰마다 여러 판을 자동으로 두어 보고, 목표가 얼마나 자주 채워지는지 센다.
// 실행: node tools/sim.js
require('../js/engine.js');
require('../js/data.js');
const ST = globalThis.ST;

function bagFrom(coll, quest, limit) {
  const all = [];
  ST.PIECE_ORDER.forEach(id => { for (let i = 0; i < (coll[id] || 0); i++) all.push(id); });
  return all.slice(0, limit).concat(quest.lend);
}

// 한 수 앞을 보는 단순한 플레이어. 목표에 필요한 자원에 점수를 주고, 빈 칸이 줄어드는 걸 조금 싫어한다.
function play(quest, bag, relics, seed, rnd, eps) {
  const s = ST.newGame(quest, bag, relics, seed);
  const need = {};
  quest.goals.concat(quest.bonus).forEach(g => { if (g.r) need[g.r] = Math.max(need[g.r] || 0, g.n); });
  while (!s.over && ST.canMove(s)) {
    let best = null, bestV = -1e9;
    for (let h = 0; h < s.hand.length; h++) {
      for (let c = 0; c < 25; c++) {
        const g = ST.preview(s, h, c);
        if (!g) continue;
        let v = 0;
        for (const r in g) {
          const lack = Math.max(0, (need[r] || 0) - s.res[r]);
          v += Math.min(g[r], lack) * 3 + g[r] * 0.2;
        }
        const id = s.hand[h];
        // 뒤에 올 조각을 기다려야 하는 조각은 미룬다
        if ((id === 'bakery' || id === 'mill' || id === 'bell' || id === 'brewery' || id === 'inn') && s.bag.length + s.hand.length > 2) v -= 2.5;
        if (id === 'field' || id === 'well' || id === 'orchard') v += 1;
        v += rnd() * eps;
        if (v > bestV) { bestV = v; best = [h, c]; }
      }
    }
    if (!best) break;
    ST.place(s, best[0], best[1]);
  }
  return s;
}

function mul(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 같은 판(같은 뽑기 순서)을 여러 번 다시 두어 가장 잘한 결과를 고른다. 되돌리기를 쓰며 고민하는 사람에 가깝다.
function report(label, quest, bag, relics) {
  const rnd = mul(12345);
  const stars = [0, 0, 0, 0];
  const max = { grain: 0, bread: 0, people: 0, gold: 0 };
  const T = 120, K = 120;
  for (let i = 0; i < T; i++) {
    let best = 0;
    for (let k = 0; k < K; k++) {
      const s = play(quest, bag, relics, i + 1, rnd, k === 0 ? 0 : 8);
      best = Math.max(best, ST.evaluate(s, quest).stars);
      for (const r in max) max[r] = Math.max(max[r], s.res[r]);
    }
    stars[best]++;
  }
  console.log(label.padEnd(24), '짐', String(bag.length).padStart(2),
    '| 실패', (stars[0] / T * 100).toFixed(0).padStart(3) + '%',
    '별1', (stars[1] / T * 100).toFixed(0).padStart(3) + '%',
    '별2', (stars[2] / T * 100).toFixed(0).padStart(3) + '%',
    '별3', (stars[3] / T * 100).toFixed(0).padStart(3) + '%',
    '| 최대', JSON.stringify(max));
}

const B = (o) => { const a = []; for (const id in o) for (let i = 0; i < o[id]; i++) a.push(id); return a; };
const Q = ST.QUESTS;
const startBag = B(ST.START);
report('q1 처음 짐', Q[0], startBag, []);
report('q2 처음 짐', Q[1], startBag.concat(Q[1].lend), []);
report('q2 +방앗간 대신 밭', Q[1], B({ field: 3, house: 2, bakery: 1, well: 1, mill: 1 }).concat(Q[1].lend), []);
report('q3 처음 짐', Q[2], startBag.concat(Q[2].lend), []);
report('q4 처음 짐', Q[3], startBag.concat(Q[3].lend), []);
report('q4 새벽 종', Q[3], startBag.concat(Q[3].lend), ['dawnbell']);
report('q5 처음 짐에서 6개', Q[4], B({ field: 2, bakery: 1, house: 2, orchard: 1 }), []);
report('q5 우물 넣기', Q[4], B({ field: 2, bakery: 1, house: 1, orchard: 1, well: 1 }), []);
report('q5 낚시터+광장', Q[4], B({ field: 2, bakery: 1, house: 2, fishing: 1 }), []);
report('q5 낚시터+나침반', Q[4], B({ field: 2, bakery: 1, house: 2, fishing: 1 }), ['compass']);
report('q5 과수원2+종', Q[4], B({ field: 2, bakery: 1, house: 2, orchard: 1 }), ['dawnbell']);
