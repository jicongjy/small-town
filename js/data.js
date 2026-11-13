// 게임 내용물. 조각, 유물, 의뢰, 대사가 전부 여기 있다. 숫자를 고치려면 이 파일만 고치면 된다.
(function (root) {
  var ST = (root.ST = root.ST || {});

  ST.RES = {
    grain: { name: '곡식', icon: 'i_grain' },
    bread: { name: '빵', icon: 'i_bread' },
    people: { name: '주민', icon: 'i_people' },
    gold: { name: '금화', icon: 'i_gold' }
  };
  ST.RES_ORDER = ['grain', 'bread', 'people', 'gold'];

  ST.PIECES = {
    field: { name: '밭', cat: '생산', desc: '곡식 1. 우물 옆이면 2', memo: '기본이다. 기본을 무시하는 놈이 꼭 굶는다.' },
    orchard: { name: '과수원', cat: '생산', desc: '놓을 때 비어 있는 옆 칸마다 금화 1', memo: '나무는 넓은 데 심어라. 사람도 그렇다.' },
    fishing: { name: '낚시터', cat: '생산', desc: '물가(강, 우물) 옆이면 금화 3', memo: '물 없는 데 낚시터 지은 놈을 내가 하나 안다. 네 할아버지다.' },
    bakery: { name: '빵집', cat: '가공', desc: '옆 밭 하나당 빵 2', memo: '밀도 없이 빵집부터 짓지 마라. 밀순이처럼 된다.' },
    mill: { name: '방앗간', cat: '가공', desc: '같은 가로줄의 밭 하나당 곡식 1', memo: '바람은 옆으로 분다. 그래서 줄을 맞추는 거다.' },
    brewery: { name: '양조장', cat: '가공', desc: '옆 과수원 하나당 금화 3. 옆에 사람 사는 건물이 있어야 한다', memo: '술은 마실 사람이 있어야 빚는다.' },
    house: { name: '집', cat: '주거', desc: '주민 1. 옆 집 하나당 +1', memo: '집은 붙여 지어라. 싸워도 붙어 살아야 정이 든다.' },
    inn: { name: '여관', cat: '주거', desc: '옆에 있는 서로 다른 건물 종류마다 주민 1', memo: '구경거리가 많아야 손님이 온다.' },
    tower: { name: '망루', cat: '주거', desc: '주민 3. 옆에 사람 사는 건물이 있으면 1', memo: '망루지기는 원래 혼자 있고 싶어서 올라간 사람이다.' },
    well: { name: '우물', cat: '특수', desc: '옆 밭의 곡식을 2로. 나중에 놓는 밭에도 적용', memo: '한가운데 파라. 30년 걸려 깨달은 거다.' },
    plaza: { name: '광장', cat: '특수', desc: '옆 주거 건물의 주민 +1. 나중에 놓는 것에도 적용', memo: '사람은 모일 데가 있어야 모인다.' },
    bell: { name: '종탑', cat: '특수', desc: '놓는 순간 옆 건물을 전부 한 번 더 발동', memo: '종은 맨 나중에 달아라. 먼저 달면 들을 사람이 없다.' }
  };
  ST.PIECE_ORDER = ['field', 'orchard', 'fishing', 'bakery', 'mill', 'brewery', 'house', 'inn', 'tower', 'well', 'plaza', 'bell'];
  ST.DWELL = { house: 1, inn: 1, tower: 1 };

  ST.RELICS = {
    compass: { name: '낡은 나침반', sprite: 'r_compass', desc: '모서리 네 칸에 놓은 건물은 내는 것이 2배', lore: '바늘이 북쪽이 아니라 늘 구석을 가리킨다.' },
    dawnbell: { name: '새벽 종', sprite: 'r_dawnbell', desc: '그 판에서 처음 놓는 조각이 두 번 발동', lore: '할머니가 손주를 깨우던 종. 지금 들어도 벌떡 일어나게 된다.' },
    magnifier: { name: '돋보기', sprite: 'r_magnifier', desc: '손에 조각이 4개 들어온다', lore: '할머니는 눈이 좋다. 남의 설계 흠잡을 때만 꺼냈다.' },
    pencil: { name: '몽당연필', sprite: 'r_pencil', desc: '판마다 한 번, 손에 든 조각을 전부 다시 뽑는다', lore: '지우개 쪽이 더 닳아 있다.' },
    carrot: { name: '당근 주머니', sprite: 'r_carrot', desc: '짐을 하나 더 실을 수 있다', lore: '두부가 조각 하나를 더 실어 주는 유일한 방법.' }
  };
  ST.RELIC_ORDER = ['compass', 'dawnbell', 'magnifier', 'pencil', 'carrot'];

  // 처음 가진 조각
  ST.START = { field: 3, house: 2, bakery: 1, well: 1, orchard: 1 };

  // 의뢰. terrain의 번호는 칸 번호(윗줄 왼쪽이 0, 아랫줄 오른쪽이 24).
  ST.QUESTS = [
    {
      id: 'q1', road: ["노트 첫 장. 지도 위에 빵 그림이 그려진 마을이 있다.", "두부는 출발하기 전에 당근 세 개를 요구했다. 두 개로 깎았다."], who: '제빵사 밀순', portraits: ['baker'], title: '밀밭 없는 빵집',
      intro: [
        '봉 선생님 손주라고요? 선생님은 안 오시고요?',
        '뭐, 좋아요. 저는 빵집을 열었는데 마을에 밀밭이 하나도 없어요.',
        '3년째 옆 마을에서 밀가루를 꾸어다 쓰는데, 이제 그쪽에서 저만 보면 문을 닫아요.'
      ],
      rule: null, ruleText: '', ground: 'day',
      terrain: { 4: 'tree', 20: 'pine' },
      lend: [], limit: 8,
      goals: [{ r: 'bread', n: 4 }],
      bonus: [{ r: 'bread', n: 6 }, { r: 'people', n: 3 }],
      tip: '빵집부터 짓는 놈이 어딨냐. 밀이 있어야 빵을 굽지. 밭을 먼저 놓고, 빵집은 그 옆에 나중에 놓아라.',
      win: ['밀이다! 우리 마을 밀이야!', '첫 빵은 두부 줄게요. 아니, 당신도 줄게요.'],
      fail: '빵이 모자라요. 저 또 옆 마을에 가야 하나요?',
      card: '잘했다. 처음치고는. 나는 지금 유황 온천에 있다. 달걀을 삶아 먹었는데 네 설계보다 훨씬 잘 익었다.',
      rewards: [{ p: 'mill' }, { r: 'dawnbell' }, { p: 'field' }]
    },
    {
      id: 'q2', road: ["밀순이 싸 준 빵을 먹으며 고개를 넘었다. 두부가 절반을 먹었다.", "노트 둘째 장에는 마을 한가운데 굵은 줄이 그어져 있고, 옆에 작게 '내 잘못'이라고 적혀 있다."], who: '쌍둥이 자매', portraits: ['twinA', 'twinB'], title: '20년 된 담',
      intro: [
        '언니: 가운데 담은 건드리지 마세요. 20년 된 담이에요.',
        '동생: 그리고 저쪽이 우리보다 한 명이라도 많으면 안 돼요.',
        '언니: 그건 이쪽도 마찬가지야.',
        '(둘이 집을 한 채씩 들고 왔다.)'
      ],
      rule: 'wall', ruleText: '가운데 줄에는 못 짓는다. 담 왼쪽과 오른쪽의 주민 수 차이가 1 이하여야 한다', ground: 'day',
      terrain: { 2: 'wall', 7: 'wall', 12: 'wall', 17: 'wall', 22: 'wall' },
      lend: ['house', 'house'], limit: 8,
      goals: [{ r: 'people', n: 4 }, { t: 'balance' }],
      bonus: [{ r: 'people', n: 6 }, { r: 'bread', n: 4 }],
      tip: '집은 붙여 지어라. 한 채는 1명이지만 붙이면 식구가 는다. 양쪽을 똑같이 맞추는 게 요령이다.',
      win: ['언니: 저쪽 집 지붕 색이 우리랑 똑같네.', '동생: 언니가 따라 한 거잖아.', '(20년 만에 나눈 첫 대화였다.)'],
      fail: '한쪽이 더 많잖아요! 이러면 20년 더 싸워요.',
      card: '그 둘은 내가 갔을 때도 싸우고 있었다. 그 담을 쌓아 준 게 나다. 미안하다고 전해라. 아니다, 전하지 마라. 여기는 노천탕인데 원숭이가 내 수건을 가져갔다.',
      rewards: [{ p: 'plaza' }, { p: 'inn' }, { r: 'compass' }]
    },
    {
      id: 'q3', road: ["등 뒤에서 쌍둥이가 담 너머로 서로 잔소리하는 소리가 들린다. 싸우는 소리보다는 듣기 좋다.", "셋째 장에는 물고기 그림과 함께 이렇게 적혀 있다. '이 영감 외로움. 본인은 모름.'"], who: '낚시꾼 영감', portraits: ['fisher'], title: '조용한 물가',
      intro: [
        '쉿. 물고기 놀란다.',
        '낚시터 옆에는 집 짓지 마. 사람 소리 나면 입질이 뚝 끊겨.',
        '혼자가 편해. 정말이야. 누가 물어봤냐고? 아무도 안 물어봤지.',
        '(영감이 낚시터 둘과 낡은 여관 하나를 내놓았다.)'
      ],
      rule: 'quiet', ruleText: '낚시터 옆에는 집을 지을 수 없다 (여관과 망루는 된다)', ground: 'day',
      terrain: { 10: 'water', 11: 'water', 12: 'water', 4: 'tree', 24: 'rock' },
      lend: ['fishing', 'fishing', 'inn'], limit: 8,
      goals: [{ r: 'gold', n: 6 }, { r: 'people', n: 4 }],
      bonus: [{ r: 'gold', n: 9 }, { t: 'adj', a: 'inn', b: 'fishing' }],
      tip: '낚시터는 물가에 붙여야 돈이 된다. 영감은 집은 싫다 했지만 여관은 싫다고 안 했다.',
      win: ['여관 손님이 낚시를 좀 하더군.', '말이 많아. 시끄러워.', '내일 또 오라고 했네.'],
      fail: '이래서는 낚싯밥 값도 안 나와.',
      card: '그 영감 아직도 한 마리도 못 잡았지? 30년째다. 나는 족욕탕에서 발가락으로 물고기를 잡았다. 농담이다. 물고기가 나를 잡았다.',
      rewards: [{ p: 'fishing' }, { p: 'tower' }, { r: 'magnifier' }]
    },
    {
      id: 'q4', road: ["영감이 고맙다며 준 물고기를 두부가 거절했다. 눈이 내리기 시작한다.", "넷째 장은 반쯤 찢겨 있고 라면 국물 자국이 있다. 남은 글씨는 '우물'뿐이다."], who: '양조장 주인', portraits: ['brewer'], title: '한겨울의 술 주문',
      intro: [
        '에취! 봄 축제가 석 달 남았는데 술이 한 통도 없어요.',
        '왜 겨울에 왔냐고요? 가을에는 제가 바빴어요. 술 마시느라.',
        '(양조장 하나와 과수원 하나를 내놓았다.)'
      ],
      rule: 'winter', ruleText: '겨울이라 밭은 우물 옆에서만 자란다', ground: 'snow',
      terrain: { 0: 'rock', 8: 'pine', 24: 'rock' },
      lend: ['brewery', 'orchard'], limit: 8,
      goals: [{ r: 'gold', n: 10 }, { r: 'grain', n: 4 }],
      bonus: [{ r: 'gold', n: 14 }, { r: 'grain', n: 6 }],
      tip: '겨울 밭은 우물 옆에서만 자란다. 우물 하나에 밭을 여럿 붙여라. 양조장은 옆에 사람이 살아야 돌아간다.',
      win: ['됐다! 이제 석 달 동안 맛만 보면 됩니다.', '맛보는 것도 일이에요.'],
      fail: '이걸로는 한 통도 못 빚어요. 에취!',
      card: '겨울에 밭 가는 법은 내가 그 노트 23쪽에 적어 놨다. 23쪽은 내가 라면 받침으로 써서 없을 거다. 여기는 눈 내리는 온천이다. 머리는 춥고 몸은 뜨겁다. 인생이 그렇다.',
      rewards: [{ p: 'brewery' }, { p: 'orchard' }, { r: 'pencil' }]
    },
    {
      id: 'q5', road: ["양조장 주인이 술 한 병을 실어 주었다. 두부가 무겁다며 한 발도 안 움직여서 내가 들었다.", "노트 마지막 장. '여기까지 왔으면 알 거다. 나는 못 끝낸 게 아니다.'"], who: '이장님', portraits: ['chief'], title: '예산은 마음속에',
      intro: [
        '어서 오게! 우리 마을에 필요한 건 딱 네 가지야. 곡식, 빵, 사람, 돈.',
        '예산? 예산은 마음속에 있지. 조각은 여섯 개만 쓰게.',
        '아, 그리고 광장에는 봉 선생 동상을 세울 걸세.'
      ],
      rule: 'six', ruleText: '짐을 6개만 가져갈 수 있다', ground: 'day',
      terrain: { 10: 'water', 11: 'water', 13: 'water', 14: 'water', 4: 'rock' },
      lend: [], limit: 6,
      goals: [{ r: 'grain', n: 2 }, { r: 'bread', n: 4 }, { r: 'people', n: 2 }, { r: 'gold', n: 3 }],
      bonus: [{ r: 'gold', n: 6 }, { r: 'people', n: 5 }],
      tip: '여섯 개로 네 가지를 다 채워야 한다. 한 조각이 두 가지 일을 하게 놓아라. 밭은 빵집에도 쓰이고 곡식도 낸다.',
      win: ['여섯 개로 이걸 다! 역시 봉 선생 핏줄이야.', '동상은 자네 것도 하나 세우지.'],
      fail: '허허, 이래서는 군청에 보고를 못 하네.',
      card: '동상 세우면 가만 안 둔다. 코를 크게 만들 게 뻔하다. 그리고 다음 골짜기 노트는 두부 안장 밑에 있다. 두부한테 당근 주고 꺼내라. 그냥 꺼내면 문다.',
      rewards: [{ p: 'bell' }, { r: 'carrot' }, { p: 'house' }]
    }
  ];

  ST.TEXT = {
    title: '작은 마을 설계',
    note: ['못 끝낸 의뢰가 좀 있다.', '네가 해라. 나는 바쁘다.', '짐은 두부가 진다. 8개까지만 싣는다. 그 이상은 죽어도 안 싣는다.', '밥은 먹고 다녀라.'],
    ending: ['첫 번째 골짜기의 의뢰를 모두 끝냈다.', '노트 맨 뒷장에 할머니 글씨가 있다. "의뢰는 핑계였다. 네가 이 사람들을 만났으면 했다."', '두부 안장 밑에서 두 번째 노트가 나왔다. 표지에 이렇게 적혀 있다.', '"다음 골짜기는 좀 어렵다. 준비되면 와라."', '(다음 골짜기는 준비 중입니다.)']
  };

  ST.goalText = function (g) {
    if (g.r) return ST.RES[g.r].name + ' ' + g.n + ' 이상';
    if (g.t === 'balance') return '담 양쪽 주민 수 차이 1 이하';
    if (g.t === 'adj') return ST.PIECES[g.a].name + '을 ' + ST.PIECES[g.b].name + ' 옆에 짓기';
    return '';
  };
})(typeof window !== 'undefined' ? window : globalThis);
