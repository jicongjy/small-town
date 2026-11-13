// 화면. 누를 때마다 화면 전체를 다시 그리는 단순한 방식이다.
(function () {
  var ST = window.ST;
  var app = document.getElementById('app');
  // 주소 끝에 ?slot=이름 을 붙이면 다른 저장 칸을 쓴다(시험용).
  var slot = (location.search.match(/[?&]slot=([a-z0-9]+)/) || [])[1];
  var KEY = 'small-town-save-v1' + (slot ? '-' + slot : '');

  var save = load();
  var V = { name: save ? 'map' : 'start' };
  var Q = null;        // 지금 하는 의뢰
  var G = null;        // 지금 판의 상태
  var hist = [];       // 되돌리기용 기록
  var sel = null;      // 고른 손패 번호
  var fx = null;       // 방금 놓은 결과(움직임 표시용)
  var draft = null;    // 짐 싸는 중인 내용
  var result = null;   // 평가 결과

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.coll) return s;
    } catch (e) {}
    return null;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {}
  }
  function fresh(name) {
    var coll = {};
    for (var k in ST.START) coll[k] = ST.START[k];
    return { name: name, coll: coll, relics: [], stars: {}, picks: {}, eq: [], bags: {}, ended: false };
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function img(name, ground, size, cls) {
    return '<img class="px ' + (cls || '') + '" alt="" src="' + ST.url(name, ground, size) + '">';
  }
  function starsHtml(n, big) {
    var h = '<span class="stars' + (big ? ' big' : '') + '">';
    for (var i = 0; i < 3; i++) h += img(i < n ? 'star' : 'star_off');
    return h + '</span>';
  }
  function quest(id) {
    for (var i = 0; i < ST.QUESTS.length; i++) if (ST.QUESTS[i].id === id) return ST.QUESTS[i];
    return null;
  }
  function unlocked(i) { return i === 0 || (save.stars[ST.QUESTS[i - 1].id] || 0) > 0; }
  function portrait(q) {
    var h = '<span class="portrait' + (q.portraits.length > 1 ? ' two' : '') + '">';
    q.portraits.forEach(function (p) { h += img(p); });
    return h + '</span>';
  }
  function gainText(g) {
    var out = [];
    ST.RES_ORDER.forEach(function (r) { if (g[r]) out.push(ST.RES[r].name + '+' + g[r]); });
    return out;
  }
  function goalLine(g, s, star) {
    var done = s ? ST.meets(s, g) : false;
    var extra = '';
    if (s && g.t === 'balance') extra = ' (왼쪽 ' + s.pL + ' : 오른쪽 ' + s.pR + ')';
    return '<div class="goal' + (done ? ' done' : '') + '"><span class="box"></span>' +
      (star ? img('star', null, null, 'gs') : '') + '<span>' + esc(ST.goalText(g)) + extra + '</span></div>';
  }
  function goalsHtml(q, s) {
    var h = '';
    q.goals.forEach(function (g) { h += goalLine(g, s, false); });
    q.bonus.forEach(function (g) { h += goalLine(g, s, true); });
    return h;
  }

  // ───── 화면들 ─────

  function vStart() {
    var h = '<div class="gap"></div><h1 class="light center">' + ST.TEXT.title + '</h1><div class="gap"></div>';
    h += '<div class="panel"><div class="row" style="align-items:flex-start;gap:12px">' +
      '<span class="portrait">' + img('grandma') + '</span><div>';
    ST.TEXT.note.forEach(function (l) { h += '<p>' + esc(l) + '</p>'; });
    h += '<p class="muted">봉 할머니가</p></div></div></div>';
    h += '<div class="panel"><p>노트 표지에 이름을 적는다.</p>' +
      '<input type="text" id="nm" maxlength="8" placeholder="손주" autocomplete="off">' +
      '<div class="gap"></div><button class="primary wide" data-a="begin">노트를 편다</button></div>';
    return h;
  }

  function vMap() {
    var h = '<div class="row between"><div><h1 class="light">' + ST.TEXT.title + '</h1>' +
      '<div class="light" style="font-size:12px;opacity:.8">' + esc(save.name) + '의 설계 노트 · 첫 번째 골짜기</div></div>' +
      '<button class="small" data-a="dex">도감</button></div><div class="gap"></div>';
    ST.QUESTS.forEach(function (q, i) {
      var open = unlocked(i);
      h += '<button class="quest' + (open ? '' : ' locked') + '" ' + (open ? 'data-a="intro" data-q="' + q.id + '"' : 'disabled') + '>' +
        portrait(q) + '<span style="flex:1"><span class="who">' + (i + 1) + '번째 의뢰 · ' + esc(q.who) + '</span><br>' +
        (open ? esc(q.title) : '앞의 의뢰를 먼저 끝내야 한다') + '</span>' + starsHtml(save.stars[q.id] || 0) + '</button>';
    });
    if (save.ended) {
      h += '<div class="panel">';
      ST.TEXT.ending.forEach(function (l) { h += '<p>' + esc(l) + '</p>'; });
      h += '</div>';
    }
    h += '<div class="row" style="justify-content:center;margin-top:8px">' + img('hero', null, null, 'mapc') + img('donkey', null, null, 'mapc') + '</div>';
    h += '<div class="center"><button class="ghost small" data-a="reset">처음부터 다시 하기</button></div>';
    return h;
  }

  function lendHtml(q) {
    if (!q.lend.length) return '';
    var cnt = {};
    q.lend.forEach(function (id) { cnt[id] = (cnt[id] || 0) + 1; });
    var parts = [];
    for (var id in cnt) parts.push(ST.PIECES[id].name + ' ' + cnt[id] + '개');
    return '<p class="muted">의뢰인이 내놓은 조각: ' + parts.join(', ') + ' (짐 개수에 안 들어간다)</p>';
  }

  function vIntro() {
    var q = Q;
    var h = '<div class="panel"><div class="row" style="gap:12px">' + portrait(q) +
      '<div><div class="muted">' + esc(q.who) + '</div><h2>' + esc(q.title) + '</h2></div></div><div class="gap"></div>';
    q.intro.forEach(function (l) { h += '<p class="say">' + esc(l) + '</p>'; });
    h += '</div><div class="panel"><h2>의뢰 조건</h2><div class="gap" style="height:6px"></div>' + goalsHtml(q, null) +
      '<p class="muted" style="margin-top:6px">별이 붙은 조건은 추가 목표다. 별 하나마다 보상을 하나 더 고른다.</p>' +
      (q.ruleText ? '<div class="rule">특별 규칙: ' + esc(q.ruleText) + '</div>' : '') + '</div>';
    if (q.lend.length) h += '<div class="panel">' + lendHtml(q) + '</div>';
    h += '<div class="row"><button data-a="map">돌아가기</button><button class="primary" style="flex:1" data-a="pack">짐 싸기</button></div>';
    return h;
  }

  function owned() {
    var n = 0;
    for (var k in save.coll) n += save.coll[k];
    return n;
  }
  function draftCount() {
    var n = 0;
    for (var k in draft.bag) n += draft.bag[k];
    return n;
  }
  function limit() {
    var l = Q.limit + (draft.relics.indexOf('carrot') >= 0 ? 1 : 0);
    return Math.min(l, owned());
  }
  function makeDraft() {
    draft = { bag: {}, relics: (save.eq || []).filter(function (r) { return save.relics.indexOf(r) >= 0; }).slice(0, 2) };
    // 이 의뢰에서 쓰던 짐이 있으면 그것부터, 없으면 직전에 쓴 짐부터 담는다
    var prev = (save.bags && save.bags[Q.id]) || save.lastBag;
    var lim = limit(), n = 0;
    if (prev) {
      ST.PIECE_ORDER.forEach(function (id) {
        var c = Math.min(prev[id] || 0, save.coll[id] || 0, lim - n);
        if (c > 0) { draft.bag[id] = c; n += c; }
      });
    }
    // 모자라면 가진 것에서 골고루 채운다
    var guard = 0;
    while (n < lim && guard++ < 50) {
      for (var i = 0; i < ST.PIECE_ORDER.length && n < lim; i++) {
        var id = ST.PIECE_ORDER[i];
        if ((draft.bag[id] || 0) < (save.coll[id] || 0)) { draft.bag[id] = (draft.bag[id] || 0) + 1; n++; }
      }
    }
  }

  function vPack() {
    var q = Q, lim = limit(), n = draftCount();
    var h = '<div class="panel"><div class="row between"><h2>짐 싸기</h2><span>' + n + ' / ' + lim + '</span></div>' +
      '<p class="muted">두부가 실을 조각을 고른다. ' + (q.rule === 'six' ? '이장님 의뢰는 6개만.' : '') + '</p>';
    ST.PIECE_ORDER.forEach(function (id) {
      var have = save.coll[id] || 0;
      if (!have) return;
      var c = draft.bag[id] || 0, p = ST.PIECES[id];
      h += '<div class="pick' + (c ? ' on' : '') + '">' + img(id, null, 16) +
        '<div class="info"><b>' + p.name + '</b>' + esc(p.desc) + '</div>' +
        '<button class="small" data-a="less" data-id="' + id + '"' + (c ? '' : ' disabled') + ' aria-label="' + p.name + ' 빼기">−</button>' +
        '<span class="cnt">' + c + ' / ' + have + '</span>' +
        '<button class="small" data-a="more" data-id="' + id + '"' + (c < have && n < lim ? '' : ' disabled') + ' aria-label="' + p.name + ' 넣기">+</button></div>';
    });
    h += lendHtml(q) + '</div>';
    if (save.relics.length) {
      h += '<div class="panel"><div class="row between"><h2>유물</h2><span>' + draft.relics.length + ' / 2</span></div>' +
        '<p class="muted">두부의 안장 주머니는 두 칸이다.</p>';
      ST.RELIC_ORDER.forEach(function (id) {
        if (save.relics.indexOf(id) < 0) return;
        var on = draft.relics.indexOf(id) >= 0, r = ST.RELICS[id];
        h += '<div class="pick' + (on ? ' on' : '') + '">' + img(r.sprite) +
          '<div class="info"><b>' + r.name + '</b>' + esc(r.desc) + '</div>' +
          '<button class="small" data-a="relic" data-id="' + id + '"' + (!on && draft.relics.length >= 2 ? ' disabled' : '') + '>' + (on ? '빼기' : '넣기') + '</button></div>';
      });
      h += '</div>';
    }
    h += '<div class="row"><button data-a="intro" data-q="' + q.id + '">돌아가기</button>' +
      '<button class="primary" style="flex:1" data-a="go"' + (n === lim ? '' : ' disabled') + '>' +
      (n === lim ? '출발' : (n < lim ? (lim - n) + '개 더 고르기' : (n - lim) + '개 빼기')) + '</button></div>';
    return h;
  }

  function terrainSprite(t, i) {
    if (t === 'water') return 'water';
    if (t === 'wall') return 'wall';
    if (t === 'rock') return 'rock';
    if (t === 'pine') return 'pine';
    return i % 2 ? 'pine' : 'tree';
  }

  function vBuild() {
    var q = Q, s = G, h = '';
    var stuck = !s.over && !ST.canMove(s);
    var done = s.over || stuck;
    h += '<div class="row between" style="margin-bottom:8px"><div class="light">' + esc(q.who) + ' · ' + esc(q.title) + '</div>' +
      '<button class="small" data-a="quit">그만두기</button></div>';

    // 자원
    var target = {};
    q.goals.forEach(function (g) { if (g.r) target[g.r] = g.n; });
    h += '<div class="res">';
    ST.RES_ORDER.forEach(function (r) {
      var t = target[r], met = t && s.res[r] >= t;
      h += '<div><span class="lb">' + ST.RES[r].name + '</span><span class="vl">' + img(ST.RES[r].icon) +
        '<span class="' + (met ? 'met' : '') + '">' + s.res[r] + '</span>' + (t ? '<small>/ ' + t + '</small>' : '') + '</span></div>';
    });
    h += '</div>';

    // 땅
    h += '<div class="board" style="background-image:url(' + ST.ground(q.ground, q.id.charCodeAt(1)) + ')">';
    for (var i = 0; i < 25; i++) {
      var c = s.board[i], cls = 'cell', inner = '';
      if (c && c.k === 't') inner = img(terrainSprite(c.t, i), q.ground, 16);
      else if (c) { inner = img(c.id, q.ground, 16); if (fx && fx.cell === i) cls += ' pop'; }
      else {
        cls += ' empty';
        if (sel !== null && !done) {
          var g = ST.preview(s, sel, i);
          if (g) {
            var gt = gainText(g);
            cls += ' can';
            inner = '<span class="pv">' + (gt.length ? gt.join('<br>') : '0') + '</span>';
          } else cls += ' cannot';
        }
      }
      h += '<button class="' + cls + '" data-a="cell" data-i="' + i + '" aria-label="' + (Math.floor(i / 5) + 1) + '번째 줄 ' + (i % 5 + 1) + '번째 칸">' + inner + '</button>';
    }
    h += '</div>';

    // 손패
    if (!done) {
      h += '<div class="row between light" style="font-size:12px;margin-bottom:6px"><span>' +
        (sel === null ? '놓을 조각을 고르세요' : '놓을 칸을 누르세요. 숫자는 그 칸에 놓으면 얻는 양입니다') + '</span><span>남은 짐 ' + s.bag.length + '개</span></div>';
      h += '<div class="hand' + (s.hand.length > 3 ? ' four' : '') + '">';
      s.hand.forEach(function (id, k) {
        var p = ST.PIECES[id];
        h += '<button class="card' + (sel === k ? ' sel' : '') + '" data-a="card" data-k="' + k + '">' + img(id, null, 16) +
          '<span class="nm">' + p.name + '</span><span class="cat">' + esc(p.desc) + '</span></button>';
      });
      h += '</div>';
    } else {
      h += '<div class="panel center"><p>' + (stuck ? '더 놓을 수 있는 칸이 없다.' : '조각을 다 놓았다.') + '</p>' +
        '<button class="primary wide" data-a="judge">의뢰인에게 보여 주기</button></div>';
    }

    // 유물
    if (s.relics.length) {
      h += '<div class="relics">';
      s.relics.forEach(function (id) {
        var r = ST.RELICS[id];
        h += '<span class="relic" title="' + esc(r.desc) + '">' + img(r.sprite) + r.name + '</span>';
      });
      if (s.relics.indexOf('pencil') >= 0 && !done)
        h += '<button class="small" data-a="redraw"' + (s.pencilUsed || !s.bag.length ? ' disabled' : '') + '>' + (s.pencilUsed ? '연필을 썼다' : '손패 다시 뽑기') + '</button>';
      h += '</div>';
    }

    h += '<div class="row" style="margin-bottom:12px"><button data-a="undo"' + (hist.length ? '' : ' disabled') + '>되돌리기</button>' +
      '<button data-a="restart">다시 하기</button>' +
      (!done ? '<button style="margin-left:auto" data-a="finish"' + (s.n ? '' : ' disabled') + '>여기까지 짓기</button>' : '') + '</div>';

    h += '<div class="panel">' + goalsHtml(q, s) + (q.ruleText ? '<div class="rule">특별 규칙: ' + esc(q.ruleText) + '</div>' : '') + '</div>';
    h += '<div class="memo"><b>할머니의 메모</b>' + esc(q.tip) + '</div>';
    return h;
  }

  function rewardHtml(rw, btn, idx) {
    var isP = !!rw.p, d = isP ? ST.PIECES[rw.p] : ST.RELICS[rw.r];
    return '<div class="pick">' + (isP ? img(rw.p, null, 16) : img(d.sprite)) +
      '<div class="info"><b>' + d.name + (isP ? ' 조각' : ' (유물)') + '</b>' + esc(d.desc) + '</div>' +
      (btn ? '<button class="small primary" data-a="take" data-i="' + idx + '">고르기</button>' : '') + '</div>';
  }

  function vResult() {
    var q = Q, r = result, h = '';
    if (!r.ev.base) {
      h += '<div class="panel"><div class="row" style="gap:12px">' + portrait(q) + '<div><div class="muted">' + esc(q.who) + '</div><p>' + esc(q.fail) + '</p></div></div>' +
        '<div class="gap"></div>' + goalsHtml(q, G) + '</div>';
      h += '<div class="memo"><b>할머니의 메모</b>' + esc(q.tip) + '</div>';
      h += '<div class="row"><button data-a="map">지도로</button><button data-a="pack">짐 다시 싸기</button><button class="primary" style="flex:1" data-a="restart">다시 짓기</button></div>';
      return h;
    }
    h += '<div class="panel center"><h2>의뢰 완료</h2><div class="gap" style="height:6px"></div><div style="display:flex;justify-content:center">' + starsHtml(r.ev.stars, true) + '</div></div>';
    h += '<div class="panel"><div class="row" style="gap:12px;align-items:flex-start">' + portrait(q) + '<div>';
    q.win.forEach(function (l) { h += '<p class="say">' + esc(l) + '</p>'; });
    h += '</div></div><div class="gap"></div>' + goalsHtml(q, G) + '</div>';
    if (r.first) {
      h += '<div class="postcard"><p>' + esc(q.card) + '</p><div class="from">온천에서, 할머니가</div></div><div class="gap"></div>';
    }
    if (r.got.length) {
      h += '<div class="panel"><h2>받은 것</h2>';
      r.got.forEach(function (i) { h += rewardHtml(q.rewards[i], false); });
      h += '</div>';
    }
    if (r.toPick > 0) {
      h += '<div class="panel"><h2>엽서에 딸려 온 것 중 ' + (r.toPick > 1 ? r.toPick + '개를' : '하나를') + ' 고른다</h2>';
      r.left.forEach(function (i) { h += rewardHtml(q.rewards[i], true, i); });
      h += '</div>';
    } else {
      if (r.left.length) h += '<p class="light center" style="font-size:12px">별을 더 모으면 남은 보상 ' + r.left.length + '개도 받을 수 있다.</p>';
      h += '<div class="row"><button data-a="restart">다시 짓기</button><button class="primary" style="flex:1" data-a="map">지도로</button></div>';
    }
    return h;
  }

  function vDex() {
    var h = '<div class="row between"><h1 class="light">도감</h1><button class="small" data-a="map">돌아가기</button></div><div class="gap"></div>';
    var d = V.sel;
    if (d) {
      var isP = !!ST.PIECES[d], o = isP ? ST.PIECES[d] : ST.RELICS[d];
      h += '<div class="panel"><div class="row" style="gap:12px;align-items:flex-start">' +
        '<span class="portrait">' + (isP ? img(d, null, 16) : img(o.sprite)) + '</span><div><h2>' + o.name + '</h2>' +
        '<p>' + esc(o.desc) + '</p></div></div>' +
        '<div class="memo" style="margin:10px 0 0"><b>' + (isP ? '할머니의 메모' : '노트에 적힌 말') + '</b>' + esc(isP ? o.memo : o.lore) + '</div></div>';
    }
    h += '<div class="light" style="margin-bottom:6px">조각</div><div class="dex">';
    ST.PIECE_ORDER.forEach(function (id) {
      var have = save.coll[id] || 0;
      h += '<button class="it' + (have ? '' : ' no') + '" ' + (have ? 'data-a="dexsel" data-id="' + id + '"' : 'disabled') + '>' + img(id, null, 16) +
        '<span class="nm">' + (have ? ST.PIECES[id].name : '?') + '</span>' + (have ? ST.PIECES[id].cat + ' · ' + have + '개' : '아직 없다') + '</button>';
    });
    h += '</div><div class="gap"></div><div class="light" style="margin-bottom:6px">유물</div><div class="dex">';
    ST.RELIC_ORDER.forEach(function (id) {
      var have = save.relics.indexOf(id) >= 0, r = ST.RELICS[id];
      h += '<button class="it' + (have ? '' : ' no') + '" ' + (have ? 'data-a="dexsel" data-id="' + id + '"' : 'disabled') + '>' + img(r.sprite) +
        '<span class="nm">' + (have ? r.name : '?') + '</span>' + (have ? '유물' : '아직 없다') + '</button>';
    });
    h += '</div>';
    return h;
  }

  function render() {
    var h = '';
    if (V.name === 'start') h = vStart();
    else if (V.name === 'map') h = vMap();
    else if (V.name === 'intro') h = vIntro();
    else if (V.name === 'pack') h = vPack();
    else if (V.name === 'build') h = vBuild();
    else if (V.name === 'result') h = vResult();
    else if (V.name === 'dex') h = vDex();
    app.innerHTML = h;

    // 방금 얻은 것을 칸 위에 잠깐 띄운다
    if (V.name === 'build' && fx) {
      var cells = app.querySelectorAll('.cell');
      fx.parts.forEach(function (p) {
        var t = gainText(p.g);
        if (!t.length || !cells[p.cell]) return;
        var el = document.createElement('span');
        el.className = 'float';
        el.textContent = t.join(' ');
        cells[p.cell].appendChild(el);
      });
      fx = null;
    }
  }
  function go(name, extra) {
    V = { name: name };
    if (extra) for (var k in extra) V[k] = extra[k];
    render();
    window.scrollTo(0, 0);
  }

  // ───── 판 진행 ─────

  function startGame() {
    var bag = [];
    for (var id in draft.bag) for (var i = 0; i < draft.bag[id]; i++) bag.push(id);
    bag = bag.concat(Q.lend);
    save.bags = save.bags || {};
    save.bags[Q.id] = JSON.parse(JSON.stringify(draft.bag));
    save.lastBag = JSON.parse(JSON.stringify(draft.bag));
    save.eq = draft.relics.slice();
    persist();
    G = ST.newGame(Q, bag, draft.relics, (Date.now() % 100000) + 1);
    hist = []; sel = null; fx = null;
    go('build');
  }

  function judge() {
    var ev = ST.evaluate(G, Q);
    var r = { ev: ev, first: false, got: [], left: [], toPick: 0 };
    if (ev.base) {
      var prev = save.stars[Q.id] || 0;
      r.first = prev === 0;
      var newStars = Math.max(0, ev.stars - prev);
      save.stars[Q.id] = Math.max(prev, ev.stars);
      var picked = save.picks[Q.id] || (save.picks[Q.id] = []);
      Q.rewards.forEach(function (_, i) { if (picked.indexOf(i) < 0) r.left.push(i); });
      r.toPick = Math.min(newStars, r.left.length);
      if (r.toPick && r.toPick === r.left.length) {
        r.left.slice().forEach(function (i) { grant(i, r); });
      }
      if (Q.id === 'q5') save.ended = true;
      persist();
    }
    result = r;
    go('result');
  }

  function grant(i, r) {
    var rw = Q.rewards[i];
    if (rw.p) save.coll[rw.p] = (save.coll[rw.p] || 0) + 1;
    else if (save.relics.indexOf(rw.r) < 0) save.relics.push(rw.r);
    save.picks[Q.id].push(i);
    r.got.push(i);
    r.left.splice(r.left.indexOf(i), 1);
    r.toPick--;
    persist();
  }

  var ACT = {
    begin: function () {
      var v = (document.getElementById('nm').value || '').trim() || '손주';
      save = fresh(v); persist(); go('map');
    },
    map: function () { go('map'); },
    dex: function () { go('dex', { sel: null }); },
    dexsel: function (d) { V.sel = d.id; render(); },
    reset: function () {
      if (window.confirm('모은 조각과 별이 전부 사라집니다. 처음부터 다시 할까요?')) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        save = null; go('start');
      }
    },
    intro: function (d) { Q = quest(d.q); go('intro'); },
    pack: function () { makeDraft(); go('pack'); },
    more: function (d) {
      if (draftCount() < limit() && (draft.bag[d.id] || 0) < (save.coll[d.id] || 0)) draft.bag[d.id] = (draft.bag[d.id] || 0) + 1;
      render();
    },
    less: function (d) { if (draft.bag[d.id]) draft.bag[d.id]--; render(); },
    relic: function (d) {
      var k = draft.relics.indexOf(d.id);
      if (k >= 0) draft.relics.splice(k, 1);
      else if (draft.relics.length < 2) draft.relics.push(d.id);
      // 당근 주머니를 빼서 짐이 넘치면 뒤에서부터 덜어 낸다
      var over = draftCount() - limit();
      for (var i = ST.PIECE_ORDER.length - 1; i >= 0 && over > 0; i--) {
        var id = ST.PIECE_ORDER[i];
        while (over > 0 && draft.bag[id]) { draft.bag[id]--; over--; }
      }
      render();
    },
    go: function () { if (draftCount() === limit()) startGame(); },
    card: function (d) { sel = sel === +d.k ? null : +d.k; render(); },
    cell: function (d) {
      if (sel === null || G.over) return;
      var i = +d.i, snap = JSON.stringify(G);
      var parts = ST.place(G, sel, i);
      if (!parts) return;
      hist.push(snap);
      fx = { cell: i, parts: parts };
      sel = null;
      render();
    },
    undo: function () {
      if (!hist.length) return;
      G = JSON.parse(hist.pop()); sel = null; fx = null; render();
    },
    restart: function () {
      var bag = [];
      for (var id in draft.bag) for (var i = 0; i < draft.bag[id]; i++) bag.push(id);
      G = ST.newGame(Q, bag.concat(Q.lend), draft.relics, (Date.now() % 100000) + 1);
      hist = []; sel = null; fx = null; go('build');
    },
    redraw: function () {
      var snap = JSON.stringify(G);
      if (ST.redraw(G)) { hist.push(snap); sel = null; render(); }
    },
    finish: function () {
      if (G.hand.length && !window.confirm('아직 놓지 않은 조각이 있습니다. 여기서 마칠까요?')) return;
      judge();
    },
    judge: function () { judge(); },
    quit: function () {
      if (window.confirm('이 판을 그만두고 지도로 돌아갈까요?')) go('map');
    },
    take: function (d) {
      if (result.toPick > 0) grant(+d.i, result);
      render();
    }
  };

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]');
    if (!t || t.disabled) return;
    var f = ACT[t.dataset.a];
    if (f) f(t.dataset);
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'nm') ACT.begin();
  });

  render();
})();
