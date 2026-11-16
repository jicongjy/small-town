// 화면. 누를 때마다 화면 전체를 다시 그리는 단순한 방식이다.
(function () {
  var ST = window.ST;
  var app = document.getElementById('app');
  // 주소 끝에 ?slot=이름 을 붙이면 다른 저장 칸을 쓴다(시험용).
  var slot = (location.search.match(/[?&]slot=([a-z0-9]+)/) || [])[1];
  var KEY = 'small-town-save-v1' + (slot ? '-' + slot : '');

  var save = load();
  var V = save ? { name: 'map' } : { name: 'start', i: 0 };
  var Q = null;        // 지금 하는 의뢰
  var G = null;        // 지금 판의 상태
  var hist = [];       // 되돌리기용 기록
  var sel = null;      // 고른 손패 번호
  var fx = null;       // 방금 놓은 결과(움직임 표시용)
  var draft = null;    // 짐 싸는 중인 내용
  var result = null;   // 평가 결과
  var tut = null;      // 첫 의뢰 연습판 진행 상태

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

  // 이야기 한 컷. 그림, 글, 넘기는 단추로 이루어진다.
  function cutArt(c) {
    var h = '<div class="art">';
    (c.imgs || []).forEach(function (n) { h += img(n, null, null, 'scn'); });
    (c.pieces || []).forEach(function (n) { h += img(n, null, 16, 'scnp'); });
    return h + '</div>';
  }
  function cutNav(i, total, back, next, nextLabel) {
    return '<div class="row"><button data-a="' + back + '"' + (i ? '' : ' disabled') + '>이전</button>' +
      '<span class="light" style="font-size:12px">' + (i + 1) + ' / ' + total + '</span>' +
      '<button class="primary" style="flex:1" data-a="' + next + '">' + nextLabel + '</button></div>';
  }

  function vStart() {
    var cuts = ST.TEXT.prologue, i = V.i, c = cuts[i];
    var h = '<div class="row between"><h1 class="light">' + ST.TEXT.title + '</h1>' +
      (c.name ? '' : '<button class="ghost small" data-a="proskip">건너뛰기</button>') + '</div><div class="gap"></div>';
    if (c.letter) {
      h += '<div class="postcard scene"><p>' + esc(c.text) + '</p><div class="from">' + esc(c.from) + '</div></div><div class="gap"></div>';
    } else {
      h += '<div class="panel scene">' + cutArt(c) + '<p>' + esc(c.text) + '</p></div>';
    }
    if (c.name) {
      h += '<div class="panel"><p>노트 표지에 이름을 적는다.</p>' +
        '<input type="text" id="nm" maxlength="8" placeholder="손주" autocomplete="off">' +
        '<div class="gap"></div><div class="row"><button data-a="proback">이전</button>' +
        '<button class="primary" style="flex:1" data-a="begin">노트를 편다</button></div></div>';
    } else {
      h += cutNav(i, cuts.length, 'proback', 'pronext', '다음');
    }
    return h;
  }

  // 지도. 골짜기 마을 그림 한 장이다. 의뢰를 끝내면 그 구역에 건물이 서고, 별을 모을수록 건물이 늘고, 의뢰인이 돌아다닌다.
  // 배치는 data.js의 ST.VALLEY에 있다.
  var BASE_SPRITE = { T: 'tree', p: 'pine', r: 'rock', '=': 'path', '~': 'water', '#': 'bridge' };
  function at(r, c, w, h) {
    var VL = ST.VALLEY;
    return 'left:' + (c * 100 / VL.cols) + '%;top:' + (r * 100 / VL.rows) + '%;width:' + ((w || 1) * 100 / VL.cols) + '%;height:' + ((h || 1) * 100 / VL.rows) + '%';
  }
  function vMap() {
    var VL = ST.VALLEY, total = 0, cleared = 0, now = -1;
    ST.QUESTS.forEach(function (q, i) {
      var st = save.stars[q.id] || 0;
      total += st; if (st) cleared++;
      if (now < 0 && !st) now = i;
    });
    if (now < 0) now = ST.QUESTS.length - 1;
    var h = '<div class="row between"><div><h1 class="light">' + ST.TEXT.title + '</h1>' +
      '<div class="light" style="font-size:12px;opacity:.8">' + esc(save.name) + '의 첫 번째 골짜기</div></div>' +
      '<button class="small" data-a="dex">도감</button></div>';
    h += '<div class="light mapstat"><span>의뢰 ' + cleared + ' / ' + ST.QUESTS.length + ' · 별을 모을수록 마을이 커진다</span><span class="row" style="gap:4px">' + img('star', null, null, 'gs') + total + ' / ' + ST.QUESTS.length * 3 + '</span></div>';

    h += '<div class="vwrap"><div class="valley" style="background-image:url(' + ST.ground('day', 5) + ')">';
    var r, c;
    for (r = 0; r < VL.rows; r++) for (c = 0; c < VL.cols; c++) {
      var sp = BASE_SPRITE[VL.base[r].charAt(c)];
      if (sp) h += '<span class="vt" style="' + at(r, c) + '">' + img(sp, 'day', 16) + '</span>';
    }
    ST.QUESTS.forEach(function (q, i) {
      var A = VL.areas[q.id], st = save.stars[q.id] || 0, open = unlocked(i), state = st ? 'done' : (open ? 'open' : 'lock');
      var fresh = V.fresh === q.id, k = 0;
      A.always.forEach(function (t) { h += '<span class="vt' + (state === 'lock' ? ' far' : '') + '" style="' + at(t[0], t[1]) + '">' + img(t[2], 'day', 16) + '</span>'; });
      var signed = false;
      A.build.forEach(function (t) {
        if (t[3] <= st) {
          h += '<span class="vt' + (fresh ? ' rise' : '') + '" style="' + at(t[0], t[1]) + (fresh ? ';animation-delay:' + (0.25 * k++) + 's' : '') + '">' + img(t[2], 'day', 16) + '</span>';
        } else if (state === 'open' && !signed) {
          signed = true;
          h += '<span class="vt sign" style="' + at(t[0], t[1]) + '">' + img('sign', 'day', 16) + '</span>';
        } else {
          h += '<span class="vt lot' + (state === 'lock' ? ' far' : '') + '" style="' + at(t[0], t[1]) + '">' + (st ? img('star_off') : '') + '</span>';
        }
      });
      if (st) A.walk.forEach(function (w, n) {
        h += '<span class="walker" style="' + at(w[1] + 0.42, 0, 0.55, 0.55) + ';--a:' + (w[2] * 100 / VL.cols) + '%;--b:' + ((w[3] - 0.55) * 100 / VL.cols) + '%;animation-duration:' + (3 + (w[3] - w[2]) * 2.2 + n) + 's">' + img(w[0]) + '</span>';
      });
      var act = open ? 'data-a="intro" data-q="' + q.id + '"' : 'disabled';
      h += '<button class="area ' + state + '" style="' + at(A.box[0], A.box[1], A.box[3] - A.box[1] + 1, A.box[2] - A.box[0] + 1) + '" ' + act +
        ' aria-label="' + (i + 1) + '번째 의뢰 ' + (open ? esc(q.who) + ' ' + esc(q.title) : '앞의 의뢰를 먼저 끝내야 한다') + '"></button>';
      h += '<button class="plate ' + state + '" style="left:' + ((A.label[1] + 0.5) * 100 / VL.cols) + '%;top:' + ((A.label[0] + 0.5) * 100 / VL.rows) + '%" ' + act + ' tabindex="-1" aria-hidden="true">' +
        '<span><b>' + (i + 1) + '</b> ' + (open ? esc(q.who) : '? ? ?') + '</span>' + (st ? starsHtml(st) : (open ? '<em>새 의뢰</em>' : '')) + '</button>';
      if (i === now) h += '<span class="me" style="' + at(A.me, 4) + '">' + img('hero') + img('donkey') + '</span>';
    });
    h += '</div></div>';
    h += '<div class="center">' + (save.ended ? '<button class="ghost small" data-a="ending">노트 맨 뒷장</button>' : '') +
      '<button class="ghost small" data-a="reset">처음부터 다시 하기</button></div>';
    return h;
  }

  // 마지막 의뢰를 끝내면 나오는 노트 맨 뒷장
  function vEnding() {
    var h = '<div class="panel scene"><div class="tag">노트 맨 뒷장</div>' + cutArt({ imgs: ['note'] });
    ST.TEXT.ending.forEach(function (l) { h += '<p style="margin-bottom:8px">' + esc(l) + '</p>'; });
    return h + '</div><button class="primary wide" data-a="map">지도로</button>';
  }

  function lendHtml(q) {
    if (!q.lend.length) return '';
    var cnt = {};
    q.lend.forEach(function (id) { cnt[id] = (cnt[id] || 0) + 1; });
    var parts = [];
    for (var id in cnt) parts.push(ST.PIECES[id].name + ' ' + cnt[id] + '개');
    return '<p class="muted">의뢰인이 내놓은 조각: ' + parts.join(', ') + ' (짐 개수에 안 들어간다)</p>';
  }

  // 의뢰 소개를 한 컷씩으로 나눈다: 길 위에서, 등장 카드, 의뢰인의 말
  function introCuts(q) {
    var cuts = [];
    (q.road || []).forEach(function (l) { cuts.push({ kind: 'road', text: l }); });
    cuts.push({ kind: 'card' });
    q.intro.forEach(function (l) { cuts.push({ kind: 'say', text: l }); });
    return cuts;
  }
  function isTut() { return Q && Q.id === 'q1' && !(save.stars.q1 > 0); }
  function lesson(q, at) {
    if (!q.lesson || q.lesson.at !== at || (save.stars[q.id] || 0) > 0) return '';
    return noteMemo('할머니의 훈수', q.lesson.text);
  }
  function noteMemo(title, text) {
    return '<div class="memo coach"><div class="row" style="gap:8px;align-items:flex-start">' + img('grandma', null, null, 'roadc') +
      '<div><b>' + esc(title) + '</b>' + esc(text) + '</div></div></div>';
  }

  function vIntro() {
    var q = Q, cuts = introCuts(q), i = V.i, h = '';
    if (i < cuts.length) {
      var c = cuts[i];
      h += '<div class="row between"><div class="light">' + (ST.QUESTS.indexOf(q) + 1) + '번째 의뢰</div>' +
        '<button class="ghost small" data-a="introskip">건너뛰기</button></div><div class="gap"></div>';
      if (c.kind === 'road') {
        h += '<div class="panel scene"><div class="tag">길 위에서</div>' + cutArt({ imgs: ['hero', 'donkey'] }) + '<p>' + esc(c.text) + '</p></div>';
      } else if (c.kind === 'card') {
        // 의뢰인 등장. 길 위의 이야기와 달리 "의뢰가 시작된다"는 것이 보이도록 따로 꾸민다
        var qn = ST.QUESTS.indexOf(q) + 1;
        h += '<div class="qcard"><div class="qc-no">의뢰 ' + qn + ' / ' + ST.QUESTS.length + '</div>' +
          '<h1 class="qc-title">' + esc(q.title) + '</h1>' +
          '<div class="qc-stage" style="background-image:url(' + ST.ground(q.ground, q.id.charCodeAt(1)) + ')">' +
          '<span class="qc-ray"></span><span class="qc-who' + (q.portraits.length > 1 ? ' two' : '') + '">' + q.portraits.map(function (pt) { return img(pt); }).join('') + '</span></div>' +
          '<div class="qc-name"><small>의뢰인</small>' + esc(q.who) + '</div>' +
          '<p class="qc-bio">' + esc(q.bio) + '</p>' +
          '<div class="qc-note"><b>할머니의 노트</b>' + esc(q.note) + '</div></div>';
      } else {
        h += '<div class="panel scene"><div class="tag">' + esc(q.who) + '</div><div class="art">' + portrait(q) + '</div><p>' + esc(c.text) + '</p></div>';
      }
      h += cutNav(i, cuts.length, 'introback', 'intronext', i === cuts.length - 1 ? '의뢰 조건 보기' : (c.kind === 'card' ? '의뢰 듣기' : '다음'));
      return h;
    }
    h += '<div class="panel"><div class="row" style="gap:12px">' + portrait(q) +
      '<div><div class="muted">' + esc(q.who) + '</div><h2>' + esc(q.title) + '</h2></div></div>' +
      '<div class="gap"></div><h2>의뢰 조건</h2><div class="gap" style="height:6px"></div>' + goalsHtml(q, null) +
      '<p class="muted" style="margin-top:6px">별이 붙은 조건은 추가 목표다.</p>' +
      (q.ruleText ? '<div class="rule">특별 규칙: ' + esc(q.ruleText) + '</div>' : '') + '</div>';
    h += lesson(q, 'rule');
    h += rewardPreview(q);
    if (q.lend.length) h += '<div class="panel">' + lendHtml(q) + '</div>';
    h += '<div class="row"><button data-a="map">지도로</button><button data-a="story">이야기 다시 보기</button>' +
      (isTut() ? '<button class="primary" style="flex:1" data-a="tutgo">밀순이네 땅으로</button>'
        : '<button class="primary" style="flex:1" data-a="pack">짐 싸기</button>') + '</div>';
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

  // 짐 싸기. 조각은 타일로 늘어놓고, 누른 것의 효과만 위에 한 줄로 보여 준다(한 화면에 다 들어오게).
  function vPack() {
    var q = Q, lim = limit(), n = draftCount();
    var info = V.info, io = info ? (ST.PIECES[info] || ST.RELICS[info]) : null;
    var h = lesson(q, 'pack') + (save.relics.length ? lesson(q, 'relic') : '');
    h += '<div class="panel pk"><div class="row between"><h2>짐 싸기</h2><span>' + n + ' / ' + lim + '</span></div>' +
      '<p class="pinfo">' + (io ? '<b>' + io.name + '</b> ' + esc(io.desc) : '두부가 실을 조각을 고른다. 그림을 누르면 효과가 보인다.' + (q.rule === 'six' ? ' 이장님 의뢰는 6개만.' : '')) + '</p>';
    h += '<div class="tiles">';
    ST.PIECE_ORDER.forEach(function (id) {
      var have = save.coll[id] || 0;
      if (!have) return;
      var c = draft.bag[id] || 0, p = ST.PIECES[id];
      h += '<div class="tile' + (c ? ' on' : '') + (info === id ? ' cur' : '') + '">' +
        '<button class="tinfo" data-a="pinfo" data-id="' + id + '">' + img(id, null, 16) + '<span><b>' + p.name + '</b>' + c + ' / ' + have + '</span></button>' +
        '<div class="pm"><button class="small" data-a="less" data-id="' + id + '"' + (c ? '' : ' disabled') + ' aria-label="' + p.name + ' 빼기">−</button>' +
        '<button class="small" data-a="more" data-id="' + id + '"' + (c < have && n < lim ? '' : ' disabled') + ' aria-label="' + p.name + ' 넣기">+</button></div></div>';
    });
    h += '</div>' + lendHtml(q);
    if (save.relics.length) {
      h += '<div class="row between" style="margin-top:8px"><h2>유물</h2><span>' + draft.relics.length + ' / 2</span></div><div class="rchips">';
      ST.RELIC_ORDER.forEach(function (id) {
        if (save.relics.indexOf(id) < 0) return;
        var on = draft.relics.indexOf(id) >= 0, r = ST.RELICS[id];
        h += '<button class="small rchip' + (on ? ' on' : '') + '" data-a="relic" data-id="' + id + '"' + (!on && draft.relics.length >= 2 ? ' disabled' : '') +
          ' aria-pressed="' + on + '">' + img(r.sprite) + r.name + '</button>';
      });
      h += '</div>';
    }
    h += '</div>';
    h += '<div class="row"><button data-a="intro" data-skip="1" data-q="' + q.id + '">돌아가기</button>' +
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

  // 첫 의뢰 연습판. 지금 판의 상태를 보고 몇 번째 단계인지 정한다(되돌리기를 눌러도 맞게 따라간다).
  // need는 지금 집어야 하는 조각, cells는 놓을 수 있는 칸, wait는 "다음"을 눌러야 넘어가는 단계.
  function tutStep() {
    if (!tut || !isTut()) return null;
    var T = ST.TUTOR, s = G, i, k;
    if (tut.pre < T.pre.length) return { wait: true, text: T.pre[tut.pre].text, focus: T.pre[tut.pre].focus || 'none' };
    if (s.n === 0) return { need: 'field', cells: [T.cells.field1], text: T.field1 };
    if (s.n === 1) return { need: 'field', cells: [T.cells.field2], text: T.field2 };
    if (s.n === 2) return { need: 'bakery', cells: [T.cells.bakery], text: T.bakery };
    if (s.n === 3 && !tut.ack) return { wait: true, text: T.why };
    var empty = [], near = [];
    for (i = 0; i < 25; i++) {
      if (s.board[i]) continue;
      empty.push(i);
      var ns = [i - 5, i + 5, i % 5 ? i - 1 : -1, i % 5 < 4 ? i + 1 : -1];
      for (k = 0; k < 4; k++) if (ns[k] >= 0 && ns[k] < 25 && s.board[ns[k]] && s.board[ns[k]].id === 'house') { near.push(i); break; }
    }
    if (s.n === 3) return { need: 'house', cells: empty, text: T.house1 };
    if (s.n === 4) return { need: 'house', cells: near, text: T.house2 };
    return { free: true, text: T.free };
  }
  function coach(ts) {
    if (!ts) return '';
    return '<div class="memo coach"><div class="row" style="gap:8px;align-items:flex-start">' + img('grandma', null, null, 'roadc') +
      '<div style="flex:1"><b>노트 첫 장 · 할머니 글씨</b>' + esc(ts.text) +
      (ts.wait ? '<div style="text-align:right;margin-top:6px"><button class="small primary" data-a="tnext">다음</button></div>' : '') +
      '</div></div></div>';
  }

  // 짓기 화면. 스크롤 없이 한 화면에 들어오도록, 남는 높이만큼 땅 크기를 맞춘다(style.css의 .v-build).
  function vBuild() {
    var q = Q, s = G, h = '';
    var stuck = !s.over && !ST.canMove(s);
    var done = s.over || stuck;
    var ts = tutStep();
    var lock = ts && !ts.free;          // 연습판이 순서를 정해 주는 동안
    function foc(part) { return ts && ts.focus ? (ts.focus === part ? ' focus' : ' dimmed') : ''; }

    h += '<div class="row between"><div class="light bt">' + esc(q.who) + ' · ' + esc(q.title) + '</div>' +
      '<span class="row" style="gap:6px">' + (ts ? '' : '<button class="small" data-a="tip">메모</button>') +
      '<button class="small" data-a="quit">그만두기</button></span></div>';

    h += coach(ts);
    if (!ts && V.tip) h += '<div class="memo"><b>할머니의 메모</b>' + esc(q.tip) + '</div>';

    // 자원
    var target = {};
    q.goals.forEach(function (g) { if (g.r) target[g.r] = g.n; });
    h += '<div class="res' + foc('res') + '">';
    ST.RES_ORDER.forEach(function (r) {
      var t = target[r], met = t && s.res[r] >= t;
      h += '<div><span class="lb">' + ST.RES[r].name + '</span><span class="vl">' + img(ST.RES[r].icon) +
        '<span class="' + (met ? 'met' : '') + '">' + s.res[r] + '</span>' + (t ? '<small>/ ' + t + '</small>' : '') + '</span></div>';
    });
    h += '</div>';

    // 의뢰 조건
    h += '<div class="gl' + (ts && ts.focus ? ' dimmed' : '') + '">' + goalsHtml(q, s) + '</div>';
    if (q.ruleText) h += '<div class="rule">' + esc(q.ruleText) + '</div>';

    // 땅
    h += '<div class="bwrap"><div class="board' + foc('board') + '" style="background-image:url(' + ST.ground(q.ground, q.id.charCodeAt(1)) + ')">';
    for (var i = 0; i < 25; i++) {
      var c = s.board[i], cls = 'cell', inner = '';
      if (c && c.k === 't') inner = img(terrainSprite(c.t, i), q.ground, 16);
      else if (c) { inner = img(c.id, q.ground, 16); if (fx && fx.cell === i) cls += ' pop'; }
      else {
        cls += ' empty';
        if (sel !== null && !done) {
          var g = ST.preview(s, sel, i);
          if (lock && (!ts.cells || ts.cells.indexOf(i) < 0)) g = null, cls += ' off';
          if (g) {
            if (lock) cls += ' pulse';
            var gt = gainText(g);
            cls += ' can';
            inner = '<span class="pv">' + (gt.length ? gt.join('<br>') : '0') + '</span>';
          } else if (!lock) cls += ' cannot';
        }
      }
      h += '<button class="' + cls + '" data-a="cell" data-i="' + i + '" aria-label="' + (Math.floor(i / 5) + 1) + '번째 줄 ' + (i % 5 + 1) + '번째 칸">' + inner + '</button>';
    }
    h += '</div></div>';

    // 손패
    var rel = '';
    s.relics.forEach(function (id) { rel += '<span class="rl" title="' + esc(ST.RELICS[id].desc) + '">' + img(ST.RELICS[id].sprite) + ST.RELICS[id].name + '</span>'; });
    if (!done) {
      h += '<div class="row between light hint"><span>' + (sel === null ? '조각을 고르세요' : '놓을 칸을 누르세요') + '</span>' +
        '<span class="row" style="gap:8px">' + rel + '<span>남은 짐 ' + s.bag.length + '개</span></span></div>';
      h += '<div class="hand' + (s.hand.length > 3 ? ' four' : '') + foc('hand') + '">';
      var want = lock && ts.need ? s.hand.indexOf(ts.need) : -1;
      s.hand.forEach(function (id, k) {
        var p = ST.PIECES[id];
        var off = lock && (ts.wait || id !== ts.need);
        h += '<button class="card' + (sel === k ? ' sel' : '') + (off ? ' dim' : '') + (sel === null && k === want ? ' pulse' : '') + '" data-a="card" data-k="' + k + '"' + (off ? ' disabled' : '') + '>' + img(id, null, 16) +
          '<span class="nm">' + p.name + '</span><span class="cat">' + esc(p.desc) + '</span></button>';
      });
      h += '</div>';
    } else {
      h += '<div class="panel center fin"><p>' + (stuck ? '더 놓을 수 있는 칸이 없다.' : '조각을 다 놓았다.') + '</p>' +
        '<button class="primary wide" data-a="judge">의뢰인에게 보여 주기</button></div>';
    }

    h += '<div class="row acts"><button class="small" data-a="undo"' + (hist.length ? '' : ' disabled') + '>되돌리기</button>' +
      '<button class="small" data-a="restart">다시 하기</button>' +
      (s.relics.indexOf('pencil') >= 0 && !done ? '<button class="small" data-a="redraw"' + (s.pencilUsed || !s.bag.length ? ' disabled' : '') + '>' + (s.pencilUsed ? '연필 씀' : '다시 뽑기') + '</button>' : '') +
      (!done ? '<button class="small" style="margin-left:auto" data-a="finish"' + (s.n && !lock ? '' : ' disabled') + '>여기까지 짓기</button>' : '') + '</div>';
    return h;
  }

  // 보상 카드 한 장. state: pick 고를 수 있다, sel 골랐다, new 방금 받았다, had 전에 받았다, wait 별이 더 필요하다
  function rewardCard(q, i, state) {
    var rw = q.rewards[i], isP = !!rw.p, d = isP ? ST.PIECES[rw.p] : ST.RELICS[rw.r];
    var can = state === 'pick' || state === 'sel';
    var tag = { sel: '골랐다', new: '받았다', had: '전에 받음', wait: '별이 더 필요', pick: '' }[state];
    return '<' + (can ? 'button data-a="take" data-i="' + i + '" aria-pressed="' + (state === 'sel') + '"' : 'div') + ' class="gift ' + state + '">' +
      '<span class="kind">' + (isP ? '조각' : '유물') + '</span>' +
      '<span class="pic">' + (isP ? img(rw.p, null, 16) : img(d.sprite)) + '</span>' +
      '<span class="nm">' + d.name + '</span><span class="ds">' + esc(d.desc) + '</span>' +
      (tag ? '<span class="tagline">' + tag + '</span>' : '') + '</' + (can ? 'button' : 'div') + '>';
  }
  // 의뢰 조건 화면에 미리 보여 주는 보상
  function rewardPreview(q) {
    var picked = save.picks[q.id] || [];
    var h = '<div class="panel prev"><h2>할머니가 보내 줄 것</h2>' +
      '<p class="muted">의뢰를 끝내면 별 1개에 하나씩 고른다. 별 3개면 셋 다 받는다.</p><div class="prevrow">';
    q.rewards.forEach(function (rw, i) {
      var isP = !!rw.p, d = isP ? ST.PIECES[rw.p] : ST.RELICS[rw.r], had = picked.indexOf(i) >= 0;
      h += '<span class="pv3' + (had ? ' had' : '') + '">' + (isP ? img(rw.p, null, 16) : img(d.sprite)) + '<span>' + d.name + (had ? '<br><small>받음</small>' : '') + '</span></span>';
    });
    return h + '</div></div>';
  }

  // 결과. 한 쪽에 하나씩 보여 준다: 의뢰 완료 → 온천에서 온 엽서 → 노트에 드러난 글 → 딸려 온 상자
  function vResult() {
    var q = Q, r = result, h = '', n = ST.QUESTS.indexOf(q) + 1;
    if (!r.ev.base) {
      h += '<div class="panel"><div class="row" style="gap:12px">' + portrait(q) + '<div><div class="muted">' + esc(q.who) + '</div><p>' + esc(q.fail) + '</p></div></div>' +
        '<div class="gap"></div>' + goalsHtml(q, G) + '</div>';
      h += '<div class="memo"><b>할머니의 메모</b>' + esc(q.tip) + '</div>';
      h += '<div class="row"><button data-a="map">지도로</button><button data-a="pack">짐 다시 싸기</button><button class="primary" style="flex:1" data-a="restart">다시 짓기</button></div>';
      return h;
    }
    var pages = ['win'];
    if (r.first) pages.push('card', 'note');
    if (r.gift) pages.push('gift');
    var pi = Math.min(V.pg || 0, pages.length - 1), pg = pages[pi], last = pi === pages.length - 1;
    var dots = '<div class="dots">' + pages.map(function (_, k) { return '<i' + (k === pi ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';

    if (pg === 'win') {
      h += '<div class="banner"><div class="light sm">' + n + '번째 의뢰 · ' + esc(q.title) + '</div><h1 class="light">의뢰 완료</h1>' +
        '<div class="bigstars">' + [0, 1, 2].map(function (k) { return '<span style="animation-delay:' + (0.15 + k * 0.25) + 's">' + img(k < r.ev.stars ? 'star' : 'star_off') + '</span>'; }).join('') + '</div></div>';
      h += '<div class="talk"><div class="who">' + portrait(q) + '<span>' + esc(q.who) + '</span></div><div class="bubbles">';
      q.win.forEach(function (l) { h += '<p class="bubble">' + esc(l) + '</p>'; });
      h += '</div></div>';
      h += '<div class="panel tight">' + goalsHtml(q, G) + '</div>';
      if (r.tut && r.ev.stars < 3) h += noteMemo('노트 첫 장 · 할머니 글씨', ST.TUTOR.end);
    } else if (pg === 'card') {
      h += '<div class="light center lead">온천에서 엽서가 왔다</div>';
      h += '<div class="pcard"><div class="pc-pic">' + img('steam', null, null, 'st') + '<span class="tub">' + img('grandma') + '</span></div>' +
        '<div class="pc-body"><div class="pc-text"><p>' + esc(q.card) + '</p><div class="from">온천에서, 할머니가</div></div>' +
        '<div class="pc-side"><span class="stamp">' + img('donkey') + '</span><span class="mark">온천<br>우체국</span><span class="to">' + esc(save.name) + '에게</span></div></div></div>';
    } else if (pg === 'note') {
      h += '<div class="light center lead">노트에 글씨가 드러났다</div>';
      h += '<div class="notebook"><div class="nb-head"><span>할머니의 노트</span><span>' + n + ' / ' + ST.QUESTS.length + ' 장</span></div>' +
        '<div class="nb-who">' + portrait(q) + '<div><b>' + esc(q.who) + '</b><span>' + esc(q.note) + '</span></div></div>' +
        '<div class="nb-new"><em>새로 드러난 글</em><p>' + esc(q.reveal) + '</p></div></div>';
    } else {
      var had = r.before, choosing = r.toPick > 0;
      h += '<div class="light center lead">엽서에 상자가 딸려 왔다</div>';
      h += '<div class="panel giftbox"><div class="gb-top"><span class="stars big">' + [0, 1, 2].map(function (k) { return img(k < r.ev.stars ? 'star' : 'star_off'); }).join('') + '</span>' +
        '<p>' + (choosing
          ? '별 1개에 하나씩 고른다. 이번에 <b>' + r.toPick + '개</b>를 고를 수 있다.'
          : (r.left.length ? '고른 것을 받았다. 별을 더 모으면 남은 것도 받는다.' : '별 셋을 다 모아서 셋 다 받았다.')) + '</p></div><div class="gifts">';
      q.rewards.forEach(function (_, i) {
        var state = had.indexOf(i) >= 0 ? 'had' : r.got.indexOf(i) >= 0 ? 'new' : choosing ? (r.sel.indexOf(i) >= 0 ? 'sel' : 'pick') : 'wait';
        h += rewardCard(q, i, state);
      });
      h += '</div></div>';
      if (choosing) return h + dots + '<button class="primary wide" data-a="confirm"' + (r.sel.length === r.toPick ? '' : ' disabled') + '>' +
        (r.sel.length === r.toPick ? '고른 것 받기' : '고르기 ' + r.sel.length + ' / ' + r.toPick) + '</button>';
    }
    h += dots;
    if (!last) return h + '<button class="primary wide" data-a="rnext">다음</button>';
    h += '<div class="row"><button data-a="restart">다시 짓기</button>' + (q.id === 'q5' && r.first
      ? '<button class="primary" style="flex:1" data-a="ending">노트 맨 뒷장을 편다</button>'
      : '<button class="primary" style="flex:1" data-a="mapnew">마을로 돌아가기</button>') + '</div>';
    return h;
  }

  function vDex() {
    var h = '<div class="row between"><h1 class="light">도감</h1><button class="small" data-a="map">돌아가기</button></div>';
    var d = V.sel, isP = d && !!ST.PIECES[d], o = d ? (isP ? ST.PIECES[d] : ST.RELICS[d]) : null;
    h += '<div class="panel dinfo">' + (o
      ? '<div class="row" style="gap:10px;align-items:flex-start"><span class="portrait">' + (isP ? img(d, null, 16) : img(o.sprite)) + '</span><div><h2>' + o.name +
        (isP ? ' <small class="muted">' + o.cat + ' · ' + (save.coll[d] || 0) + '개</small>' : '') + '</h2><p>' + esc(o.desc) + '</p>' +
        '<p class="muted">' + esc(isP ? o.memo : o.lore) + '</p></div></div>'
      : '<p class="muted">그림을 누르면 효과와 할머니의 메모가 보인다.</p>') + '</div>';
    h += '<div class="light dl">조각</div><div class="dex">';
    ST.PIECE_ORDER.forEach(function (id) {
      var have = save.coll[id] || 0;
      h += '<button class="it' + (have ? '' : ' no') + (d === id ? ' cur' : '') + '" ' + (have ? 'data-a="dexsel" data-id="' + id + '"' : 'disabled') + '>' + img(id, null, 16) +
        '<span class="nm">' + (have ? ST.PIECES[id].name : '?') + '</span></button>';
    });
    h += '</div><div class="light dl">유물</div><div class="dex">';
    ST.RELIC_ORDER.forEach(function (id) {
      var have = save.relics.indexOf(id) >= 0, r = ST.RELICS[id];
      h += '<button class="it' + (have ? '' : ' no') + (d === id ? ' cur' : '') + '" ' + (have ? 'data-a="dexsel" data-id="' + id + '"' : 'disabled') + '>' + img(r.sprite) +
        '<span class="nm">' + (have ? r.name : '?') + '</span></button>';
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
    else if (V.name === 'ending') h = vEnding();
    app.className = 'v-' + V.name;
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
    newBoard(bag);
  }
  // 새 판을 편다. 연습판이면 손에 들어오는 순서를 정해 둔다.
  function newBoard(bag) {
    G = ST.newGame(Q, bag, draft.relics, (Date.now() % 100000) + 1);
    tut = null;
    if (isTut()) {
      var order = ST.TUTOR.order.slice(), rest = bag.slice(), ok = true;
      order.forEach(function (id) { var k = rest.indexOf(id); if (k < 0) ok = false; else rest.splice(k, 1); });
      if (ok && !rest.length) {
        G.hand = order.splice(0, G.handSize); G.bag = order;
        tut = { pre: 0, ack: false };
      }
    }
    hist = []; sel = null; fx = null;
    go('build');
  }

  function judge() {
    var ev = ST.evaluate(G, Q);
    var r = { ev: ev, first: false, got: [], left: [], toPick: 0, tut: !!tut && isTut(), sel: [], before: [], gift: false, grew: false };
    if (ev.base) {
      var prev = save.stars[Q.id] || 0;
      r.first = prev === 0;
      var newStars = Math.max(0, ev.stars - prev);
      save.stars[Q.id] = Math.max(prev, ev.stars);
      var picked = save.picks[Q.id] || (save.picks[Q.id] = []);
      r.before = picked.slice();
      r.grew = newStars > 0;
      Q.rewards.forEach(function (_, i) { if (picked.indexOf(i) < 0) r.left.push(i); });
      r.toPick = Math.min(newStars, r.left.length);
      if (r.toPick && r.toPick === r.left.length) {
        r.left.slice().forEach(function (i) { grant(i, r); });
      }
      r.gift = r.toPick > 0 || r.got.length > 0;
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
      save = fresh(v); persist();
      Q = ST.QUESTS[0]; go('intro', { i: 0 });
    },
    pronext: function () { V.i = Math.min(V.i + 1, ST.TEXT.prologue.length - 1); render(); window.scrollTo(0, 0); },
    proback: function () { V.i = Math.max(V.i - 1, 0); render(); },
    proskip: function () { V.i = ST.TEXT.prologue.length - 1; render(); },
    intronext: function () { V.i++; render(); window.scrollTo(0, 0); },
    introback: function () { V.i = Math.max(V.i - 1, 0); render(); },
    introskip: function () { V.i = introCuts(Q).length; render(); },
    story: function () { V.i = 0; render(); },
    tutgo: function () { makeDraft(); startGame(); },
    ending: function () { go('ending'); },
    tip: function () { V.tip = !V.tip; render(); },
    pinfo: function (d) { V.info = V.info === d.id ? null : d.id; render(); },
    rnext: function () { V.pg = (V.pg || 0) + 1; render(); window.scrollTo(0, 0); },
    tnext: function () {
      if (!tut) return;
      if (tut.pre < ST.TUTOR.pre.length) tut.pre++; else tut.ack = true;
      render();
    },
    map: function () { go('map'); },
    dex: function () { go('dex', { sel: null }); },
    dexsel: function (d) { V.sel = d.id; render(); },
    reset: function () {
      if (window.confirm('모은 조각과 별이 전부 사라집니다. 처음부터 다시 할까요?')) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        save = null; go('start', { i: 0 });
      }
    },
    // 이미 끝낸 의뢰는 이야기를 건너뛰고 조건부터 보여 준다
    intro: function (d) {
      Q = quest(d.q);
      go('intro', { i: (save.stars[Q.id] || 0) > 0 || d.skip ? introCuts(Q).length : 0 });
    },
    pack: function () { makeDraft(); go('pack'); },
    more: function (d) {
      V.info = d.id;
      if (draftCount() < limit() && (draft.bag[d.id] || 0) < (save.coll[d.id] || 0)) draft.bag[d.id] = (draft.bag[d.id] || 0) + 1;
      render();
    },
    less: function (d) { V.info = d.id; if (draft.bag[d.id]) draft.bag[d.id]--; render(); },
    relic: function (d) {
      V.info = d.id;
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
    card: function (d) {
      var ts = tutStep();
      if (ts && !ts.free && (ts.wait || G.hand[+d.k] !== ts.need)) return;
      sel = sel === +d.k ? null : +d.k; render();
    },
    cell: function (d) {
      if (sel === null || G.over) return;
      var i = +d.i, snap = JSON.stringify(G), ts = tutStep();
      if (ts && !ts.free && (!ts.cells || ts.cells.indexOf(i) < 0)) return;
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
      newBoard(bag.concat(Q.lend));
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
    // 보상 고르기: 눌러서 고르고, 다시 누르면 뺀다. 하나만 고를 때는 다른 것을 누르면 바뀐다
    take: function (d) {
      var r = result, i = +d.i, k = r.sel.indexOf(i);
      if (r.toPick <= 0) return;
      if (k >= 0) r.sel.splice(k, 1);
      else { if (r.sel.length >= r.toPick) r.sel.shift(); r.sel.push(i); }
      render();
    },
    confirm: function () {
      var r = result;
      if (r.toPick <= 0 || r.sel.length !== r.toPick) return;
      r.sel.slice().forEach(function (i) { grant(i, r); });
      r.sel = [];
      render();
    },
    // 방금 별이 늘었으면 지도에서 그 구역 건물이 올라오는 모습을 보여 준다
    mapnew: function () { go('map', result && result.grew ? { fresh: Q.id } : null); }
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
