/* Closing mini-game: feed the shredder. Picks a place (state or city), a period and a guess,
   then shreds that many months of junk mail and reports household and place-level waste.
   Place data: ACS 2023 5-year (households, income brackets, share 65+). Model notes in index.html. */
(function(){
  'use strict';
  var section = document.getElementById('shredder');
  if(!section) return;
  var DATA = {"us":{"hh":127482865,"inc":[0.3229,0.2846,0.1742,0.2184],"p65":16.91},"places":[{"t":"s","n":"California","a":"CA","hh":13434847,"med":96334,"inc":[0.265,0.251,0.179,0.305],"p65":15.3},{"t":"s","n":"Alabama","a":"AL","hh":1969105,"med":62027,"inc":[0.4132,0.2924,0.1517,0.1427],"p65":17.5},{"t":"s","n":"Alaska","a":"AK","hh":267865,"med":89336,"inc":[0.263,0.29,0.196,0.251],"p65":13.3},{"t":"s","n":"Arizona","a":"AZ","hh":2796790,"med":76872,"inc":[0.317,0.306,0.181,0.196],"p65":18.6},{"t":"s","n":"Arkansas","a":"AR","hh":1189160,"med":58773,"inc":[0.4324,0.3013,0.1441,0.1221],"p65":16.9},{"t":"s","n":"Colorado","a":"CO","hh":2325576,"med":92470,"inc":[0.2567,0.2797,0.1928,0.2707],"p65":15.2},{"t":"s","n":"Connecticut","a":"CT","hh":1420170,"med":93760,"inc":[0.274,0.254,0.178,0.294],"p65":18.1},{"t":"s","n":"Delaware","a":"DE","hh":396209,"med":82855,"inc":[0.2926,0.2976,0.1874,0.2224],"p65":20.0},{"t":"s","n":"District of Columbia","a":"DC","hh":321556,"med":106287,"inc":[0.2567,0.2178,0.1568,0.3686],"p65":12.7},{"t":"s","n":"Florida","a":"FL","hh":8550911,"med":71711,"inc":[0.3477,0.3037,0.1678,0.1808],"p65":21.1},{"t":"s","n":"Georgia","a":"GA","hh":4008013,"med":74664,"inc":[0.3407,0.2927,0.1698,0.1968],"p65":14.6},{"t":"s","n":"Hawaii","a":"HI","hh":488991,"med":98317,"inc":[0.2438,0.2647,0.1988,0.2927],"p65":19.9},{"t":"s","n":"Idaho","a":"ID","hh":693821,"med":74636,"inc":[0.3156,0.3367,0.1834,0.1643],"p65":16.6},{"t":"s","n":"Illinois","a":"IL","hh":5001904,"med":81702,"inc":[0.3123,0.2783,0.1792,0.2302],"p65":16.6},{"t":"s","n":"Indiana","a":"IN","hh":2681537,"med":70051,"inc":[0.355,0.318,0.172,0.155],"p65":16.4},{"t":"s","n":"Iowa","a":"IA","hh":1303763,"med":73147,"inc":[0.3337,0.3187,0.1838,0.1638],"p65":17.8},{"t":"s","n":"Kansas","a":"KS","hh":1160715,"med":72639,"inc":[0.3373,0.3133,0.1772,0.1722],"p65":16.6},{"t":"s","n":"Kentucky","a":"KY","hh":1791991,"med":62417,"inc":[0.4092,0.2994,0.1577,0.1337],"p65":17.0},{"t":"s","n":"Louisiana","a":"LA","hh":1783168,"med":60023,"inc":[0.4311,0.2745,0.1477,0.1467],"p65":16.3},{"t":"s","n":"Maine","a":"ME","hh":589085,"med":71773,"inc":[0.3483,0.3023,0.1822,0.1672],"p65":21.9},{"t":"s","n":"Maryland","a":"MD","hh":2339510,"med":101652,"inc":[0.2405,0.2515,0.1926,0.3154],"p65":16.3},{"t":"s","n":"Massachusetts","a":"MA","hh":2762070,"med":101341,"inc":[0.262,0.232,0.177,0.329],"p65":17.5},{"t":"s","n":"Michigan","a":"MI","hh":4040168,"med":71149,"inc":[0.3544,0.3033,0.1692,0.1732],"p65":18.2},{"t":"s","n":"Minnesota","a":"MN","hh":2282967,"med":87556,"inc":[0.271,0.292,0.197,0.24],"p65":16.8},{"t":"s","n":"Mississippi","a":"MS","hh":1131760,"med":54915,"inc":[0.4635,0.2857,0.1379,0.1129],"p65":16.8},{"t":"s","n":"Missouri","a":"MO","hh":2484834,"med":68920,"inc":[0.365,0.308,0.169,0.158],"p65":17.5},{"t":"s","n":"Montana","a":"MT","hh":452683,"med":69922,"inc":[0.3584,0.3153,0.1682,0.1582],"p65":19.7},{"t":"s","n":"Nebraska","a":"NE","hh":786885,"med":74985,"inc":[0.325,0.315,0.184,0.176],"p65":16.4},{"t":"s","n":"Nevada","a":"NV","hh":1183393,"med":75561,"inc":[0.3263,0.3063,0.1812,0.1862],"p65":16.3},{"t":"s","n":"New Hampshire","a":"NH","hh":551186,"med":95628,"inc":[0.2445,0.2756,0.2004,0.2796],"p65":19.5},{"t":"s","n":"New Jersey","a":"NJ","hh":3478355,"med":101050,"inc":[0.2523,0.2432,0.1802,0.3243],"p65":16.8},{"t":"s","n":"New Mexico","a":"NM","hh":825021,"med":62125,"inc":[0.4114,0.2943,0.1512,0.1431],"p65":18.8},{"t":"s","n":"New York","a":"NY","hh":7668956,"med":84578,"inc":[0.3157,0.2517,0.1678,0.2647],"p65":17.4},{"t":"s","n":"North Carolina","a":"NC","hh":4186924,"med":69904,"inc":[0.3626,0.2997,0.1648,0.1728],"p65":16.9},{"t":"s","n":"North Dakota","a":"ND","hh":325079,"med":75949,"inc":[0.327,0.306,0.184,0.183],"p65":16.2},{"t":"s","n":"Ohio","a":"OH","hh":4829571,"med":69680,"inc":[0.363,0.303,0.169,0.165],"p65":17.9},{"t":"s","n":"Oklahoma","a":"OK","hh":1542780,"med":63603,"inc":[0.3942,0.3094,0.1577,0.1387],"p65":16.1},{"t":"s","n":"Oregon","a":"OR","hh":1701548,"med":80426,"inc":[0.3097,0.2917,0.1848,0.2138],"p65":18.6},{"t":"s","n":"Pennsylvania","a":"PA","hh":5235339,"med":76081,"inc":[0.333,0.29,0.176,0.201],"p65":19.1},{"t":"s","n":"Rhode Island","a":"RI","hh":436902,"med":86372,"inc":[0.2979,0.2718,0.1946,0.2357],"p65":18.3},{"t":"s","n":"South Carolina","a":"SC","hh":2070390,"med":66818,"inc":[0.38,0.301,0.161,0.158],"p65":18.5},{"t":"s","n":"South Dakota","a":"SD","hh":358552,"med":72421,"inc":[0.339,0.324,0.182,0.155],"p65":17.6},{"t":"s","n":"Tennessee","a":"TN","hh":2768743,"med":67097,"inc":[0.3754,0.3063,0.1642,0.1542],"p65":16.8},{"t":"s","n":"Texas","a":"TX","hh":10747240,"med":76292,"inc":[0.328,0.292,0.172,0.208],"p65":13.2},{"t":"s","n":"Utah","a":"UT","hh":1094896,"med":91750,"inc":[0.24,0.305,0.216,0.239],"p65":11.6},{"t":"s","n":"Vermont","a":"VT","hh":269466,"med":78024,"inc":[0.319,0.294,0.186,0.201],"p65":20.8},{"t":"s","n":"Virginia","a":"VA","hh":3326260,"med":90974,"inc":[0.2757,0.2667,0.1818,0.2757],"p65":16.3},{"t":"s","n":"Washington","a":"WA","hh":3020558,"med":94952,"inc":[0.2525,0.2715,0.1916,0.2844],"p65":16.3},{"t":"s","n":"West Virginia","a":"WV","hh":721448,"med":57917,"inc":[0.44,0.299,0.146,0.115],"p65":20.7},{"t":"s","n":"Wisconsin","a":"WI","hh":2446028,"med":75670,"inc":[0.3173,0.3183,0.1892,0.1752],"p65":18.0},{"t":"s","n":"Wyoming","a":"WY","hh":238176,"med":74815,"inc":[0.329,0.309,0.192,0.17],"p65":18.0},{"t":"c","n":"New York","a":"NY","hh":3313316,"med":79713,"inc":[0.345,0.241,0.153,0.261],"p65":16.0},{"t":"c","n":"Los Angeles","a":"CA","hh":1419663,"med":80366,"inc":[0.334,0.255,0.16,0.251],"p65":13.8},{"t":"c","n":"Chicago","a":"IL","hh":1146547,"med":75134,"inc":[0.3596,0.2567,0.1598,0.2238],"p65":13.6},{"t":"c","n":"Houston","a":"TX","hh":916536,"med":62894,"inc":[0.402,0.29,0.131,0.177],"p65":12.0},{"t":"c","n":"Phoenix","a":"AZ","hh":601397,"med":77041,"inc":[0.315,0.31,0.174,0.201],"p65":11.9},{"t":"c","n":"Philadelphia","a":"PA","hh":669222,"med":60698,"inc":[0.4304,0.2763,0.1401,0.1532],"p65":14.4},{"t":"c","n":"San Antonio","a":"TX","hh":547883,"med":62917,"inc":[0.3972,0.3194,0.1497,0.1337],"p65":13.1},{"t":"c","n":"San Diego","a":"CA","hh":522146,"med":104321,"inc":[0.232,0.249,0.194,0.325],"p65":14.2},{"t":"c","n":"Dallas","a":"TX","hh":528038,"med":67760,"inc":[0.3704,0.3043,0.1371,0.1882],"p65":11.4},{"t":"c","n":"Austin","a":"TX","hh":440294,"med":91461,"inc":[0.266,0.275,0.172,0.287],"p65":10.1},{"t":"c","n":"Jacksonville","a":"FL","hh":384741,"med":66981,"inc":[0.3746,0.3117,0.1688,0.1449],"p65":14.7},{"t":"c","n":"San Jose","a":"CA","hh":326767,"med":141565,"inc":[0.1752,0.1852,0.1662,0.4735],"p65":14.1},{"t":"c","n":"San Francisco","a":"CA","hh":362650,"med":141446,"inc":[0.224,0.165,0.134,0.477],"p65":17.2},{"t":"c","n":"Seattle","a":"WA","hh":353019,"med":121984,"inc":[0.217,0.209,0.163,0.411],"p65":12.8},{"t":"c","n":"Denver","a":"CO","hh":329578,"med":91681,"inc":[0.267,0.27,0.179,0.284],"p65":12.3},{"t":"c","n":"Boston","a":"MA","hh":279216,"med":94755,"inc":[0.3157,0.2048,0.1548,0.3247],"p65":12.7},{"t":"c","n":"Atlanta","a":"GA","hh":231504,"med":81938,"inc":[0.342,0.243,0.15,0.265],"p65":12.3},{"t":"c","n":"Miami","a":"FL","hh":190282,"med":59390,"inc":[0.4366,0.2587,0.1309,0.1738],"p65":16.3},{"t":"c","n":"Portland","a":"OR","hh":287030,"med":88792,"inc":[0.2893,0.2613,0.1762,0.2733],"p65":14.2},{"t":"c","n":"Las Vegas","a":"NV","hh":244429,"med":70723,"inc":[0.356,0.302,0.168,0.174],"p65":15.6},{"t":"c","n":"Detroit","a":"MI","hh":253207,"med":39575,"inc":[0.604,0.246,0.092,0.058],"p65":14.8},{"t":"c","n":"Minneapolis","a":"MN","hh":188944,"med":80269,"inc":[0.3203,0.2753,0.1732,0.2312],"p65":10.8},{"t":"c","n":"New Orleans","a":"LA","hh":155060,"med":55339,"inc":[0.4695,0.2442,0.1281,0.1582],"p65":16.5},{"t":"c","n":"Baltimore","a":"MD","hh":250608,"med":59623,"inc":[0.429,0.279,0.135,0.157],"p65":14.9},{"t":"c","n":"Charlotte","a":"NC","hh":361100,"med":78438,"inc":[0.3037,0.3027,0.1688,0.2248],"p65":10.8},{"t":"c","n":"Columbus","a":"OH","hh":386581,"med":65327,"inc":[0.3784,0.3203,0.1662,0.1351],"p65":11.0},{"t":"c","n":"Kansas City","a":"MO","hh":219486,"med":67449,"inc":[0.3754,0.2983,0.1692,0.1572],"p65":14.1},{"t":"c","n":"Pittsburgh","a":"PA","hh":137593,"med":64137,"inc":[0.4066,0.2797,0.1459,0.1678],"p65":15.1},{"t":"c","n":"Cleveland","a":"OH","hh":168652,"med":39187,"inc":[0.5954,0.2517,0.0889,0.0639],"p65":15.0},{"t":"c","n":"Tampa","a":"FL","hh":160527,"med":71302,"inc":[0.367,0.268,0.144,0.221],"p65":13.2},{"t":"c","n":"Raleigh","a":"NC","hh":196924,"med":82424,"inc":[0.298,0.289,0.172,0.241],"p65":11.7},{"t":"c","n":"Sacramento","a":"CA","hh":199401,"med":83753,"inc":[0.299,0.287,0.187,0.227],"p65":14.1},{"t":"c","n":"Salt Lake City","a":"UT","hh":88932,"med":74925,"inc":[0.333,0.303,0.159,0.205],"p65":12.2},{"t":"c","n":"Milwaukee","a":"WI","hh":231084,"med":51888,"inc":[0.484,0.3,0.127,0.089],"p65":11.8},{"t":"c","n":"St. Louis","a":"MO","hh":144450,"med":55279,"inc":[0.4581,0.2874,0.1307,0.1238],"p65":14.9}]};

  /* ---------------- model ---------------- */
  var IDX_I = [0.74, 1.00, 1.21, 1.42];
  var IDX_A = [0.61, 1.07, 1.40];
  var H65_US = 0.299;
  var NON65 = (1 - 0.419) / (1 - H65_US);
  var PER_MONTH = { pieces: 848/12, gdp: 62000/3, co2: 109/3, kwh: 62/3, lbs: 41/12 };
  var MONTHS = [1, 3, 6, 9, 12];
  var US = DATA.us;
  var IU = dot(US.inc, IDX_I);

  function dot(a, b){ var s = 0; for(var i=0;i<a.length;i++) s += a[i]*b[i]; return s; }
  function placeIdx(p){
    var I = dot(p.inc, IDX_I) / IU;
    var h65 = Math.min(0.8, p.p65 / US.p65 * H65_US);
    var A = h65 * 1.40 + (1 - h65) * NON65;
    return { I: I, A: A, M: Math.sqrt(I * A) };
  }
  var usPlace = { t:'u', n:'United States', a:'US', hh: US.hh, inc: US.inc, p65: US.p65 };
  var places = [usPlace].concat(DATA.places);
  places.forEach(function(p){ p.x = placeIdx(p); });

  var state = { place: 0, months: 1, inc: -1, age: -1, phase: 'idle' };

  function household(){
    var p = places[state.place];
    var I = state.inc >= 0 ? IDX_I[state.inc] : p.x.I;
    var A = state.age >= 0 ? IDX_A[state.age] : p.x.A;
    return Math.sqrt(I * A);
  }
  function calc(){
    var p = places[state.place], m = MONTHS[state.months], h = household(), k = p.x.M;
    return {
      p: p, m: m, h: h,
      hh: { pieces: PER_MONTH.pieces*m*h, gdp: PER_MONTH.gdp*m*h, co2: PER_MONTH.co2*m*h, kwh: PER_MONTH.kwh*m*h, lbs: PER_MONTH.lbs*m*h },
      pl: { pieces: PER_MONTH.pieces*m*k*p.hh, gdp: PER_MONTH.gdp*m*k*p.hh, co2: PER_MONTH.co2*m*k*p.hh/1000, kwh: PER_MONTH.kwh*m*k*p.hh, tons: PER_MONTH.lbs*m*k*p.hh/2000 }
    };
  }

  /* ---------------- formatting ---------------- */
  function sig(n){ return n >= 100 ? Math.round(n).toString() : n >= 10 ? n.toFixed(1).replace(/\.0$/,'') : n.toFixed(2).replace(/0$/,'').replace(/\.0$/,''); }
  function big(n){
    var a = Math.abs(n);
    if(a >= 1e12) return sig(n/1e12) + 'T';
    if(a >= 1e9) return sig(n/1e9) + 'B';
    if(a >= 1e6) return sig(n/1e6) + 'M';
    if(a >= 1e4) return sig(n/1e3) + 'K';
    return Math.round(n).toLocaleString('en-US');
  }
  function money(n){ return '$' + big(n); }
  function kMoney(n){ return '$' + Math.round(n/1000).toLocaleString('en-US') + 'K'; }
  function kwhFmt(n){ return n >= 1e6 ? sig(n/1e6) + ' GWh' : n >= 1e3 ? sig(n/1e3) + ' MWh' : sig(n) + ' kWh'; }
  function monthsWord(m){ return m === 12 ? 'a year' : m + (m === 1 ? ' month' : ' months'); }

  /* ---------------- controls ---------------- */
  var $ = function(id){ return document.getElementById('sh-' + id); };
  var sel = $('place');
  (function buildSelect(){
    var o = document.createElement('option'); o.value = 0; o.textContent = 'United States (average household)'; sel.appendChild(o);
    [['s','States'],['c','Cities']].forEach(function(g){
      var og = document.createElement('optgroup'); og.label = g[1];
      places.map(function(p,i){ return [p,i]; }).filter(function(x){ return x[0].t === g[0]; })
        .sort(function(a,b){ return a[0].n.localeCompare(b[0].n); })
        .forEach(function(x){
          var op = document.createElement('option'); op.value = x[1];
          op.textContent = g[0] === 'c' ? x[0].n + ', ' + x[0].a : x[0].n;
          og.appendChild(op);
        });
      sel.appendChild(og);
    });
  })();

  function chipGroup(el, labels, key){
    labels.forEach(function(l, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sh-chip'; b.textContent = l;
      b.dataset.v = i - 1;
      b.addEventListener('click', function(){ state[key] = i - 1; syncChips(); changed(true); });
      el.appendChild(b);
    });
  }
  chipGroup($('incChips'), ['Typical','Under $50K','$50K–$99K','$100K–$149K','$150K+'], 'inc');
  chipGroup($('ageChips'), ['Typical','Under 45','45–64','65+'], 'age');
  function syncChips(){
    [['incChips','inc'],['ageChips','age']].forEach(function(g){
      Array.prototype.forEach.call($(g[0]).children, function(b){ b.setAttribute('aria-pressed', +b.dataset.v === state[g[1]] ? 'true' : 'false'); });
    });
    var bits = [];
    if(state.inc >= 0) bits.push(['<$50K','$50–99K','$100–149K','$150K+'][state.inc]);
    if(state.age >= 0) bits.push(['under 45','45–64','65+'][state.age]);
    $('tuneTag').textContent = bits.length ? bits.join(', ') : 'Typical for this place';
  }

  MONTHS.forEach(function(m, i){
    var b = document.createElement('button'); b.type = 'button';
    b.innerHTML = m + '<small>' + (m === 1 ? 'month' : 'months') + '</small>';
    b.setAttribute('aria-label', monthsWord(m));
    b.addEventListener('click', function(){ state.months = i; syncMonths(); changed(true); });
    $('months').appendChild(b);
  });
  function syncMonths(){
    Array.prototype.forEach.call($('months').children, function(b, i){ b.setAttribute('aria-pressed', i === state.months ? 'true' : 'false'); });
  }

  var guess = $('guess');
  guess.addEventListener('input', function(){ $('guessOut').textContent = kMoney(+guess.value); });
  sel.addEventListener('change', function(){ state.place = +sel.value; changed(true); });

  /* ---------------- ledger ---------------- */
  function renderLedger(){
    var r = calc(), p = r.p, m = r.m, revealed = state.phase === 'done';
    var where = p.t === 'u' ? 'the United States' : p.t === 'c' ? p.n : p.n;
    $('ledgerH').textContent = 'What ' + where + ' throws away in ' + monthsWord(m);
    $('ledgerSub').textContent = p.t === 'u'
      ? 'Every household in the country, at the national average.'
      : p.n + (p.t === 'c' ? ' (city limits)' : '') + ' has ' + p.hh.toLocaleString('en-US') + ' households. Its mix of incomes and ages sets how much junk mail the typical one gets.';
    $('capPieces').textContent = Math.round(r.hh.pieces).toLocaleString('en-US') + ' pieces';

    $('hhTag').textContent = (state.inc >= 0 || state.age >= 0) ? 'tuned' : 'typical here';
    $('hPieces').textContent = Math.round(r.hh.pieces).toLocaleString('en-US');
    $('hWeight').textContent = sig(r.hh.lbs) + ' lb';
    $('hCo2').textContent = sig(r.hh.co2) + ' kg';
    $('hKwh').textContent = kwhFmt(r.hh.kwh);
    $('placeColH').textContent = p.t === 'u' ? 'Every U.S. household' : 'All of ' + p.n;
    $('placeTag').textContent = big(p.hh) + ' households';
    $('pPieces').textContent = big(r.pl.pieces);
    $('pWeight').textContent = big(r.pl.tons) + ' tons';
    $('pCo2').textContent = big(r.pl.co2) + ' t';
    $('pKwh').textContent = kwhFmt(r.pl.kwh);
    [['hGdp', r.hh.gdp], ['pGdp', r.pl.gdp]].forEach(function(x){
      var el = $(x[0]);
      el.textContent = revealed ? money(x[1]) : 'Shred to reveal';
      el.className = revealed ? '' : 'sh-locked';
    });

    var h = r.h;
    $('idxNum').textContent = h.toFixed(2) + '×';
    var parts = 'Income mix ' + (state.inc >= 0 ? IDX_I[state.inc] : p.x.I).toFixed(2) +
      '× · age mix ' + (state.age >= 0 ? IDX_A[state.age] : p.x.A).toFixed(2) + '× the national average. ';
    if(state.inc >= 0 || state.age >= 0) parts += 'Your tuned household gets about ' + Math.round(h * 848).toLocaleString('en-US') + ' pieces a year; the typical one here gets ' + Math.round(p.x.M * 848).toLocaleString('en-US') + '.';
    else parts += 'About ' + Math.round(h * 848).toLocaleString('en-US') + ' pieces a year for a typical household here, against 848 nationally.';
    $('idxParts').textContent = parts;
    drawRank();
  }

  function drawRank(){
    var svg = $('strip'), p = places[state.place];
    var kind = p.t === 'c' ? 'c' : 's';
    var set = places.filter(function(q){ return q.t === kind; });
    var VW = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 600);
    svg.setAttribute('viewBox', '0 0 ' + VW + ' 64');
    var lo = 0.88, hi = 1.08, L = 8, R = VW - 8;
    function X(v){ return L + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (R - L); }
    var s = '<line x1="'+L+'" x2="'+R+'" y1="30" y2="30" style="stroke:var(--rule)" stroke-width="1"/>';
    s += '<line x1="'+X(1)+'" x2="'+X(1)+'" y1="18" y2="42" style="stroke:var(--ink-faint)" stroke-width="1" stroke-dasharray="2 2"/>';
    set.forEach(function(q){
      s += '<circle cx="'+X(q.x.M).toFixed(1)+'" cy="30" r="4.5" style="fill:var(--ink-faint)" fill-opacity=".45"><title>'+q.n+' '+q.x.M.toFixed(2)+'×</title></circle>';
    });
    var sx = X(p.x.M);
    s += '<circle cx="'+sx.toFixed(1)+'" cy="30" r="7" style="fill:var(--red);stroke:var(--paper-raised)"  stroke-width="2"/>';
    var anchor = sx < 90 ? 'start' : sx > VW - 90 ? 'end' : 'middle';
    s += '<text x="'+sx.toFixed(1)+'" y="13" font-size="13" font-weight="600" style="fill:var(--ink)" text-anchor="'+anchor+'" font-family="Inter,system-ui,sans-serif">'+(p.t==='u'?'U.S. average':p.n)+' '+p.x.M.toFixed(2)+'×</text>';
    s += '<text x="'+L+'" y="58" font-size="12" style="fill:var(--ink-faint)" font-family="Inter,system-ui,sans-serif">Less junk mail · 0.88×</text>';
    s += '<text x="'+X(1)+'" y="58" font-size="12" style="fill:var(--ink-faint)" text-anchor="middle" font-family="Inter,system-ui,sans-serif">1.00</text>';
    s += '<text x="'+R+'" y="58" font-size="12" style="fill:var(--ink-faint)" text-anchor="end" font-family="Inter,system-ui,sans-serif">1.08× · More</text>';
    svg.innerHTML = s;
    svg.setAttribute('aria-label', 'Typical household index for ' + (p.t==='u'?'the U.S.':p.n) + ': ' + p.x.M.toFixed(2) + ' times the national average, shown among all ' + (kind==='c'?'cities':'states'));
  }

  /* ---------------- shredder scene ---------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var stage = $('stage'), canvas = $('c'), ctx = canvas.getContext('2d');
  var hudNum = $('hudNum'), hudLab = $('hudLab');
  var P = {}, G = {}, S = null;

  function css(n, f){ var v = getComputedStyle(section).getPropertyValue(n); return (v && v.trim()) || f; }
  function readPalette(){
    P.env = [css('--sh-env-1','#FBF9F2'), css('--sh-env-2','#E8E3D3')];
    P.strip = [css('--sh-strip-1','#FBF9F2'), css('--sh-strip-2','#EDE7D4'), css('--sh-strip-3','#D6CDB5')];
    P.line = css('--rule','rgba(28,26,20,.16)'); P.inkFaint = css('--ink-faint','#8B8575');
    P.paper = css('--paper','#F1EEE3'); P.red = css('--red','#B7362A'); P.green = css('--green','#2E6B4F');
    P.machine = css('--sh-machine','#2B2A25'); P.machine2 = css('--sh-machine-2','#48453C');
    P.slot = css('--sh-slot','#0F0E0B'); P.bin = css('--sh-bin','rgba(28,26,20,.07)');
  }
  readPalette();
  if(window.matchMedia){ var mq = matchMedia('(prefers-color-scheme: dark)'); if(mq.addEventListener) mq.addEventListener('change', readPalette); }
  new MutationObserver(readPalette).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  function geometry(){
    var W = stage.clientWidth, H = stage.clientHeight, g = { W: W, H: H };
    g.mobile = W <= 640; g.cx = W / 2;
    g.Mw = Math.min(W * 0.84, 500); g.slotW = g.Mw * 0.8;
    g.chuteY = H * 0.17; g.slotY = H * 0.5;
    g.Mh = Math.max(52, H * 0.1); g.outY = g.slotY + g.Mh;
    g.binW = g.Mw * 0.9; g.binL = g.cx - g.binW / 2; g.binR = g.cx + g.binW / 2;
    g.floorY = H - 8;
    return g;
  }
  function sizeCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(G.W * dpr)); canvas.height = Math.max(1, Math.round(G.H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function envCount(){
    var base = G.mobile ? [10, 22, 36, 50, 64] : [12, 26, 42, 58, 76];
    var h = household();
    return Math.max(6, Math.min(G.mobile ? 90 : 105, Math.round(base[state.months] * h)));
  }

  function rr(x, y, w, h, r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function drawEnvelope(x, y, w, h, a, acc){
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    var tone = Math.round(Math.abs(Math.sin(x * 0.07 + y * 0.03))) % 2;
    ctx.fillStyle = acc ? P.env[0] : P.env[tone]; ctx.strokeStyle = P.line; ctx.lineWidth = 1;
    rr(-w/2, -h/2, w, h, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = P.inkFaint; ctx.globalAlpha = .55; ctx.beginPath();
    ctx.moveTo(-w/2, -h/2); ctx.lineTo(0, h * .08); ctx.lineTo(w/2, -h/2); ctx.stroke(); ctx.globalAlpha = 1;
    if(acc){ ctx.fillStyle = P.red; ctx.fillRect(w/2 - w*.26, -h/2 + h*.16, w*.18, h*.18); }
    ctx.restore();
  }
  function drawStrip(x, y, a, id, w, h, accent){
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    var t = Math.min(2, Math.floor(Math.abs(Math.sin(id * 7.31)) * 3));
    ctx.fillStyle = P.strip[t]; ctx.fillRect(-w/2, -h/2, w, h);
    if(accent){ ctx.fillStyle = accent === 'r' ? P.red : P.green; ctx.fillRect(-w/2, -h/2, w, h * .3); }
    ctx.strokeStyle = P.line; ctx.lineWidth = .6; ctx.strokeRect(-w/2, -h/2, w, h);
    ctx.restore();
  }
  function drawBin(){
    ctx.fillStyle = P.bin; ctx.fillRect(G.binL, G.outY, G.binW, G.floorY - G.outY);
    ctx.strokeStyle = P.inkFaint; ctx.globalAlpha = .7; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(G.binL, G.outY); ctx.lineTo(G.binL, G.floorY); ctx.lineTo(G.binR, G.floorY); ctx.lineTo(G.binR, G.outY); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function drawHopper(){
    ctx.save(); ctx.strokeStyle = P.inkFaint; ctx.globalAlpha = .5; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(G.cx - G.slotW/2, G.chuteY); ctx.lineTo(G.cx - G.slotW/2, G.slotY - 8);
    ctx.moveTo(G.cx + G.slotW/2, G.chuteY); ctx.lineTo(G.cx + G.slotW/2, G.slotY - 8);
    ctx.stroke(); ctx.restore();
  }
  function drawMachine(active, now){
    var jit = active ? Math.sin(now * .11) * .9 : 0, bx = G.cx - G.Mw/2 + jit;
    ctx.fillStyle = P.machine; rr(bx, G.slotY, G.Mw, G.Mh, 10); ctx.fill();
    ctx.fillStyle = P.machine2; rr(bx - 6, G.slotY - 8, G.Mw + 12, 12, 4); ctx.fill();
    ctx.strokeStyle = P.machine2; ctx.lineWidth = 2;
    var ty0 = G.slotY + G.Mh * .34, ty1 = G.slotY + G.Mh * .7, off = S ? S.teeth : 0;
    ctx.beginPath();
    for(var x = bx + 14 + off; x < bx + G.Mw - 34; x += 14){ ctx.moveTo(x, ty0); ctx.lineTo(x, ty1); }
    ctx.stroke();
    ctx.fillStyle = active ? '#E1685D' : '#4FA778';
    ctx.beginPath(); ctx.arc(bx + G.Mw - 20, G.slotY + G.Mh * .5, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.slot;
    rr(G.cx - G.slotW/2, G.slotY - 4, G.slotW, 5, 2); ctx.fill();
    rr(G.cx - G.slotW/2, G.outY - 6, G.slotW, 6, 2); ctx.fill();
  }

  /* HUD */
  var hudShown = -1;
  function setHud(v){
    var n = Math.round(v / 100) * 100;
    if(n === hudShown) return; hudShown = n;
    hudNum.textContent = v >= 1e6 ? money(v) : '$' + Math.round(v).toLocaleString('en-US');
  }

  /* static fallback (reduced motion or no physics library) */
  function drawStaticScene(){
    ctx.clearRect(0, 0, G.W, G.H);
    var seed = 7; function rand(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    drawBin();
    if(state.phase === 'done'){
      var rows = Math.min(14, 3 + state.months * 3), per = Math.floor(G.binW / 6), n = 0;
      for(var r = 0; r < rows; r++) for(var c = 0; c < per; c++){
        drawStrip(G.binL + 6 + rand() * (G.binW - 12), G.floorY - 10 - r * 7 - rand() * 5, (rand() - .5) * 2.2, n++, 3, 14 + rand() * 8,
          rand() < .22 ? (rand() < .7 ? 'r' : 'g') : null);
      }
    } else {
      var count = envCount(), w = G.mobile ? 32 : 40, h = w * .62;
      var cols = Math.max(1, Math.floor(G.slotW / (w + 3))), i = 0;
      for(var k = 0; k < count; k++){
        var row = Math.floor(k / cols), col = k % cols;
        var y = G.slotY - 12 - h/2 - row * (h * .55);
        if(y < G.chuteY - 20) break;
        drawEnvelope(G.cx - G.slotW/2 + w/2 + 3 + col * (w + 3) + (row % 2) * 6, y, w, h, (rand() - .5) * .3, rand() < .14);
      }
    }
    drawHopper(); drawMachine(false, 0);
  }

  function teardown(){
    if(!S) return;
    if(S.raf) cancelAnimationFrame(S.raf);
    if(S.runner) Matter.Runner.stop(S.runner);
    if(S.engine){ Matter.Events.off(S.engine); Matter.Composite.clear(S.engine.world, false); Matter.Engine.clear(S.engine); }
    S = null;
  }

  var PHYS = !reduceMotion && typeof window.Matter !== 'undefined';

  function build(){
    teardown();
    G = geometry(); sizeCanvas();
    var count = envCount();
    $('capPer').textContent = 'each envelope ≈ ' + Math.max(1, Math.round(calc().hh.pieces / count)) + ' pieces';
    if(!PHYS){ S = { teeth: 0 }; drawStaticScene(); return; }

    var Bodies = Matter.Bodies, Comp = Matter.Composite, Body = Matter.Body;
    var engine = Matter.Engine.create({ enableSleeping: true }); engine.gravity.y = 1;
    var world = engine.world, T = 60, top = -600;
    var gate = Bodies.rectangle(G.cx, G.slotY - 8 + T/2, G.slotW + T, T, { isStatic: true, friction: .5 });
    Comp.add(world, [
      gate,
      Bodies.rectangle(G.cx, G.floorY + T/2, G.binW + T*2, T, { isStatic: true, friction: .6 }),
      Bodies.rectangle(G.binL - T/2, (G.outY - 40 + G.floorY)/2, T, G.floorY - G.outY + 40 + T, { isStatic: true }),
      Bodies.rectangle(G.binR + T/2, (G.outY - 40 + G.floorY)/2, T, G.floorY - G.outY + 40 + T, { isStatic: true }),
      Bodies.rectangle(G.cx - G.slotW/2 - T/2, (top + G.slotY)/2, T, G.slotY - top, { isStatic: true }),
      Bodies.rectangle(G.cx + G.slotW/2 + T/2, (top + G.slotY)/2, T, G.slotY - top, { isStatic: true })
    ]);
    var runner = Matter.Runner.create();
    S = { engine: engine, runner: runner, world: world, envs: [], strips: [], queue: [], feeding: [],
          total: count, swallowed: 0, lastFeed: 0, activeUntil: 0, teeth: 0, lastDraw: 0, raf: null,
          stripsPer: G.mobile ? 5 : 6, value: 0, shown: 0, spawned: 0, startAt: 0 };

    function mkEnv(i, preset){
      var w = G.mobile ? 28 + Math.random() * 8 : 36 + Math.random() * 10, h = w * (.6 + Math.random() * .06);
      var x = G.cx + (Math.random() * 2 - 1) * (G.slotW/2 - w * .7);
      var y = preset ? G.slotY - 30 - i * 6 : G.chuteY - 40 - Math.random() * 120 - i * 4;
      var b = Bodies.rectangle(x, y, w, h, { angle: (Math.random() - .5) * 1.0, restitution: .08, friction: .5, frictionAir: .014, chamfer: { radius: 2 } });
      b.plugin = { w: w, h: h, acc: Math.random() < .14 }; b.sleepThreshold = Infinity;
      Comp.add(world, b); S.envs.push(b); S.spawned++;
    }
    if(state.phase === 'done'){
      // rebuilding after a resize: skip straight to a full bin
      for(var q = 0; q < count * S.stripsPer; q++) addStrip({ x: G.binL + 10 + Math.random() * (G.binW - 20), w: G.mobile ? 3.2 : 3.8 }, true);
      for(var s = 0; s < 240; s++) Matter.Engine.update(engine, 1000/60);
      S.swallowed = count; S.spawned = count; S.shown = S.value = calc().hh.gdp;
    } else {
      for(var i = 0; i < count; i++) (function(i){ setTimeout(function(){ if(S && S.engine === engine) mkEnv(i); }, i * 22); })(i);
    }

    function addStrip(q, instant){
      var sh = G.mobile ? 13 + Math.random() * 8 : 15 + Math.random() * 10;
      var y = instant ? G.outY + Math.random() * (G.floorY - G.outY - 20) : G.outY - sh/2 - 2;
      var b = Bodies.rectangle(q.x, y, q.w, sh, { angle: (Math.random() - .5) * (instant ? 2 : .25), restitution: .05, friction: .4, frictionAir: .035, density: .0008, slop: .06 });
      var r = Math.random();
      b.plugin = { w: q.w, h: sh, accent: r < .15 ? 'r' : r < .22 ? 'g' : null };
      if(!instant){ Body.setVelocity(b, { x: (Math.random() - .5) * .6, y: 2.4 + Math.random() * 1.4 }); Body.setAngularVelocity(b, (Math.random() - .5) * .05); }
      Comp.add(world, b); S.strips.push(b);
    }
    S.addStrip = addStrip;

    Matter.Events.on(engine, 'beforeUpdate', function(){
      var now = performance.now();
      if(state.phase === 'shredding' && now >= S.startAt){
        var gap = Math.max(40, Math.min(150, 4200 / S.total));
        if(now - S.lastFeed > gap && S.envs.length){
          // feed the lowest envelope in the hopper
          var lo = 0; for(var i = 1; i < S.envs.length; i++) if(S.envs[i].position.y > S.envs[lo].position.y) lo = i;
          var b = S.envs.splice(lo, 1)[0];
          Comp.remove(world, b);
          S.feeding.push({ position: { x: b.position.x, y: b.position.y }, angle: b.angle, plugin: b.plugin, vy: 2 });
          S.lastFeed = now;
        }
      }
      for(var f = S.feeding.length - 1; f >= 0; f--){
        var e = S.feeding[f];
        e.vy = Math.min(6, e.vy + .5);
        e.position.y += e.vy;
        e.position.x += (G.cx - e.position.x) * .02;
        e.angle *= .8;
        S.activeUntil = now + 450;
        if(e.position.y - e.plugin.h/2 > G.slotY){
          S.feeding.splice(f, 1); S.swallowed++;
          var n = S.stripsPer, step = e.plugin.w / n;
          for(var k = 0; k < n; k++) S.queue.push({ t: now + 220 + Math.random() * 160, x: e.position.x - e.plugin.w/2 + (k + .5) * step, w: Math.max(2.6, step * .72) });
        }
      }
      for(var j = S.queue.length - 1; j >= 0; j--){
        if(S.queue[j].t <= now){ addStrip(S.queue[j]); S.queue.splice(j, 1); S.activeUntil = Math.max(S.activeUntil, now + 300); }
      }
      if(state.phase === 'shredding' && S.spawned >= S.total && !S.envs.length && !S.feeding.length && !S.queue.length){ finish(); }
    });

    if(visible){ Matter.Runner.run(runner, engine); S.raf = requestAnimationFrame(render); }
  }

  /* run the physics only while the stage is on screen */
  var visible = false, started = false;
  function pause(){
    if(!S || !S.engine) return;
    Matter.Runner.stop(S.runner);
    if(S.raf) cancelAnimationFrame(S.raf);
    S.raf = null;
  }
  function resume(){
    if(!S || !S.engine || S.raf) return;
    S.lastDraw = 0;
    Matter.Runner.run(S.runner, S.engine);
    S.raf = requestAnimationFrame(render);
  }

  function render(now){
    if(!S || !S.engine) return;
    var dt = Math.min(50, now - (S.lastDraw || now)); S.lastDraw = now;
    ctx.clearRect(0, 0, G.W, G.H);
    drawBin();
    ctx.save(); ctx.beginPath(); ctx.rect(0, G.outY, G.W, G.H - G.outY); ctx.clip();
    for(var i = 0; i < S.strips.length; i++){ var b = S.strips[i]; drawStrip(b.position.x, b.position.y, b.angle, b.id, b.plugin.w, b.plugin.h, b.plugin.accent); }
    ctx.restore();
    var active = now < S.activeUntil;
    if(active) S.teeth = (S.teeth + dt * .05) % 14;
    drawMachine(active, now);
    ctx.save(); ctx.beginPath(); ctx.rect(0, -10, G.W, G.slotY - 2 + 10); ctx.clip();
    var all = S.envs.concat(S.feeding);
    for(var k = 0; k < all.length; k++){ var e = all[k]; drawEnvelope(e.position.x, e.position.y, e.plugin.w, e.plugin.h, e.angle, e.plugin.acc); }
    ctx.restore();
    drawHopper();

    if(state.phase === 'shredding' || state.phase === 'done'){
      var target = state.phase === 'done' ? S.value : S.value * S.swallowed / S.total;
      S.shown += (target - S.shown) * Math.min(1, dt / 120);
      if(Math.abs(target - S.shown) < 50) S.shown = target;
      setHud(S.shown);
    }
    S.raf = requestAnimationFrame(render);
  }

  /* ---------------- flow ---------------- */
  var shredBtn = $('shredBtn'), resetBtn = $('resetBtn'), verdict = $('verdict');

  function shred(){
    if(state.phase === 'shredding') return;
    if(!started){ visible = true; begin(); }
    var again = state.phase === 'done';
    if(again){ refill(); }
    var r = calc();
    state.phase = 'shredding';
    shredBtn.disabled = true; shredBtn.textContent = 'Shredding…';
    hudLab.textContent = 'imaginary GDP shredded';
    if(!PHYS){ finish(); return; }
    S.value = r.hh.gdp; S.shown = 0; S.lastFeed = 0; hudShown = -1;
    S.startAt = performance.now() + (again ? S.total * 22 + 700 : 0);
  }
  function finish(){
    state.phase = 'done';
    var r = calc(), v = r.hh.gdp, g = +guess.value, d = g - v;
    if(S){ S.value = v; }
    if(!PHYS){ setHud(v); drawStaticScene(); }
    shredBtn.disabled = false; shredBtn.textContent = 'Shred again';
    $('vBig').textContent = kMoney(v);
    $('vDelta').textContent = Math.abs(d) <= Math.max(3000, v * .05) ? 'Your guess of ' + kMoney(g) + ' was nearly dead on.'
      : 'You guessed ' + kMoney(g) + ', ' + (d > 0 ? 'over' : 'under') + ' by ' + kMoney(Math.abs(d)) + '.';
    var place = r.p.t === 'u' ? 'every U.S. household' : 'every household in ' + r.p.n;
    $('vLine').textContent = Math.round(r.hh.pieces).toLocaleString('en-US') + ' pieces over ' + monthsWord(r.m) +
      ', at about $292 each. Across ' + place + ', that is ' + money(r.pl.gdp) + ' of imaginary GDP, headed for the bin.';
    verdict.hidden = false;
    renderLedger();
  }
  function refill(){
    state.phase = 'idle';
    verdict.hidden = true;
    shredBtn.disabled = false; shredBtn.textContent = 'Shred it';
    hudShown = -1; setHud(0);
    if(started) build(); else renderLedger();
    renderLedger();
  }
  function changed(){
    refill();
  }
  shredBtn.addEventListener('click', shred);
  resetBtn.addEventListener('click', refill);

  var rt = null, lastW = 0, lastH = 0;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){
      if(!started) return;
      var w = stage.clientWidth, h = stage.clientHeight;
      if(Math.abs(w - lastW) > 2 || Math.abs(h - lastH) > 80){
        lastW = w; lastH = h;
        if(state.phase === 'shredding'){ state.phase = 'done'; build(); finish(); }
        else { build(); if(state.phase === 'done' && S){ setHud(S.value); } }
        drawRank();
      }
    }, 200);
  });

  /* init */
  syncChips(); syncMonths();
  $('guessOut').textContent = kMoney(+guess.value);
  renderLedger(); setHud(0);
  function begin(){
    started = true;
    lastW = stage.clientWidth; lastH = stage.clientHeight;
    build();
  }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        visible = e.isIntersecting;
        if(visible){ if(!started) begin(); else resume(); }
        else pause();
      });
    }, { rootMargin: '200px 0px' }).observe(stage);
  } else {
    visible = true; begin();
  }
})();
