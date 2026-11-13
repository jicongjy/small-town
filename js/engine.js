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
