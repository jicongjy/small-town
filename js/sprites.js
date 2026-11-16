// 그림 데이터. 글자 하나가 도트 한 칸이고, 글자마다 PAL의 색이 정해져 있다.
(function (root) {
  var ST = (root.ST = root.ST || {});

  var PAL = {
    g: '#2f9e7f', G: '#268a6f', M: '#1f7663',
    T: '#3fae6a', t: '#23705a', L: '#7fd07a',
    W: '#4fc3e8', w: '#b5ecf7', V: '#3aa6cc',
    R: '#e0584f', r: '#b8403f', B: '#8a5648', b: '#5c3632',
    Y: '#ffd76a', y: '#fff1b8', P: '#a8644f',
    H: '#f2c94c', h: '#d9a431', S: '#aab2c0', s: '#6b7385',
    K: '#2a2433', F: '#f6c9a0', O: '#fdf6e3',
    D: '#b3aca2', d: '#746e66', N: '#f29bb0',
    C: '#f08a4b', c: '#c96a34', E: '#3f8f4f',
    U: '#9a78d6', u: '#6f52a8', X: '#5b93d6', x: '#3f6ea8',
    A: '#d9b97c', a: '#c49a5e'
  };

  // 의뢰별 땅 색. 겨울 의뢰는 눈밭으로 바꾼다.
  var GROUNDS = {
    day: { g: '#2f9e7f', G: '#268a6f', M: '#1f7663', flowers: true },
    snow: { g: '#dcecf0', G: '#c3d9e0', M: '#a9c3cc', flowers: false }
  };

  var SP = {
    // 조각 12종
    field: ['', '.PPPPPPPPPPPPPP', '.PHPHPHPHPHPHPP', '.PhPhPhPhPhPhPP', '.PPPPPPPPPPPPPP', '.PHPHPHPHPHPHPP', '.PhPhPhPhPhPhPP', '.PPPPPPPPPPPPPP', '.PHPHPHPHPHPHPP', '.PhPhPhPhPhPhPP', '.PPPPPPPPPPPPPP', '.PHPHPHPHPHPHPP', '.PhPhPhPhPhPhPP', '.PPPPPPPPPPPPPP'],
    orchard: ['', '..TTT.....TTT', '.TRTTT...TTRTT', '.TTTRt...TRTTt', '..Ttt.....Ttt', '...b.......b', '..MM......MM', '', '..TTT.....TTT', '.TTRTT...TRTTT', '.TRTTt...TTTRt', '..Ttt.....Ttt', '...b.......b', '..MM......MM'],
    fishing: ['', '....WWWWWWWW', '..WWWWWWWWWWWW', '.WWWwwWWWWWWWWW', '.WWWWWWWWSsWWWW', '.WWWWWWWWWWWWWW', '.WWWWPPPPPPWwwW', '.WWWWPbPPbPWWWW', '..WWWPPPPPPWWW', '....WPbPPbPW', '.....PPPPPP', '.....PbPPbP', '.....PPPPPP'],
    bakery: ['.........OO', '..........O', '.....CCCCCbbC', '....CCCCCCCCCC', '...CCCCCCCCCCCC', '..CCCCCCCCCCCCCC', '..cccccccccccccc', '...yyyyyyyyyyyy', '...yYYyyyyyHHHy', '...yYYyybbyHHHy', '...yyyyybbyyyyy', '...yyyyybbyyyyy', '..MMMMMMMMMMMMMM'],
    mill: ['..O.........O', '...O.......O', '....O.....O', '.....O...O', '......ORO', '......RKR', '.....OSRSO', '....O.SSS.O', '...O..SYS..O', '..O...SSS...O', '......SSSs', '.....SSbSSs', '.....SSbSSs', '....MMMMMMM'],
    brewery: ['', '..........bb', '.....UUUUUbbU', '....UUUUUUUUUU', '...UUUUUUUUUUUU', '..UUUUUUUUUUUUUU', '..uuuuuuuuuuuuuu', '...BBBBBBBBBBBB', '...BYYBBBBBBBBB', '...BYYBBbbBPPPB', '...BBBBBbbPhPhP', '...BBBBBbbPPPPP', '..MMMMMMMMMMMMMM'],
    house: ['', '..........bb', '.....RRRRRbbR', '....RRRRRRRRRR', '...RRRRRRRRRRRR', '..RRRRRRRRRRRRRR', '..rrrrrrrrrrrrrr', '...BBBBBBBBBBBB', '...BYYBBBBBBYYB', '...BYYBBbbBBYYB', '...BBBBBbbBBBBB', '...BBBBBbbBBBBB', '..MMMMMMMMMMMMMM'],
    inn: ['', '....XXXXXXXXXX', '...XXXXXXXXXXXX', '..XXXXXXXXXXXXXX', '..xxxxxxxxxxxxxx', '...yyyyyyyyyyyy', '...yYYyYYyYYyYy', '...yyyyyyyyyyyy', '...yYYyybbyYYyy', '...yYYyybbyYYyy', '...yyyyybbyyyyy', '..MMMMMMMMMMMMMM'],
    tower: ['.......RR', '.......bRR', '.......b', '.....S.SS.S', '.....SSSSSS', '.....SSSSSs', '......SYSs', '......SSSs', '......SSSs', '......SYSs', '......SSSs', '.....SSbSSs', '.....SSbSSs', '....MMMMMMM'],
    well: ['', '', '....bbbbbbbb', '....b......b', '...RRRRRRRRRR', '....b......b', '....b......b', '...SSSSSSSSSS', '...SwWWWWWWsS', '...SWWWWWWWsS', '...SSSSSSSSsS', '...SSSSSSSSss', '....MMMMMMMM'],
    plaza: ['', '..SSSSSSSSSSSS', '.SSsSSSSSSSSsSS', '.SSSSSSSSSSSSSS', '.SSSSSsssSSSSSS', '.SSSSsWWWsSSSSS', '.SSSsWWwWWsSSSS', '.SSSsWwOwWsSSSS', '.SSSsWWwWWsSSSS', '.SSSSsWWWsSSSSS', '.SSSSSsssSSSSSS', '.SSsSSSSSSSSsSS', '..SSSSSSSSSSSS'],
    bell: ['.......R', '......RRR', '.....RRRRR', '....RRRRRRR', '.....B.H.B', '.....BHHHB', '.....B.h.B', '.....BBBBB', '.....BBBBb', '.....BYBBb', '.....BBBBb', '.....BbbBb', '.....BbbBb', '....MMMMMMM'],

    // 땅에 미리 놓여 있는 것
    tree: ['', '.......L', '......LTT', '.....LTTTt', '.....TTTTt', '....LTTTTTt', '....TTTTTTt', '...LTTTTTTTt', '...TTTTTTTtt', '....TTTTTtt', '......bb', '......bb', '....MMMMMM'],
    pine: ['.......t', '......TTt', '.....TTTtt', '......TTt', '.....TTTtt', '....TTTTttt', '.....TTTtt', '....TTTTttt', '...TTTTTtttt', '......bb', '......bb', '....MMMMMM'],
    rock: ['', '', '', '.....SSSS', '...SSSSSSSs', '..SSOSSSSSss', '..SSSSSSSSss', '.SSSSSSSSSsss', '.SSSSSSSSssss', '..sssssssssss', '...MMMMMMMMM'],
    wall: ['.....SSSSSs', '.....SsSSSs', '.....SSSSss', '.....SSSsSs', '.....SSSSSs', '.....SsSSSs', '.....SSSSss', '.....SSSsSs', '.....SSSSSs', '.....SsSSSs', '.....SSSSss', '.....SSSsSs', '.....SSSSSs', '.....SsSSSs', '.....SSSSss', '.....SSSsSs'],
    water: ['WWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwww', 'WWWWWWWWWWWWWWWW', 'WWwwwWWWWWWWWWWW', 'WWWWWWWWWWWWWWWW', 'WWWWWWWWWWwwwWWW', 'WWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWW', 'WWWWwwwWWWWWWWWW', 'WWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWwwWW', 'WWWWWWWWWWWWWWWW', 'WwwwWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWW', 'VVVVVVVVVVVVVVVV', 'MMMMMMMMMMMMMMMM'],

    // 등장인물
    hero: ['', '....bbbb', '...bbbbbb', '...bFFFFb', '...FKFFKF', '...FFFFFF', '....FFFF', '...EEEEEE', '..FEEEEEEF', '..FEEEEEEF', '...EEEEEE', '...KK..KK', '...bb..bb'],
    grandma: ['.....SS', '....SSSS', '...SSSSSS', '...SFFFFS', '...FKFFKF', '...FFFFFF', '....FFFF', '...NNNNNN', '..NNNNNNNN', '..FNNNNNNF', '...NNNNNN', '...OOOOOO', '...bb..bb'],
    donkey: ['', '..d.d', '..DdD', '.DDDDD', '.DKDDDDDDDDDDD', '.DDDDDDDDDDDDDd', '.OODDDDCCCDDDDd', '...DDDDCCCDDDD.d', '...DDDDDDDDDDD', '...DD.DD..DD.DD', '...DD.DD..DD.DD', '...dd.dd..dd.dd'],
    baker: ['...OOOOOO', '...OOOOOO', '....OOOO', '...CFFFFC', '...FKFFKF', '...FFFFFF', '....FFFF', '...OOOOOO', '..FOOOOOOF', '..FOOOOOOF', '...OOOOOO', '...NN..NN', '...bb..bb'],
    twinA: ['', '..bb....bb', '..bbbbbbbb', '...bFFFFb', '...FKFFKF', '...FFFFFF', '....FFFF', '...NNNNNN', '..FNNNNNNF', '..NNNNNNNN', '..NNNNNNNN', '....F..F', '...bb..bb'],
    fisher: ['....HHHH', '...HHHHHH', '.HHHHHHHHHH', '...FKFFKF', '...FOOOOF', '...OOOOOO', '....OOOO', '...ssssss', '..FssssssF', '..FssssssF', '...ssssss', '...KK..KK', '...bb..bb'],
    brewer: ['...uuuuuu', '..uuuuuuuu', '...OOOOOO', '...FKFFKF', '...FFRRFF', '...FFFFFF', '...UUUUUU', '..BBBBBBBB', '..FBBBBBBF', '..FBBBBBBF', '...BBBBBB', '...KK..KK', '...bb..bb'],
    chief: ['....KKKK', '....KKKK', '...KKKKKK', '...FFFFFF', '...FKFFKF', '...FbbbbF', '....FFFF', '..rrrrrrrr', '.FrrrHHrrrF', '.FrrrrrrrrF', '..rrrrrrrr', '...KK..KK', '...bb..bb'],

    // 이야기 장면용
    note: ['..bbbbbbbbb', '..bPPPPPPPb', '..bPOOOOOPb', '..bPOKKKOPb', '..bPOOOOOPb', '..bPPPPPPPb', '..bPPPPPPPb', '..bPPPHPPPb', '..bPPPPPPPb', '..bbbbbbbbb'],
    crate: ['', '', '', '.BBBBBBBBBB', '.BPPPPPPPPB', '.BbbbbbbbbB', '.BPPPPPPPPB', '.BPPPPPPPPB', '.BbbbbbbbbB', '.BPPPPPPPPB', '.BBBBBBBBBB'],

    // 지도용: 흙길, 다리, 팻말
    path: ['..AAAAAAAAAAAA', '.AAAAAaAAAAAAAA', '.AAAAAAAAAAaAAA', '..AAAAAAAAAAAAA', '..AAaAAAAAAAAA', '.AAAAAAAAAAAAA', '.AAAAAAAAaAAAAA', '..AAAAAAAAAAAAA', '..AAAAAAAAAAAA', '.AAAaAAAAAAAAAA', '.AAAAAAAAAAAaAA', '..AAAAAAAAAAAA', '..AAAAAAaAAAAAA', '.AAAAAAAAAAAAAA', '.AAAAAAAAAAAAA', '..AAAAAAAAAAAA'],
    bridge: ['WWWbBBBBBBBBbWWW', 'wwwbPPPPPPPPbwww', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'WWWbBBBBBBBBbWWW', 'WWWbPPPPPPPPbWWW', 'VVVbBBBBBBBBbVVV', 'VVVbPPPPPPPPbVVV'],
    sign: ['', '', '', '...bbbbbbbbbb', '...bOOOOOOOOb', '...bOKKOKKKOb', '...bOOOOOOOOb', '...bOKKKOKKOb', '...bOOOOOOOOb', '...bbbbbbbbbb', '.......bb', '.......bb', '.......bb', '......MMMM'],
    steam: ['..O...O...O', '.O...O...O', '..O...O...O', '...O...O...O', '..O...O...O'],

    // 유물
    r_compass: ['....SSSS', '..SSOOOOSS', '.SOOOROOOOS', '.SOOORROOOS', 'SOOOORROOOOS', 'SOOOOKKOOOOS', 'SOOOOssOOOOS', '.SOOOssOOOS', '.SOOOOsOOOS', '..SSOOOOSS', '....SSSS'],
    r_dawnbell: ['.....bb', '.....HH', '....HHHH', '...HHHHHH', '...HyHHHH', '...HyHHHH', '..HHyHHHHH', '..HHHHHHHH', '.HHHHHHHHHH', '.hhhhhhhhhh', '.....KK'],
    r_magnifier: ['...SSSS', '..SwwwwS', '.SwwOwwwS', '.SwOwwwwS', '.SwwwwwwS', '.SwwwwwwS', '..SwwwwS', '...SSSSb', '.......bb', '........bb', '.........bb'],
    r_pencil: ['.........NN', '........NNN', '.......SSN', '......HHS', '.....HHH', '....HHH', '...HHH', '..HHH', '.yHH', '.Ky'],
    r_carrot: ['....E..E', '.....EE', '....CCCC', '...BBBBBB', '..BBBBBBBB', '..BBPPPPBB', '..BBPHHPBB', '..BBPPPPBB', '..BBBBBBBB', '...BBBBBB'],

    // 자원 아이콘
    i_grain: ['...H', '..HhH', '...H', '..HhH', '...H', '...E', '...E'],
    i_bread: ['.CCCCC', 'CyCyCyC', 'CCCCCCC', 'cCCCCCc', '.ccccc'],
    i_people: ['..FF', '..FF', '.XXXX', '.XXXX', '..XX', '..KK'],
    i_gold: ['.HHH', 'HyHHh', 'HyHHh', 'HHHHh', '.hhh'],
    star: ['...H', '...H', '..HHH', 'HHHHHHH', '.HHHHH', '..HHH', '.HH.HH', '.H...H'],
    star_off: ['...s', '...s', '..sss', 'sssssss', '.sssss', '..sss', '.ss.ss', '.s...s']
  };
  SP.twinB = SP.twinA.map(function (r) { return r.replace(/N/g, 'X'); });

  var cache = {};

  // 그림 하나를 이미지 주소로 바꾼다. size를 주면 그 크기의 정사각 칸 안에 그린다.
  ST.url = function (name, ground, size) {
    var key = name + '|' + (ground || 'day') + '|' + (size || 0);
    if (cache[key]) return cache[key];
    var rows = SP[name];
    if (!rows) return '';
    var w = 0, h = rows.length, i, j;
    for (j = 0; j < rows.length; j++) w = Math.max(w, rows[j].length);
    if (size) { w = size; h = size; }
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    var gr = GROUNDS[ground || 'day'];
    for (j = 0; j < rows.length; j++) {
      for (i = 0; i < rows[j].length; i++) {
        var ch = rows[j].charAt(i);
        if (ch === '.') continue;
        var col = ch === 'M' ? gr.M : PAL[ch];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect(i, j, 1, 1);
      }
    }
    return (cache[key] = c.toDataURL());
  };

  // 5×5 땅의 바닥 그림. 풀과 꽃을 흩뿌린다.
  ST.ground = function (ground, seed) {
    var key = 'ground|' + ground + '|' + seed;
    if (cache[key]) return cache[key];
    var gr = GROUNDS[ground || 'day'];
    var c = document.createElement('canvas');
    c.width = 80; c.height = 80;
    var x = c.getContext('2d');
    x.fillStyle = gr.g; x.fillRect(0, 0, 80, 80);
    var n = seed || 7;
    function rnd(m) { n = (n * 73 + 19) % 997; return n % m; }
    var k, a, b;
    for (k = 0; k < 34; k++) {
      a = rnd(78); b = rnd(78) + 1;
      x.fillStyle = gr.G; x.fillRect(a, b, 2, 1); x.fillRect(a + 1, b - 1, 1, 1);
    }
    if (gr.flowers) {
      var cols = [PAL.O, PAL.H, PAL.N];
      for (k = 0; k < 7; k++) {
        a = rnd(74) + 2; b = rnd(74) + 2;
        x.fillStyle = cols[k % 3];
        x.fillRect(a, b - 1, 1, 1); x.fillRect(a - 1, b, 3, 1); x.fillRect(a, b + 1, 1, 1);
        x.fillStyle = PAL.y; x.fillRect(a, b, 1, 1);
      }
    }
    return (cache[key] = c.toDataURL());
  };

  ST.groundColor = function (ground) { return GROUNDS[ground || 'day'].g; };
})(typeof window !== 'undefined' ? window : globalThis);
