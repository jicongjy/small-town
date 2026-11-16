// 게임 규칙. 화면과 무관하게 돌아가서, 난이도 맞추는 도구(tools/sim.js)에서도 그대로 쓴다.
(function (root) {
  var ST = (root.ST = root.ST || {});
  var N = 5;
  var DWELL = { house: 1, inn: 1, tower: 1 };

  function nb(i) {
    var r = Math.floor(i / N), c = i % N, o = [];
    if (r > 0) o.push(i - N);
    if (r < N - 1) o.push(i + N);
    if (c > 0) o.push(i - 1);
    if (c < N - 1) o.push(i + 1);
    return o;
  }
  function isB(x) { return !!x && x.k === 'b'; }
  function has(s, r) { return s.relics.indexOf(r) >= 0; }
  function corner(i) { return i === 0 || i === 4 || i === 20 || i === 24; }
  function zero() { return { grain: 0, bread: 0, people: 0, gold: 0 }; }

  function rng(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    var r = rng(seed), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function mult(s, cell) { return has(s, 'compass') && corner(cell) ? 2 : 1; }

  // 건물 하나가 지금 이 자리에서 발동하면 무엇을 내는가
  function own(s, cell, id) {
    var b = s.board, ns = nb(cell), g = zero();
    function adj(t) {
      var n = 0;
      for (var k = 0; k < ns.length; k++) if (isB(b[ns[k]]) && b[ns[k]].id === t) n++;
      return n;
    }
    var adjDwell = 0, k;
    for (k = 0; k < ns.length; k++) if (isB(b[ns[k]]) && DWELL[b[ns[k]].id]) adjDwell++;
    var plaza = adj('plaza') > 0 ? 1 : 0;

    if (id === 'field') {
      g.grain = adj('well') > 0 ? 2 : (s.rule === 'winter' ? 0 : 1);
    } else if (id === 'orchard') {
      for (k = 0; k < ns.length; k++) if (!b[ns[k]]) g.gold++;
    } else if (id === 'fishing') {
      var wet = false;
      for (k = 0; k < ns.length; k++) {
        var x = b[ns[k]];
        if (x && ((x.k === 't' && x.t === 'water') || (isB(x) && x.id === 'well'))) wet = true;
      }
      g.gold = wet ? 3 : 0;
    } else if (id === 'bakery') {
      g.bread = 2 * adj('field');
    } else if (id === 'mill') {
      var r = Math.floor(cell / N);
      for (k = 0; k < N; k++) {
        var y = b[r * N + k];
        if (r * N + k !== cell && isB(y) && y.id === 'field') g.grain++;
      }
    } else if (id === 'brewery') {
      g.gold = adjDwell > 0 ? 3 * adj('orchard') : 0;
    } else if (id === 'house') {
      g.people = 1 + adj('house') + plaza;
    } else if (id === 'inn') {
      var seen = {}, cnt = 0;
      for (k = 0; k < ns.length; k++) {
        var z = b[ns[k]];
        if (isB(z) && !seen[z.id]) { seen[z.id] = 1; cnt++; }
      }
      g.people = cnt + plaza;
    } else if (id === 'tower') {
      g.people = (adjDwell > 0 ? 1 : 3) + plaza;
    }
    var m = mult(s, cell);
    if (m > 1) { g.grain *= m; g.bread *= m; g.people *= m; g.gold *= m; }
    return g;
  }

  function legal(s, id, cell) {
    if (s.board[cell]) return false;
    if (s.rule === 'quiet') {
      var ns = nb(cell), k;
      for (k = 0; k < ns.length; k++) {
        var x = s.board[ns[k]];
        if (!isB(x)) continue;
        if (id === 'house' && x.id === 'fishing') return false;
        if (id === 'fishing' && x.id === 'house') return false;
      }
    }
    return true;
  }

  function draw(s) {
    while (s.hand.length < s.handSize && s.bag.length) s.hand.push(s.bag.shift());
  }

  ST.newGame = function (quest, bag, relics, seed) {
    var s = {
      q: quest.id, rule: quest.rule || null, seed: seed,
      board: [], hand: [], bag: shuffle(bag, seed),
      res: zero(), pL: 0, pR: 0, n: 0,
      relics: relics.slice(), pencilUsed: false, over: false,
      handSize: relics.indexOf('magnifier') >= 0 ? 4 : 3
    };
    for (var i = 0; i < 25; i++) s.board.push(null);
    var t = quest.terrain || {};
    for (var key in t) s.board[+key] = { k: 't', t: t[key] };
    draw(s);
    return s;
  };

  // 조각을 놓는다. 무엇이 얼마나 났는지를 칸별 목록으로 돌려준다. 놓을 수 없으면 null.
  ST.place = function (s, hi, cell) {
    var id = s.hand[hi];
    if (!id || s.over || !legal(s, id, cell)) return null;
    var b = s.board, ns = nb(cell), parts = [], k, j;
    b[cell] = { k: 'b', id: id };

    if (id === 'bell') {
      for (k = 0; k < ns.length; k++) {
        j = ns[k];
        if (isB(b[j]) && b[j].id !== 'bell') parts.push({ cell: j, g: own(s, j, b[j].id) });
      }
    } else {
      var g = own(s, cell, id);
      if (s.n === 0 && has(s, 'dawnbell')) { g.grain *= 2; g.bread *= 2; g.people *= 2; g.gold *= 2; }
      parts.push({ cell: cell, g: g });
    }

    // 우물과 광장은 놓인 뒤에도 옆 칸에 힘을 준다
    if (id === 'field') {
      for (k = 0; k < ns.length; k++) if (isB(b[ns[k]]) && b[ns[k]].id === 'well') b[cell].w = true;
    }
    if (DWELL[id]) {
      for (k = 0; k < ns.length; k++) if (isB(b[ns[k]]) && b[ns[k]].id === 'plaza') b[cell].pz = true;
    }
    if (id === 'well') {
      for (k = 0; k < ns.length; k++) {
        j = ns[k];
        if (isB(b[j]) && b[j].id === 'field' && !b[j].w) {
          b[j].w = true;
          var dg = zero();
          dg.grain = (2 - (s.rule === 'winter' ? 0 : 1)) * mult(s, j);
          parts.push({ cell: j, g: dg });
        }
      }
    }
    if (id === 'plaza') {
      for (k = 0; k < ns.length; k++) {
        j = ns[k];
        if (isB(b[j]) && DWELL[b[j].id] && !b[j].pz) {
          b[j].pz = true;
          var dp = zero();
          dp.people = mult(s, j);
          parts.push({ cell: j, g: dp });
        }
      }
    }

    for (k = 0; k < parts.length; k++) {
      var p = parts[k];
      s.res.grain += p.g.grain; s.res.bread += p.g.bread;
      s.res.people += p.g.people; s.res.gold += p.g.gold;
      var col = p.cell % N;
      if (col < 2) s.pL += p.g.people;
      else if (col > 2) s.pR += p.g.people;
    }
    s.n++;
    s.hand.splice(hi, 1);
    draw(s);
    if (!s.hand.length) s.over = true;
    return parts;
  };

  ST.sum = function (parts) {
    var t = zero();
    for (var k = 0; k < parts.length; k++) {
      t.grain += parts[k].g.grain; t.bread += parts[k].g.bread;
      t.people += parts[k].g.people; t.gold += parts[k].g.gold;
    }
    return t;
  };

  // 놓기 전에 결과를 미리 본다
  ST.preview = function (s, hi, cell) {
    if (!legal(s, s.hand[hi], cell)) return null;
    var c = JSON.parse(JSON.stringify(s));
    var parts = ST.place(c, hi, cell);
    return parts ? ST.sum(parts) : null;
  };

  ST.legal = legal;

  ST.canMove = function (s) {
    for (var h = 0; h < s.hand.length; h++)
      for (var c = 0; c < 25; c++) if (legal(s, s.hand[h], c)) return true;
    return false;
  };

  // 몽당연필: 손에 든 조각을 짐에 넣고 다시 뽑는다
  ST.redraw = function (s) {
    if (!has(s, 'pencil') || s.pencilUsed || s.over || !s.bag.length) return false;
    s.bag = shuffle(s.bag.concat(s.hand), s.seed + 101 + s.n);
    s.hand = [];
    s.pencilUsed = true;
    draw(s);
    return true;
  };

  function meets(s, goal) {
    if (goal.r) return s.res[goal.r] >= goal.n;
    if (goal.t === 'balance') return Math.abs(s.pL - s.pR) <= 1;
    if (goal.t === 'adj') {
      for (var i = 0; i < 25; i++) {
        if (!isB(s.board[i]) || s.board[i].id !== goal.a) continue;
        var ns = nb(i);
        for (var k = 0; k < ns.length; k++)
          if (isB(s.board[ns[k]]) && s.board[ns[k]].id === goal.b) return true;
      }
      return false;
    }
    return false;
  }
  ST.meets = meets;

  ST.evaluate = function (s, quest) {
    var base = true, k, stars = 0;
    for (k = 0; k < quest.goals.length; k++) if (!meets(s, quest.goals[k])) base = false;
    if (base) {
      stars = 1;
      for (k = 0; k < quest.bonus.length; k++) if (meets(s, quest.bonus[k])) stars++;
    }
    return { base: base, stars: stars };
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ───────────────────────────────────────────────────────────────────────────
// 새 규칙(날짜 규칙). 의뢰에 days가 있으면 이 규칙으로 돈다. 없으면 위의 옛 규칙.
//  - 하루에 조각 하나를 놓는다. 손에 든 나머지는 버림 더미로 가고, 덱이 비면 버림 더미를 섞어 다시 쓴다.
//    (조각은 설계도라서 놓아도 없어지지 않고 계속 돈다.)
//  - 건물은 놓는 순간 한 번이 아니라, 매일 밤 지금 옆 칸을 보고 일한다. 그래서 놓는 순서는 상관없다.
//  - 한 주의 마지막 날은 장날이다. 의뢰인이 빵을 가져간다. 모자라면 곡식과 금화가 빵으로 바뀐다.
//  - 장날을 넘기면 조각 셋 중 하나를 덱에 넣는다. 금화를 내고 다시 뽑을 수 있다.
//  - 주 중간에 이벤트가 하나 생긴다.
(function (root) {
  var ST = root.ST, N = 5, D = {};
  var DWELL = { house: 1, inn: 1, tower: 1 };
  D.GRAIN_PER_BREAD = 2;   // 곡식 2개 = 빵 1개
  D.GOLD_PER_BREAD = 3;    // 금화 3개 = 빵 1개
  D.REROLL_COST = 2;       // 보상 다시 뽑기 값(금화)
  D.REROLL_MAX = 3;

  function nb(i) {
    var r = Math.floor(i / N), c = i % N, o = [];
    if (r > 0) o.push(i - N);
    if (r < N - 1) o.push(i + N);
    if (c > 0) o.push(i - 1);
    if (c < N - 1) o.push(i + 1);
    return o;
  }
  function isB(x) { return !!x && x.k === 'b'; }
  function next(s) { s.rs = (Math.imul(s.rs, 1103515245) + 12345) & 0x7fffffff; return s.rs; }
  function rnd(s, n) { return next(s) % n; }
  function shuffle(s, a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(s, i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // 건물 하나가 하룻밤에 내는 것. 종탑과 나침반은 여기서 치지 않는다.
  function own(s, cell) {
    var b = s.board, id = b[cell].id, ns = nb(cell), g = { grain: 0, bread: 0, gold: 0, people: 0 }, k;
    function adj(t) { var n = 0; for (var k = 0; k < ns.length; k++) if (isB(b[ns[k]]) && b[ns[k]].id === t) n++; return n; }
    var dw = 0, empty = 0;
    for (k = 0; k < ns.length; k++) { if (isB(b[ns[k]]) && DWELL[b[ns[k]].id]) dw++; if (!b[ns[k]]) empty++; }
    var plaza = adj('plaza') > 0 ? 1 : 0;
    if (id === 'field') g.grain = adj('well') > 0 ? 2 : (s.rule === 'winter' ? 0 : 1);
    else if (id === 'orchard') g.gold = empty >= 2 ? 2 : 1;
    else if (id === 'fishing') {
      var wet = false;
      for (k = 0; k < ns.length; k++) { var x = b[ns[k]]; if (x && ((x.k === 't' && x.t === 'water') || (isB(x) && x.id === 'well'))) wet = true; }
      g.gold = wet ? 2 : 0;
    } else if (id === 'bakery') g.bread = adj('field');
    else if (id === 'mill') { var r = Math.floor(cell / N); for (k = 0; k < N; k++) { var y = b[r * N + k]; if (r * N + k !== cell && isB(y) && y.id === 'field') g.grain++; } }
    else if (id === 'brewery') g.gold = dw > 0 ? 2 * adj('orchard') : 0;
    else if (id === 'house') g.people = 1 + adj('house') + plaza;
    else if (id === 'inn') { var seen = {}, cnt = 0; for (k = 0; k < ns.length; k++) { var z = b[ns[k]]; if (isB(z) && !seen[z.id]) { seen[z.id] = 1; cnt++; } } g.people = cnt + plaza; }
    else if (id === 'tower') g.people = (dw > 0 ? 1 : 3) + plaza;
    return g;
  }

  // 지금 마을이 하룻밤에 내는 것 전부. cells는 칸별 내역, tax는 주민이 내는 금화.
  D.produce = function (s) {
    var t = { grain: 0, bread: 0, gold: 0, people: 0, cells: {}, tax: 0 }, i, k;
    var corner = { 0: 1, 4: 1, 20: 1, 24: 1 }, compass = s.relics.indexOf('compass') >= 0;
    for (i = 0; i < 25; i++) {
      if (!isB(s.board[i]) || s.board[i].id === 'bell') continue;
      var g = own(s, i), times = 1, ns = nb(i);
      for (k = 0; k < ns.length; k++) if (isB(s.board[ns[k]]) && s.board[ns[k]].id === 'bell') { times = 2; break; }
      if (compass && corner[i]) times *= 2;
      g.grain *= times; g.bread *= times; g.gold *= times;
      t.cells[i] = g;
      t.grain += g.grain; t.bread += g.bread; t.gold += g.gold; t.people += g.people;
    }
    t.tax = t.people;   // 주민 한 명이 하룻밤에 금화 1개를 낸다
    t.gold += t.tax;
    return t;
  };
  // 빵으로 치면 몇 개인가
  D.worth = function (r) { return r.bread + Math.floor(r.grain / D.GRAIN_PER_BREAD) + Math.floor(r.gold / D.GOLD_PER_BREAD); };
  D.rate = function (p) { return p.bread + p.grain / D.GRAIN_PER_BREAD + p.gold / D.GOLD_PER_BREAD; };

  function draw(s) {
    s.hand = [];
    while (s.hand.length < s.handSize) {
      if (!s.deck.length) { if (!s.discard.length) break; s.deck = shuffle(s, s.discard); s.discard = []; }
      s.hand.push(s.deck.shift());
    }
  }

  D.newGame = function (quest, cards, relics, seed) {
    var cfg = quest.days, s = {
      q: quest.id, rule: quest.rule || null, rs: (seed | 0) || 1, day: 1, week: 0,
      perWeek: cfg.perWeek, quota: cfg.quota.slice(), board: [], deck: [], discard: [], hand: [],
      res: { grain: 0, bread: 0, gold: 0 }, people: 0, relics: relics.slice(),
      handSize: relics.indexOf('magnifier') >= 0 ? 4 : 3,
      phase: 'play', offer: [], rerolls: 0, event: null, won: false, failed: false,
      eventsLeft: [], last: null, market: null, placed: 0, pencil: false
    };
    for (var i = 0; i < 25; i++) s.board.push(null);
    var t = quest.terrain || {};
    for (var key in t) s.board[+key] = { k: 't', t: t[key] };
    s.deck = shuffle(s, cards.slice());
    s.eventsLeft = shuffle(s, (cfg.events || []).slice());
    draw(s);
    return s;
  };

  D.legal = function (s, id, cell) {
    var c = s.board[cell];
    if (c && c.k === 't') return false;
    if (s.rule === 'quiet') {
      var ns = nb(cell);
      for (var k = 0; k < ns.length; k++) {
        var x = s.board[ns[k]];
        if (!isB(x)) continue;
        if (id === 'house' && x.id === 'fishing') return false;
        if (id === 'fishing' && x.id === 'house') return false;
      }
    }
    return true;
  };

  // 여기 놓으면 하룻밤 생산이 얼마나 달라지나(빵으로 친 값과 자원별 차이)
  D.preview = function (s, hi, cell) {
    var id = s.hand[hi];
    if (!id || !D.legal(s, id, cell)) return null;
    var before = D.produce(s), old = s.board[cell];
    s.board[cell] = { k: 'b', id: id };
    var after = D.produce(s);
    s.board[cell] = old;
    return { grain: after.grain - before.grain, bread: after.bread - before.bread, gold: after.gold - before.gold,
      people: after.people - before.people, rate: D.rate(after) - D.rate(before), replace: old ? old.id : null };
  };

  // 하루를 끝낸다. 밤사이 생산하고, 장날이면 납품한다.
  function endDay(s) {
    s.discard = s.discard.concat(s.hand); s.hand = [];
    var p = D.produce(s), dawn = s.relics.indexOf('dawnbell') >= 0 && (s.day - 1) % s.perWeek === 0, m = dawn ? 2 : 1;
    s.res.grain += p.grain * m; s.res.bread += p.bread * m; s.res.gold += p.gold * m; s.people = p.people;
    s.last = { p: p, mult: m };
    s.market = null;
    if (s.day % s.perWeek === 0) {
      var need = s.quota[s.week], pay = { bread: 0, grain: 0, gold: 0 }, left = need;
      pay.bread = Math.min(left, s.res.bread); left -= pay.bread;
      var gb = Math.min(left, Math.floor(s.res.grain / D.GRAIN_PER_BREAD)); pay.grain = gb * D.GRAIN_PER_BREAD; left -= gb;
      var cb = Math.min(left, Math.floor(s.res.gold / D.GOLD_PER_BREAD)); pay.gold = cb * D.GOLD_PER_BREAD; left -= cb;
      s.market = { week: s.week, need: need, pay: pay, short: left };
      if (left > 0) { s.failed = true; s.phase = 'over'; return; }
      s.res.bread -= pay.bread; s.res.grain -= pay.grain; s.res.gold -= pay.gold;
      s.week++;
      if (s.week >= s.quota.length) { s.won = true; s.phase = 'over'; return; }
      s.phase = 'market';
    }
    s.day++;
    if (s.phase === 'play') startDay(s);
  }
  function startDay(s) {
    s.pencil = false;
    var dw = (s.day - 1) % s.perWeek;
    if (dw === Math.floor(s.perWeek / 2) && s.eventsLeft.length) { s.event = s.eventsLeft.shift(); s.phase = 'event'; }
    draw(s);
  }

  D.place = function (s, hi, cell) {
    if (s.phase !== 'play') return false;
    var id = s.hand[hi];
    if (!id || !D.legal(s, id, cell)) return false;
    s.board[cell] = { k: 'b', id: id };
    s.placed++;
    endDay(s);
    return true;
  };
  D.rest = function (s) { if (s.phase !== 'play') return false; endDay(s); return true; };

  // 장날을 넘긴 뒤: 조각 셋 중 하나
  function makeOffer(s, pool) { s.offer = shuffle(s, pool.slice()).slice(0, 3); }
  D.toReward = function (s, pool) { if (s.phase !== 'market') return; s.phase = 'reward'; s.rerolls = 0; s.pool = pool.slice(); makeOffer(s, s.pool); };
  D.reroll = function (s) {
    if (s.phase !== 'reward' || s.rerolls >= D.REROLL_MAX || s.res.gold < D.REROLL_COST) return false;
    s.res.gold -= D.REROLL_COST; s.rerolls++; makeOffer(s, s.pool); return true;
  };
  D.take = function (s, i) {
    if (s.phase !== 'reward') return false;
    if (i >= 0 && s.offer[i]) s.discard.push(s.offer[i]);
    s.offer = []; s.phase = 'play'; startDay(s); return true;
  };

  // 이벤트. 선택지의 give는 받는 것, cost는 내는 것, card는 덱에 들어오는 조각.
  D.canChoose = function (s, ch) {
    for (var k in (ch.cost || {})) if ((s.res[k] || 0) < ch.cost[k]) return false;
    return true;
  };
  D.choose = function (s, ch) {
    if (s.phase !== 'event') return false;
    var k;
    if (!ch || !D.canChoose(s, ch)) return false;
    for (k in (ch.cost || {})) s.res[k] -= ch.cost[k];
    for (k in (ch.give || {})) s.res[k] += ch.give[k];
    for (k in (ch.lose || {})) s.res[k] = Math.max(0, s.res[k] - ch.lose[k]);
    if (ch.card) s.hand.push(ch.card);
    s.event = null; s.phase = 'play'; return true;
  };

  D.daysLeft = function (s) { return s.perWeek - ((s.day - 1) % s.perWeek); };
  D.evaluate = function (s, quest) {
    var stars = 0;
    if (s.won) {
      stars = 1;
      (quest.days.bonus || []).forEach(function (g) { if (D.meets(s, g)) stars++; });
    }
    return { base: s.won, stars: stars };
  };
  D.meets = function (s, g) {
    if (g.t === 'left') return D.worth(s.res) >= g.n;
    if (g.t === 'people') return s.people >= g.n;
    return false;
  };
  ST.days = D;
})(typeof window !== 'undefined' ? window : globalThis);
