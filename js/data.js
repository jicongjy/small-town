// 게임 내용물. 조각, 유물, 의뢰, 대사가 전부 여기 있다. 숫자를 고치려면 이 파일만 고치면 된다.
(function (root) {
  var ST = (root.ST = root.ST || {});

  ST.RES = {
    grain: { name: '곡식', unit: '개', icon: 'i_grain' },
    bread: { name: '빵', unit: '개', icon: 'i_bread' },
    people: { name: '주민', unit: '명', icon: 'i_people' },
    gold: { name: '금화', unit: '개', icon: 'i_gold' }
  };
  ST.RES_ORDER = ['grain', 'bread', 'people', 'gold'];

  ST.PIECES = {
    field: { name: '밭', cat: '생산', desc: '곡식 1개. 우물 옆이면 2개', memo: '밭이 기본이야. 기본 우습게 보는 놈이 꼭 굶더라.' },
    orchard: { name: '과수원', cat: '생산', desc: '놓을 때 비어 있는 옆 칸마다 금화 1개', memo: '나무는 널찍한 데 심어. 사람도 그래.' },
    fishing: { name: '낚시터', cat: '생산', desc: '물가(강, 우물) 옆이면 금화 3개', memo: '물도 없는 데 낚시터 지은 양반을 내가 하나 알지. 네 할아버지야.' },
    bakery: { name: '빵집', cat: '가공', desc: '옆 밭 하나마다 빵 2개', memo: '밀도 없이 빵집부터 짓지 마. 밀순이 꼴 난다.' },
    mill: { name: '방앗간', cat: '가공', desc: '같은 가로줄의 밭 하나마다 곡식 1개', memo: '바람은 옆으로 불잖니. 그래서 줄을 맞추는 거야.' },
    brewery: { name: '양조장', cat: '가공', desc: '옆 과수원 하나마다 금화 3개. 옆에 사람 사는 건물이 있어야 한다', memo: '술은 마실 사람이 있어야 빚는 거야.' },
    house: { name: '집', cat: '주거', desc: '주민 1명. 옆 집 하나마다 1명 더', memo: '집은 붙여 지어. 싸워도 붙어살아야 정이 들지.' },
    inn: { name: '여관', cat: '주거', desc: '옆에 있는 서로 다른 건물 종류마다 주민 1명', memo: '구경거리가 많아야 손님이 오지.' },
    tower: { name: '망루', cat: '주거', desc: '주민 3명. 옆에 사람 사는 건물이 있으면 1명', memo: '망루지기는 원래 혼자 있고 싶어서 올라간 사람이야.' },
    well: { name: '우물', cat: '특수', desc: '옆 밭의 곡식을 2개로. 나중에 놓는 밭에도 적용', memo: '우물은 한가운데 파. 이거 깨닫는 데 30년 걸렸다.' },
    plaza: { name: '광장', cat: '특수', desc: '옆 주거 건물마다 주민 1명 더. 나중에 놓는 것에도 적용', memo: '사람은 모일 데가 있어야 모여.' },
    bell: { name: '종탑', cat: '특수', desc: '놓는 순간 옆 건물을 전부 한 번 더 발동', memo: '종은 맨 나중에 달아. 먼저 달면 들을 사람이 없잖니.' }
  };
  // 날짜 규칙에서 쓰는 조각 설명(건물이 매일 밤 일한다)
  var DAILY = {
    field: '밤마다 곡식 1개. 우물 옆이면 2개',
    orchard: '밤마다 금화 1개. 옆에 빈 칸이 2개 넘게 있으면 2개',
    fishing: '물가(강, 우물) 옆이면 밤마다 금화 2개',
    bakery: '밤마다 옆 밭 하나마다 빵 1개',
    mill: '밤마다 같은 가로줄의 밭 하나마다 곡식 1개',
    brewery: '밤마다 옆 과수원 하나마다 금화 2개. 옆에 사람 사는 건물이 있어야 한다',
    house: '주민 1명. 옆 집 하나마다 1명 더. 주민은 밤마다 금화 1개씩 낸다',
    inn: '옆에 있는 서로 다른 건물 종류마다 주민 1명',
    tower: '주민 3명. 옆에 사람 사는 건물이 있으면 1명',
    well: '옆 밭이 밤마다 곡식을 2개씩 낸다',
    plaza: '옆 주거 건물마다 주민 1명 더',
    bell: '옆 건물이 밤마다 한 번 더 일한다'
  };
  for (var dk in DAILY) ST.PIECES[dk].daily = DAILY[dk];
  // 카드 겉면의 한 줄 요약(날짜 규칙). when은 조건, res는 내는 자원, n은 양. 자세한 글은 꾹 눌러야 나온다.
  var TAG = {
    field: { res: 'grain', n: '+1' },
    orchard: { res: 'gold', n: '+1' },
    fishing: { when: '물가 옆', res: 'gold', n: '+2' },
    bakery: { when: '옆 밭마다', res: 'bread', n: '+1' },
    mill: { when: '같은 줄 밭마다', res: 'grain', n: '+1' },
    brewery: { when: '옆 과수원마다', res: 'gold', n: '+2' },
    house: { res: 'people', n: '+1' },
    inn: { when: '옆 건물 종류마다', res: 'people', n: '+1' },
    tower: { res: 'people', n: '+3' },
    well: { when: '옆 밭', res: 'grain', n: '×2' },
    plaza: { when: '옆 집마다', res: 'people', n: '+1' },
    bell: { when: '옆 건물', text: '한 번 더' }
  };
  for (var tk in TAG) ST.PIECES[tk].tag = TAG[tk];
  ST.PIECE_ORDER = ['field', 'orchard', 'fishing', 'bakery', 'mill', 'brewery', 'house', 'inn', 'tower', 'well', 'plaza', 'bell'];
  ST.DWELL = { house: 1, inn: 1, tower: 1 };

  ST.RELICS = {
    compass: { name: '낡은 나침반', sprite: 'r_compass', desc: '모서리 네 칸에 놓은 건물은 내는 것이 2배', lore: '바늘이 북쪽 말고 자꾸 구석만 가리킨다. 고장인 줄 알았는데 아니었다.' },
    dawnbell: { name: '새벽 종', sprite: 'r_dawnbell', desc: '그 판에서 처음 놓는 조각이 두 번 발동', lore: '할머니가 아침마다 나를 깨우던 종. 지금 들어도 몸이 먼저 일어난다.' },
    magnifier: { name: '돋보기', sprite: 'r_magnifier', desc: '손에 조각이 4개 들어온다', lore: '할머니는 눈이 좋다. 이건 남의 설계 흠잡을 때만 꺼내셨다.' },
    pencil: { name: '몽당연필', sprite: 'r_pencil', desc: '판마다 한 번, 손에 든 조각을 전부 다시 뽑는다', lore: '연필보다 지우개 쪽이 더 닳았다. 할머니도 많이 지우셨구나.' },
    carrot: { name: '당근 주머니', sprite: 'r_carrot', desc: '짐을 하나 더 실을 수 있다', lore: '당근 먹는 동안에는 두부가 세는 걸 까먹는다.' }
  };
  ST.RELIC_ORDER = ['compass', 'dawnbell', 'magnifier', 'pencil', 'carrot'];

  // 처음 가진 조각
  ST.START = { field: 3, house: 2, bakery: 1, well: 1, orchard: 1 };

  // 의뢰. terrain의 번호는 칸 번호(윗줄 왼쪽이 0, 아랫줄 오른쪽이 24).
  ST.QUESTS = [
    {
      id: 'q1', road: ["노트 첫 장을 폈다. 지도 위에 빵 그림이 그려진 마을이 있네.", "두부가 출발 전에 당근 세 개를 내놓으라고 버텼다. 두 개로 깎았다. 벌써 피곤하다."], who: '제빵사 밀순', portraits: ['baker'], title: '밀밭 없는 빵집',
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
      // 날짜 규칙: 닷새마다 장날. quota는 장날마다 가져가는 빵, pool은 장날 뒤에 고를 수 있는 조각,
      // events는 주 중간에 생기는 일(아래 ST.EVENTS), bonus는 별을 더 받는 조건(left 끝났을 때 남은 빵, people 주민 수)
      days: { perWeek: 5, quota: [5, 20, 45], pool: ['field', 'house', 'bakery', 'well', 'orchard', 'mill', 'inn', 'plaza', 'tower'],
        events: ['parcel', 'donkey', 'neighbor', 'rain', 'peddler', 'crow'], bonus: [{ t: 'left', n: 25 }, { t: 'people', n: 6 }] },
      tip: '건물은 매일 밤 일한다. 일찍 지을수록 오래 벌어. 빵집은 밭 사이에 끼워야 빵이 많이 나온다. 주민은 밤마다 금화를 내고, 금화 3개는 빵 1개 값이다.',
      win: ['밀이다! 우리 마을 밀이야!', '첫 빵은 두부 줄게요. 아니, 당신도 줄게요.'],
      fail: '빵이 모자라요. 저 또 옆 마을에 가야 하나요?',
      card: '잘했다. 처음치고는 말이야. 할미는 지금 유황 온천이다. 달걀을 삶아 먹었는데 네 설계보다 훨씬 잘 익었더라.',
      rewards: [{ p: 'mill' }, { r: 'dawnbell' }, { p: 'field' }]
    },
    {
      id: 'q2', road: ["밀순 씨가 싸 준 빵을 먹으면서 고개를 넘었다. 절반은 두부가 먹었다.", "노트 둘째 장. 마을 한가운데에 굵은 줄이 죽 그어져 있고, 옆에 작게 '내 잘못'이라고 적혀 있다. 뭐지?"], who: '쌍둥이 자매', portraits: ['twinA', 'twinB'], title: '20년 된 담',
      intro: [
        '언니: 가운데 담은 건드리지 마세요. 20년 된 담이에요.',
        '동생: 그리고 저쪽이 우리보다 한 명이라도 많으면 안 돼요.',
        '언니: 그건 이쪽도 마찬가지야.',
        '(둘이 집을 한 채씩 들고 왔다.)'
      ],
      rule: 'wall', ruleText: '가운데 줄(담)에는 못 지어요. 담 왼쪽과 오른쪽 주민 수가 1명 넘게 차이 나면 안 돼요', ground: 'day',
      terrain: { 2: 'wall', 7: 'wall', 12: 'wall', 17: 'wall', 22: 'wall' },
      lend: ['house', 'house'], limit: 8,
      goals: [{ r: 'people', n: 4 }, { t: 'balance' }],
      bonus: [{ r: 'people', n: 6 }, { r: 'bread', n: 4 }],
      tip: '집은 붙여 지어야 해. 한 채면 한 명인데 붙이면 식구가 늘거든. 양쪽을 똑같이 맞추는 게 요령이야.',
      win: ['언니: 저쪽 집 지붕 색이 우리랑 똑같네.', '동생: 언니가 따라 한 거잖아.', '(20년 만에 나눈 첫 대화였다.)'],
      fail: '한쪽이 더 많잖아요! 이러면 20년 더 싸워요.',
      card: '그 둘은 내가 갔을 때도 싸우고 있었어. 실은 그 담, 내가 쌓아 준 거다. 미안하다고 전해 다오. 아니다, 전하지 마라. 여기는 노천탕인데 원숭이가 내 수건을 들고 튀었다.',
      rewards: [{ p: 'plaza' }, { p: 'inn' }, { r: 'compass' }]
    },
    {
      id: 'q3', road: ["등 뒤에서 쌍둥이가 담 너머로 서로 잔소리하는 소리가 들린다. 싸우는 소리보다는 훨씬 듣기 좋다.", "셋째 장에는 물고기 그림이랑 이런 메모가 있다. '이 영감 외로움. 본인은 모름.'"], who: '낚시꾼 영감', portraits: ['fisher'], title: '조용한 물가',
      intro: [
        '쉿. 물고기 놀란다.',
        '낚시터 옆에는 집 짓지 마. 사람 소리 나면 입질이 뚝 끊겨.',
        '혼자가 편해. 정말이야. 누가 물어봤냐고? 아무도 안 물어봤지.',
        '(영감이 낚시터 둘과 낡은 여관 하나를 내놓았다.)'
      ],
      rule: 'quiet', ruleText: '낚시터 옆에는 집을 못 지어요. 여관과 망루는 괜찮아요', ground: 'day',
      terrain: { 10: 'water', 11: 'water', 12: 'water', 4: 'tree', 24: 'rock' },
      lend: ['fishing', 'fishing', 'inn'], limit: 8,
      goals: [{ r: 'gold', n: 6 }, { r: 'people', n: 4 }],
      bonus: [{ r: 'gold', n: 9 }, { t: 'adj', a: 'inn', b: 'fishing' }],
      tip: '낚시터는 물가에 붙여야 돈이 돼. 그리고 잘 들어 봐. 영감이 집은 싫다고 했지, 여관이 싫다고는 안 했어.',
      win: ['여관 손님이 낚시를 좀 하더군.', '말이 많아. 시끄러워.', '내일 또 오라고 했네.'],
      fail: '이래서는 낚싯밥 값도 안 나와.',
      card: '그 영감 아직도 한 마리도 못 잡았지? 30년째야. 할미는 족욕탕에서 발가락으로 물고기를 잡았다. 농담이고, 물고기가 나를 잡았어.',
      rewards: [{ p: 'fishing' }, { p: 'tower' }, { r: 'magnifier' }]
    },
    {
      id: 'q4', road: ["영감님이 고맙다고 물고기를 주셨는데 두부가 고개를 돌렸다. 어, 눈 온다.", "넷째 장은 반쯤 찢어졌고 라면 국물 자국까지 있다. 남은 글씨는 '우물' 두 글자뿐."], who: '양조장 주인', portraits: ['brewer'], title: '한겨울의 술 주문',
      intro: [
        '에취! 봄 축제가 석 달 남았는데 술이 한 통도 없어요.',
        '왜 겨울에 왔냐고요? 가을에는 제가 바빴어요. 술 마시느라.',
        '(양조장 하나와 과수원 하나를 내놓았다.)'
      ],
      rule: 'winter', ruleText: '겨울이라 밭은 우물 옆에서만 자라요', ground: 'snow',
      terrain: { 0: 'rock', 8: 'pine', 24: 'rock' },
      lend: ['brewery', 'orchard'], limit: 8,
      goals: [{ r: 'gold', n: 10 }, { r: 'grain', n: 4 }],
      bonus: [{ r: 'gold', n: 14 }, { r: 'grain', n: 6 }],
      tip: '겨울 밭은 우물 옆에서만 자라. 우물 하나에 밭을 여럿 붙여 봐. 그리고 양조장은 옆에 사람이 살아야 돌아간단다.',
      win: ['됐다! 이제 석 달 동안 맛만 보면 됩니다.', '맛보는 것도 일이에요.'],
      fail: '이걸로는 한 통도 못 빚어요. 에취!',
      card: '겨울에 밭 가는 법은 노트 23쪽에 적어 놨다. 근데 23쪽은 내가 라면 받침으로 써서 없을 거야. 여기는 눈 오는 온천이다. 머리는 춥고 몸은 뜨겁고. 사는 게 원래 그렇지.',
      rewards: [{ p: 'brewery' }, { p: 'orchard' }, { r: 'pencil' }]
    },
    {
      id: 'q5', road: ["양조장 아저씨가 술 한 병을 실어 주셨다. 두부가 무겁다고 한 발짝도 안 움직여서 결국 내가 들었다.", "노트 마지막 장이다. '여기까지 왔으면 알겠지. 나는 못 끝낸 게 아니야.'"], who: '이장님', portraits: ['chief'], title: '예산은 마음속에',
      intro: [
        '어서 오게! 우리 마을에 필요한 건 딱 네 가지야. 곡식, 빵, 사람, 돈.',
        '예산? 예산은 마음속에 있지. 조각은 여섯 개만 쓰게.',
        '아, 그리고 광장에는 봉 선생 동상을 세울 걸세.'
      ],
      rule: 'six', ruleText: '조각을 6개만 가져갈 수 있어요', ground: 'day',
      terrain: { 10: 'water', 11: 'water', 13: 'water', 14: 'water', 4: 'rock' },
      lend: [], limit: 6,
      goals: [{ r: 'grain', n: 2 }, { r: 'bread', n: 4 }, { r: 'people', n: 2 }, { r: 'gold', n: 3 }],
      bonus: [{ r: 'gold', n: 6 }, { r: 'people', n: 5 }],
      tip: '여섯 개로 네 가지를 다 채워야 해. 조각 하나가 두 가지 일을 하게 놓아 봐. 밭은 곡식도 내고 빵집도 먹여 살리잖니.',
      win: ['여섯 개로 이걸 다! 역시 봉 선생 핏줄이야.', '동상은 자네 것도 하나 세우지.'],
      fail: '허허, 이래서는 군청에 보고를 못 하네.',
      card: '동상 세우면 가만 안 둔다고 전해라. 코를 크게 만들 게 뻔해. 그리고 다음 골짜기 노트는 두부 안장 밑에 있다. 당근 주고 꺼내. 그냥 꺼내면 문다.',
      rewards: [{ p: 'bell' }, { r: 'carrot' }, { p: 'house' }]
    }
  ];

  // 조건 화면에서 의뢰인이 하는 부탁 한마디(ask), 마을에 도착하는 장면(arrive, 그림은 arriveArt), 의뢰인 소개(bio), 할머니 노트의 한 줄 평(note), 의뢰를 끝내면 노트에 드러나는 것(reveal),
  // 그 의뢰에서 처음 배우는 것(lesson. at은 훈수가 뜨는 자리: pack 짐 싸기, relic 유물 칸)
  var MORE = {
    q1: {
      ask: '닷새마다 장날이에요. 장날마다 빵을 가지러 올게요!',
      arrive: '언덕을 내려가니 빵 굽는 냄새가 난다. 그런데 밭이 하나도 안 보인다. 빵집 앞에서 누가 이쪽을 빤히 보고 있다.', arriveArt: ['bakery'],
      bio: '빵집을 연 지 3년. 밀가루는 아직도 옆 마을에서 꾸어 쓴다.',
      note: '밀순이 빵 솜씨는 이 골짜기 으뜸이다. 그런데 계획이란 걸 세워 본 적이 없는 애야. 네가 좀 도와줘라.',
      reveal: '빵집 자리를 잡아 준 사람이 할머니였다. 밭 자리는 일부러 비워 두셨다.',
      lesson: { at: 'pack', text: '짐은 네가 싸는 거야. 가진 조각 중에 두부 등에 실을 것만 골라. 여덟 개까지다. 그림을 누르면 뭐 하는 조각인지 나온다.' }
    },
    q2: {
      ask: '주민 4명이요. 대신 양쪽이 똑같아야 해요!',
      arrive: '마을 한가운데를 담이 딱 갈라놓았다. 담 양쪽에서 똑같이 생긴 두 사람이 동시에 걸어 나온다.', arriveArt: ['house', 'wall', 'house'],
      bio: '담 하나를 사이에 두고 20년째 서로 말을 안 한다.',
      note: '둘 다 고집이 황소다. 누굴 닮았는지 모르겠다. 나는 아니다.',
      reveal: '그 담을 쌓아 준 사람이 할머니였다. 노트에는 "내 잘못"이라고 적혀 있다.',
      lesson: { at: 'pack', text: '쌍둥이가 내놓은 집 두 채는 덤이야. 두부는 그건 안 세. 제 짐이 아니라나.' }
    },
    q3: {
      ask: '금화 6개, 주민 4명. 조용히 부탁하네.',
      arrive: '강가에 낚싯대 하나, 영감님 한 분. 옆에는 손님 없는 낡은 여관이 있다. 살금살금 다가갔다.', arriveArt: ['fishing', 'inn'],
      bio: '30년째 한 마리도 못 잡았다. 그래도 혼자가 편하다고 한다.',
      note: '30년째 빈 낚싯대다. 그래도 놀리지는 마라. 삐지면 오래간다.',
      reveal: '저 낡은 여관, 할머니가 30년 전에 지어 준 거였다. 손님은 한 번도 든 적이 없다.',
      lesson: { at: 'relic', text: '유물은 두부 안장 주머니에 넣는 거야. 딱 두 칸이다. 땅에 놓는 게 아니고, 넣어만 두면 그 판 내내 힘을 써.' }
    },
    q4: {
      ask: '금화 10개에 곡식 4개요. 에취!',
      arrive: '온 마을이 눈밭이다. 굴뚝에서 김이 나는 집은 양조장 하나뿐. 그 문이 벌컥 열렸다.', arriveArt: ['brewery'],
      bio: '봄 축제가 석 달 남았는데 술이 한 통도 없다.',
      note: '술맛 하나는 기가 막힌다. 문제는 본인이 다 마신다는 거지. 창고부터 확인해라.',
      reveal: '할머니는 해마다 봄 축제 때 여기로 술을 받으러 오셨다. 올해는 못 온다는 걸 미리 아셨던 거다.'
    },
    q5: {
      ask: '곡식, 빵, 사람, 돈. 딱 네 가지만 부탁하네!',
      arrive: '골짜기 끝에 제일 큰 마을이 있다. 입구에서부터 누가 두 팔을 벌리고 달려온다.', arriveArt: ['house', 'house'],
      bio: '필요한 건 네 가지. 예산은 마음속에만 있다.',
      note: '말이 길다. 그래도 끝까지 들어 줘라. 내 첫 손님이었다.',
      reveal: '여기가 할머니가 맨 처음 지은 마을이었다. 그때도 조각은 여섯 개뿐이었다고 한다.'
    }
  };
  ST.QUESTS.forEach(function (q) { for (var k in MORE[q.id]) q[k] = MORE[q.id][k]; });

  // 튜토리얼. 의뢰와 따로, 떠나기 전에 할머니 집 마당에서 한 번 놓아 본다. 안내 글은 할머니가 노트 첫 장에 미리 적어 둔 글이다.
  // quest는 튜토리얼의 땅과 목표(의뢰와 같은 모양), rewards는 튜토리얼을 끝내면 받는 것.
  // order는 손에 들어오는 순서, cells는 밭 둘과 빵집을 놓을 칸 번호.
  ST.TUTOR = {
    quest: {
      id: 't0', who: '튜토리얼', title: '할머니 집 마당', portraits: ['grandma'],
      rule: null, ruleText: '', ground: 'day', terrain: { 4: 'tree', 20: 'pine' },
      lend: [], limit: 8,
      goals: [{ r: 'bread', n: 4 }], bonus: [{ r: 'people', n: 3 }],
      tip: '', rewards: [{ p: 'house' }]
    },
    order: ['field', 'field', 'bakery', 'house', 'house', 'field', 'well', 'orchard'],
    cells: { field1: 11, field2: 13, bakery: 12 },
    pre: [
      { text: '떠나기 전에 마당에서 한번 놓아 보고 가. 겁먹을 것 없다. 할미도 처음에는 닭장을 거꾸로 지었어.' },
      { focus: 'res', text: '반짝이는 네 칸 보이지? 곡식, 빵, 주민, 금화야. 건물을 지으면 이 숫자가 올라가. 오늘 목표는 빵 4개를 만드는 거다. "빵 0 / 4"가 "4 / 4"가 되면 성공이야.' },
      { focus: 'board', text: '가운데가 땅이고. 오늘은 우리 집 마당이다.' },
      { focus: 'hand', text: '아래에 있는 게 두부가 내려 준 조각이야.' }
    ],
    field1: '빵집부터 덜컥 짓는 놈이 꼭 있어. 밀도 없이 말이야. 너는 그러지 마라. 밭 조각을 집어서 반짝이는 칸에 내려놓아 봐.',
    field2: '봐라, 진짜 밭이 됐지? 하나 더 놓자. 이번에는 한 칸 띄고. 가운데는 비워 둬. 거기 들어올 게 있거든.',
    bakery: '이제 빵집 차례다. 내려놓기 전에 가운데 칸에 뜬 숫자부터 봐. 놓기 전에 한 번 보는 버릇이 30년 치 실수를 줄여 준다.',
    why: '빵 냄새 나지? 건물은 서는 순간에 딱 한 번, 위아래랑 양옆 칸만 둘러봐. 옆에 밭이 둘이라 빵이 4개 나온 거야. 빵집부터 놓았으면 둘러봐도 아무것도 없었겠지.',
    house1: '빵 4개를 채웠으니 할 일은 끝났어. 위에 별 붙은 건 추가 목표야. 안 해도 되는데, 하면 선물을 더 받지. "주민 3명"을 해 보자. 집을 한 채 지어 봐. 자리는 네가 골라.',
    house2: '한 채 더. 이번에는 그 집 옆에 붙여서 지어. 싸워도 붙어살아야 정이 들거든.',
    free: '남은 조각은 네 마음대로 놓아 봐. 잘못 놓았으면 되돌리면 돼. 흉볼 사람 없다. 할미 빼고. 다 놓았으면 아래 단추를 눌러.',
    end: '됐다, 그만하면 됐어. 이제 진짜 의뢰다. 첫 집은 밀순이네야. 빵집만 있고 밭이 없지. 방금 한 대로만 하면 돼. 상자에 집 한 채 더 넣어 놨으니 가져가라.'
  };

  // 지도: 첫 번째 골짜기의 마을 그림. 가로 9칸, 세로 13칸.
  // base의 글자: T 나무, p 소나무, r 바위, = 흙길, ~ 강, # 다리, . 풀밭
  // 의뢰마다 구역이 있다. always는 처음부터 있는 것(의뢰인이 원래 가진 건물),
  // build는 [줄, 칸, 조각, 필요한 별 수]. 별을 모을수록 건물이 늘어난다.
  // box는 누르는 범위[위, 왼쪽, 아래, 오른쪽], label은 이름표 자리, me는 손주가 서는 줄,
  // walk는 [인물, 줄, 걷기 시작하는 칸, 끝나는 칸].
  ST.VALLEY = {
    cols: 9, rows: 13,
    base: [
      'TpTpTpTpT',
      'p...=...T',
      'T...=...p',
      'p.T.=...T',
      'T...=...p',
      'p...=...T',
      '~~~~#~~~~',
      'T...=...p',
      'p...=...T',
      'T...=...p',
      'p...=...T',
      'T...=..rp',
      'pTpT=TpTp'
    ],
    areas: {
      q1: { box: [9, 1, 11, 3], label: [8, 2], me: 10, always: [[10, 3, 'bakery']],
        build: [[10, 2, 'field', 1], [9, 3, 'field', 1], [11, 2, 'house', 2], [11, 3, 'house', 2], [9, 2, 'field', 3], [10, 1, 'well', 3]],
        walk: [['baker', 10, 1.2, 3]] },
      q2: { box: [7, 5, 9, 7], label: [10, 6], me: 8, always: [[7, 6, 'wall'], [8, 6, 'wall']],
        build: [[8, 5, 'house', 1], [8, 7, 'house', 1], [7, 5, 'house', 2], [7, 7, 'house', 2], [9, 6, 'plaza', 3]],
        walk: [['twinA', 9, 5, 5.5], ['twinB', 9, 6.5, 7]] },
      q3: { box: [5, 1, 7, 3], label: [4, 2], me: 5, always: [[5, 3, 'inn']],
        build: [[5, 2, 'fishing', 1], [5, 1, 'fishing', 1], [7, 1, 'tower', 2], [7, 2, 'fishing', 3]],
        walk: [['fisher', 5, 1.3, 2.2]] },
      q4: { box: [3, 5, 5, 7], label: [2, 6], me: 4, always: [[4, 5, 'brewery']],
        build: [[3, 5, 'orchard', 1], [3, 6, 'orchard', 1], [4, 6, 'well', 2], [4, 7, 'field', 2], [5, 6, 'field', 3], [5, 5, 'house', 3]],
        walk: [['brewer', 4, 5.2, 7]] },
      q5: { box: [1, 2, 1, 6], label: [0, 4], me: 2, always: [[1, 5, 'house']],
        build: [[1, 4, 'plaza', 1], [1, 3, 'bell', 1], [1, 2, 'house', 2], [1, 6, 'inn', 3]],
        walk: [['chief', 1, 2.2, 6]] }
    }
  };

  // 첫 화면(게임 시작 화면)의 마을 그림. 가로세로 7칸.
  // T 나무, p 소나무, ~ 강, . 풀밭, 그 밖의 글자는 아래 key의 건물. walk는 손주와 두부가 걷는 줄과 칸 범위.
  ST.TITLE = {
    rows: [
      'TpTTpTT',
      'pfwfooT',
      'Tmb.hhT',
      '~~~~~~~',
      'TghPi.T',
      'p...BtT',
      'TTpTTpT'
    ],
    key: { T: 'tree', p: 'pine', '~': 'water', f: 'field', w: 'well', o: 'orchard', m: 'mill', b: 'bakery', h: 'house', g: 'fishing', P: 'plaza', i: 'inn', B: 'bell', t: 'tower' },
    walk: [5, 1, 2.1],
    tagline: '빈 땅에 조각을 놓아 마을을 짓는 퍼즐'
  };

  // 날짜 규칙의 이벤트. choices의 cost는 내는 것(모자라면 못 고름), lose는 잃는 것(있는 만큼만), give는 받는 것, card는 오늘 손에 들어오는 조각.
  ST.EVENTS = {
    parcel: { art: ['grandma'], title: '할머니의 소포', text: '온천에서 소포가 왔다. 쪽지에는 "둘 중 하나만 가져라. 욕심내면 두부 준다."',
      choices: [{ label: '곡식 자루', note: '곡식 4개', give: { grain: 4 } }, { label: '동전 주머니', note: '금화 3개', give: { gold: 3 } }] },
    donkey: { art: ['donkey'], title: '두부의 간식 시간', text: '두부가 곡식 자루에 머리를 박고 있다. 꼬리가 신났다.',
      choices: [{ label: '당근으로 달랜다', note: '금화 1개', cost: { gold: 1 } }, { label: '그냥 둔다', note: '곡식 2개 잃음', lose: { grain: 2 } }] },
    neighbor: { art: ['hero'], title: '빵 냄새를 맡고 온 손님', text: '옆 마을 사람이 코를 킁킁거리며 찾아왔다. "그 빵, 저한테도 파시죠?"',
      choices: [{ label: '빵을 판다', note: '빵 2개 → 금화 8개', cost: { bread: 2 }, give: { gold: 8 } }, { label: '인사만 한다', note: '아무 일 없음' }] },
    rain: { art: ['field'], piece: true, title: '밤새 내린 비', text: '아침에 보니 밭이 반짝반짝하다. 비가 일을 대신 해 줬다.',
      choices: [{ label: '좋았어!', note: '곡식 3개', give: { grain: 3 } }] },
    peddler: { art: ['donkey', 'crate'], title: '떠돌이 상인', text: '수레를 끈 상인이 지나간다. "방앗간 조각 있어요. 오늘만 금화 3개!"',
      choices: [{ label: '산다', note: '금화 3개 → 오늘 손에 방앗간', cost: { gold: 3 }, card: 'mill' }, { label: '구경만 한다', note: '아무 일 없음' }] },
    crow: { art: ['pine'], piece: true, title: '까마귀 떼', text: '까마귀 떼가 밭 위를 빙빙 돈다. 눈빛이 수상하다.',
      choices: [{ label: '빵을 던져 쫓는다', note: '빵 1개', cost: { bread: 1 } }, { label: '소리만 지른다', note: '곡식 3개 잃음', lose: { grain: 3 } }] }
  };
  ST.daysGoalText = function (g) {
    if (g.t === 'left') return '다 끝났을 때 빵 ' + g.n + '개 넘게 남기기';
    if (g.t === 'people') return '주민 ' + g.n + '명 넘기기';
    return '';
  };

  ST.TEXT = {
    title: '할머니의 마을 노트',
    // 처음 시작할 때 한 컷씩 넘겨 보는 이야기. imgs는 인물 그림, pieces는 조각 그림.
    prologue: [
      { imgs: ['grandma'], text: '우리 할머니는 이 근방에서 제일 유명한 마을 설계사다. 빈 땅만 보면 어디에 뭘 지을지 바로 아신다.' },
      { imgs: ['note'], text: '그런데 오늘 아침에 일어나 보니 할머니가 없다. 방에는 낡은 노트 한 권이랑 쪽지 한 장뿐.' },
      { letter: true, text: '못 끝낸 의뢰가 좀 있다. 네가 해라. 할미는 온천 간다. 밥은 꼭 챙겨 먹고.', from: '봉 할머니가' },
      { imgs: ['donkey', 'crate'], text: '마당에 나가 보니 당나귀 두부가 나무 상자를 지고 서 있다. 얘도 영문을 모르는 얼굴이다.' },
      { pieces: ['field', 'house', 'bakery', 'well'], text: '상자 안에는 할머니가 깎은 손바닥만 한 건물들이 들어 있다. 밭, 집, 빵집, 우물. 할머니는 이걸 "조각"이라고 부르셨다.' },
      { pieces: ['bakery'], text: '조각을 땅에 내려놓으면 그 자리에 진짜 건물이 선다. 왜 그런지는 할머니도 모르신단다. 할아버지가 깎은 건 그냥 나무토막이었다.' },
      { imgs: ['donkey'], text: '두부는 조각을 8개까지만 싣는다. 여덟까지밖에 못 세서 그렇다. 아홉 번째를 올리면 처음부터 다시 세는데, 그러다 해가 진다.' },
      { imgs: ['hero'], text: '나는 마을을 지어 본 적이 한 번도 없다. 에라, 모르겠다. 노트 첫 장을 폈다.', name: true }
    ],
    ending: ['첫 번째 골짜기 의뢰를 전부 끝냈다. 진짜로.', '노트 맨 뒷장에 할머니 글씨가 있다. "의뢰는 핑계였다. 네가 이 사람들을 만났으면 했어."', '두부 안장 밑에서 노트가 한 권 더 나왔다. 표지에 이렇게 적혀 있다.', '"다음 골짜기는 좀 어렵다. 준비되면 오너라."', '(다음 골짜기는 준비 중이에요.)']
  };

  ST.goalText = function (g) {
    if (g.r) return ST.RES[g.r].name + ' ' + g.n + ST.RES[g.r].unit + ' 이상';
    if (g.t === 'balance') return '담 양쪽 주민 수 차이 1명 이하';
    if (g.t === 'adj') return ST.PIECES[g.a].name + '을 ' + ST.PIECES[g.b].name + ' 옆에 짓기';
    return '';
  };
})(typeof window !== 'undefined' ? window : globalThis);
