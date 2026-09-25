/* Hero: tap the mailbox, mail storms out and papers the screen, then stat cards stack up. */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.getElementById('hero');
  var stage = document.getElementById('stage');
  var pileC = document.getElementById('pile');
  var flyC = document.getElementById('fly');
  var pctx = pileC.getContext('2d');
  var fctx = flyC.getContext('2d');
  var mailbox = document.getElementById('mailbox');
  var mouth = document.getElementById('mouth');
  var copy = document.getElementById('copy');
  // Cards are read from the markup, so adding/removing a card needs no JS change.
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.card'));
  var card = cards[0];
  var hint = document.getElementById('hint');
  var replayBtns = cards.map(function(c){ return c.querySelector('.replay'); });
  var nextBtns = cards.map(function(c){ return c.querySelector('.next'); });
  var replay = replayBtns[0];
  var after = document.getElementById('intro') || document.getElementById('s1');

  var W = 0, H = 0, DPR = 1, origin = {x:0, y:0};
  var started = false, raf = null, cardShown = false, shownCount = 0, stormCapTimer = null;
  var revealY = cards.map(function(){ return 0; }), revealAt = cards.map(function(){ return 0; });
  var CARD_SETTLE_MS = 700;
  var FINAL_CARD_READ_MS = 2400;
  var stuck = [], flying = [];
  var cols = 10, rows = 18, cells = new Uint8Array(180), covered = 0, filled = false;
  var sprites = null;

  cards.forEach(function(c){ c.setAttribute('aria-hidden','true'); });
  // Always open on the yard: a reload or back-navigation would otherwise restore a spot mid-article with scrolling locked
  if('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  root.classList.add('locked');
  window.addEventListener('pageshow', function(e){
    if(e.persisted && !started){ window.scrollTo(0, 0); root.classList.add('locked'); }
  });

  /* ---------- mail sprites (drawn once, reused) ---------- */
  var M = { paper:'#FBF9F2', raised:'#EAE4D2', ink:'#1C1A14', soft:'#4A463B', faint:'#8B8575', red:'#B7362A', win:'#DDE2DB', tan:'#C9B79C', cover:'#3B3A33' };
  var SANS = 'Inter, system-ui, sans-serif';
  var SERIF = 'Fraunces, Georgia, serif';

  function rr(x, X, Y, w, h, r){
    x.beginPath(); x.moveTo(X + r, Y);
    x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  // Drop shadow for landed mail is baked into a padded copy of each sprite once,
  // instead of running a live canvas blur for every envelope that lands.
  var SHADOW = { pad:48, blur:22, dy:8, color:'rgba(20,18,12,.3)' };
  function mk(w, h, draw){
    var S = 2, c = document.createElement('canvas');
    c.width = w * S; c.height = h * S;
    var x = c.getContext('2d'); x.scale(S, S);
    x.lineJoin = 'round';
    draw(x, w, h);

    var P = SHADOW.pad, sc = document.createElement('canvas');
    sc.width = (w + P * 2) * S; sc.height = (h + P * 2) * S;
    var sx = sc.getContext('2d');
    sx.shadowColor = SHADOW.color;
    sx.shadowBlur = SHADOW.blur * S;
    sx.shadowOffsetY = SHADOW.dy * S;
    sx.drawImage(c, P * S, P * S);
    return { img:c, shadowImg:sc, w:w, h:h };
  }
  function bodyShape(x, w, h, fill){
    rr(x, 2, 2, w - 4, h - 4, 7); x.fillStyle = fill; x.fill();
  }
  function outline(x, w, h){
    rr(x, 2, 2, w - 4, h - 4, 7); x.strokeStyle = M.ink; x.lineWidth = 3; x.stroke();
  }
  function lines(x, X, Y, widths, gap, color){
    x.fillStyle = color;
    for(var i = 0; i < widths.length; i++) x.fillRect(X, Y + i * gap, widths[i], 5);
  }
  function stampBox(x, w){
    x.strokeStyle = M.ink; x.lineWidth = 2; x.strokeRect(w - 74, 18, 52, 38);
    lines(x, w - 66, 27, [36, 30, 36], 9, M.faint);
  }

  function buildSprites(){
    var list = [];
    // window envelope
    list.push(mk(300, 185, function(x, w, h){
      bodyShape(x, w, h, M.paper);
      lines(x, 22, 20, [74, 56], 10, M.faint);
      stampBox(x, w);
      x.fillStyle = M.red; x.font = '700 15px ' + SANS; x.fillText('OPEN IMMEDIATELY', 22, 72);
      rr(x, 34, 90, 150, 56, 5); x.fillStyle = M.win; x.fill(); x.strokeStyle = M.ink; x.lineWidth = 2; x.stroke();
      lines(x, 46, 102, [96, 120, 78], 12, M.soft);
      x.fillStyle = M.ink;
      for(var i = 0; i < 34; i++) x.fillRect(34 + i * 4.4, h - 28 + (i % 3 ? 3 : 0), 2, i % 3 ? 7 : 10);
      outline(x, w, h);
    }));
    // final notice
    list.push(mk(300, 185, function(x, w, h){
      bodyShape(x, w, h, M.raised);
      x.save(); rr(x, 2, 2, w - 4, h - 4, 7); x.clip();
      x.fillStyle = M.red; x.fillRect(0, 0, w, 44); x.restore();
      x.fillStyle = M.paper; x.font = '700 19px ' + SANS; x.fillText('FINAL NOTICE', 20, 30);
      x.font = '600 11px ' + SANS; x.fillText('Time-sensitive', w - 104, 28);
      lines(x, 96, 92, [120, 140, 96], 13, M.soft);
      outline(x, w, h);
    }));
    // sale postcard
    list.push(mk(300, 200, function(x, w, h){
      bodyShape(x, w, h, M.paper);
      x.beginPath(); x.arc(86, 100, 60, 0, Math.PI * 2); x.fillStyle = M.red; x.fill();
      x.fillStyle = M.paper; x.textAlign = 'center';
      x.font = '700 38px ' + SERIF; x.fillText('50%', 86, 104);
      x.font = '700 15px ' + SANS; x.fillText('OFF', 86, 128);
      x.textAlign = 'left';
      x.strokeStyle = M.faint; x.lineWidth = 1.5; x.beginPath(); x.moveTo(170, 28); x.lineTo(170, 172); x.stroke();
      stampBox(x, w);
      lines(x, 186, 104, [90, 96, 70], 13, M.soft);
      outline(x, w, h);
    }));
    // catalog
    list.push(mk(210, 280, function(x, w, h){
      bodyShape(x, w, h, M.cover);
      x.fillStyle = M.paper; x.font = 'italic 600 27px ' + SERIF; x.fillText('Fall at Home', 18, 46);
      x.fillStyle = M.tan; x.fillRect(16, 66, w - 32, 152);
      rr(x, 46, 130, 118, 32, 6); x.fillStyle = M.red; x.fill();
      rr(x, 36, 152, 138, 34, 8); x.fill();
      x.fillStyle = M.ink; x.fillRect(46, 186, 6, 16); x.fillRect(158, 186, 6, 16);
      x.fillStyle = '#BDB6A3'; x.font = '600 12px ' + SANS; x.fillText('New arrivals inside', 18, 252);
      outline(x, w, h);
    }));
    // pre-approved offer
    list.push(mk(300, 185, function(x, w, h){
      bodyShape(x, w, h, M.paper);
      x.fillStyle = M.ink; x.font = 'italic 600 22px ' + SERIF; x.fillText('You\u2019re pre-approved!', 22, 52);
      stampBox(x, w);
      x.save(); rr(x, 34, 84, 160, 62, 5); x.fillStyle = M.win; x.fill(); x.clip();
      rr(x, 118, 92, 96, 58, 6); x.fillStyle = M.red; x.fill();
      x.fillStyle = '#E9C46A'; x.fillRect(130, 108, 18, 13);
      x.restore();
      rr(x, 34, 84, 160, 62, 5); x.strokeStyle = M.ink; x.lineWidth = 2; x.stroke();
      lines(x, 44, 98, [62, 56, 66], 12, M.soft);
      outline(x, w, h);
    }));
    // plain back with flap
    list.push(mk(300, 185, function(x, w, h){
      bodyShape(x, w, h, M.raised);
      x.strokeStyle = M.soft; x.lineWidth = 2;
      x.beginPath(); x.moveTo(4, 6); x.lineTo(w / 2, h * 0.56); x.lineTo(w - 4, 6); x.stroke();
      x.beginPath(); x.moveTo(4, h - 6); x.lineTo(w * 0.4, h * 0.5); x.moveTo(w - 4, h - 6); x.lineTo(w * 0.6, h * 0.5); x.stroke();
      outline(x, w, h);
    }));
    return list;
  }
  var WEIGHTS = [3, 2, 2, 1, 2, 2];
  var WSUM = WEIGHTS.reduce(function(a, b){ return a + b; }, 0);
  function pickType(){
    var r = Math.random() * WSUM;
    for(var i = 0; i < WEIGHTS.length; i++){ r -= WEIGHTS[i]; if(r <= 0) return i; }
    return 0;
  }

  /* ---------- sizing ---------- */
  function baseW(){ return Math.max(110, Math.min(240, Math.min(W, H) * 0.32)); }
  function isSmall(){ return Math.min(W, H) < 520; }

  function measureOrigin(){
    var s = stage.getBoundingClientRect(), m = mouth.getBoundingClientRect();
    origin.x = m.left + m.width / 2 - s.left;
    origin.y = m.top + m.height / 2 - s.top;
  }
  function size(){
    var r = stage.getBoundingClientRect();
    if(Math.abs(r.width - W) < 2 && Math.abs(r.height - H) < 2 && W) { measureOrigin(); return; }
    W = r.width; H = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    [pileC, flyC].forEach(function(c){ c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    measureOrigin();
    rebake();
    if(sprites) setupGrid();
  }

  /* ---------- the pile (baked, so it costs nothing per frame) ---------- */
  function drawSprite(ctx, k, x, y, s, rot, alpha, shadowed){
    var sp = sprites[k];
    var w = baseW() * s * (sp.w / 300), h = w * sp.h / sp.w;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y); ctx.rotate(rot);
    if(shadowed){
      var k2 = w / sp.w, pw = (sp.w + SHADOW.pad * 2) * k2, ph = (sp.h + SHADOW.pad * 2) * k2;
      ctx.drawImage(sp.shadowImg, -pw / 2, -ph / 2, pw, ph);
    } else {
      ctx.drawImage(sp.img, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }
  function bakeOne(e){
    pctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawSprite(pctx, e.k, e.u * W, e.v * H, e.s, e.r, 1, true);
  }
  function rebake(){
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, pileC.width, pileC.height);
    if(!sprites) return;
    for(var i = 0; i < stuck.length; i++) bakeOne(stuck[i]);
  }
  function setupGrid(){
    cols = 10;
    rows = Math.max(6, Math.min(24, Math.round(cols * H / Math.max(W, 1))));
    cells = new Uint8Array(cols * rows); covered = 0;
    for(var i = 0; i < stuck.length; i++) mark(stuck[i]);
  }
  // Marks grid cells whose centers sit under this piece of mail (slightly shrunk, so corners don't count)
  function mark(e){
    var sp = sprites[e.k];
    var w = baseW() * e.s * (sp.w / 300), h = w * sp.h / sp.w;
    var cx = e.u * W, cy = e.v * H, c = Math.cos(-e.r), sn = Math.sin(-e.r);
    for(var r = 0; r < rows; r++){
      for(var q = 0; q < cols; q++){
        var i = r * cols + q;
        if(cells[i]) continue;
        var dx = (q + 0.5) * W / cols - cx, dy = (r + 0.5) * H / rows - cy;
        var lx = dx * c - dy * sn, ly = dx * sn + dy * c;
        if(Math.abs(lx) < w * 0.44 && Math.abs(ly) < h * 0.42){ cells[i] = 1; covered++; }
      }
    }
  }
  function uncoveredCell(){
    var open = [];
    for(var i = 0; i < cells.length; i++) if(!cells[i]) open.push(i);
    return open.length ? open[(Math.random() * open.length) | 0] : -1;
  }
  function land(e){
    stuck.push(e);
    mark(e);
    if(stuck.length > 700) stuck.shift();
    bakeOne(e);
  }

  /* ---------- flying mail ---------- */
  function spawn(delay){
    var sticks = Math.random() < 0.78;
    var tx, ty, s1;
    var gap = (covered > cells.length * 0.15 && Math.random() < 0.85) ? uncoveredCell() : -1;
    if(sticks && gap >= 0){
      tx = ((gap % cols) + 0.2 + Math.random() * 0.6) * W / cols;
      ty = (Math.floor(gap / cols) + 0.2 + Math.random() * 0.6) * H / rows;
      s1 = 0.72 + Math.random() * 0.6;
    } else if(sticks){
      tx = -0.1 * W + Math.random() * 1.2 * W;
      ty = -0.08 * H + Math.random() * 1.16 * H;
      s1 = 0.72 + Math.random() * 0.6;
    } else {
      var a = Math.random() * Math.PI * 2;
      tx = origin.x + Math.cos(a) * Math.max(W, H) * 1.1;
      ty = origin.y + Math.sin(a) * Math.max(W, H) * 0.9;
      s1 = 2.2 + Math.random() * 1.2;
    }
    var r0 = (Math.random() - 0.5) * 0.6;
    flying.push({
      k: pickType(), ox: origin.x, oy: origin.y, tx: tx, ty: ty, s1: s1,
      r0: r0, r1: r0 + (Math.random() - 0.5) * 3.2,
      lift: (0.12 + Math.random() * 0.3) * H,
      t0: performance.now() + (delay || 0),
      dur: 650 + Math.random() * 650,
      sticks: sticks
    });
  }
  function burst(n){ for(var i = 0; i < n; i++) spawn(i * 16); }

  function progress(r){
    var span = r.height - stage.offsetHeight;
    return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
  }

  var last = 0, acc = 0, lastY = 0, vel = 0;
  function frame(now){
    var dt = Math.min(64, now - last); last = now;
    var y = window.scrollY, d = Math.abs(y - lastY); lastY = y;
    vel = vel * 0.85 + d * 0.15;

    var hr = hero.getBoundingClientRect();
    var p = progress(hr);
    var heroVisible = hr.bottom > 0;
    var small = isSmall();
    if(heroVisible && !filled){
      var rate = (small ? 26 : 20) + p * (small ? 60 : 90) + Math.min(vel * (small ? 2.2 : 3), small ? 50 : 80);
      var cap = small ? 90 : 160;
      acc += rate * dt / 1000;
      while(acc >= 1){ acc -= 1; if(flying.length < cap) spawn(0); }
    }

    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, flyC.width, flyC.height);
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var keep = [];
    for(var i = 0; i < flying.length; i++){
      var f = flying[i];
      f.t = (now - f.t0) / f.dur;
      if(f.t >= 1){
        if(f.sticks) land({ k:f.k, u:f.tx / W, v:f.ty / H, s:f.s1, r:f.r1 });
        continue;
      }
      keep.push(f);
    }
    flying = keep;
    keep.sort(function(a, b){ return a.t - b.t; });
    for(var j = 0; j < keep.length; j++){
      var q = keep[j];
      if(q.t < 0) continue;
      var t = q.t, e = Math.pow(t, 1.7);
      var px = q.ox + (q.tx - q.ox) * e;
      var py = q.oy + (q.ty - q.oy) * e - q.lift * 4 * t * (1 - t) * 0.6;
      var s = 0.07 + (q.s1 - 0.07) * Math.pow(t, 2.1);
      drawSprite(fctx, q.k, px, py, s, q.r0 + (q.r1 - q.r0) * t, Math.min(1, t / 0.08));
    }

    if(!filled && covered >= cells.length){
      filled = true;
      setTimeout(function(){ if(filled) showCard(true); }, 350);
    }
    if(filled && flying.length === 0){ raf = null; return; }
    raf = requestAnimationFrame(frame);
  }

  function ensureHeroRunway(remainingCards){
    if(!onScreenHero()) return;

    var heroRect = hero.getBoundingClientRect();
    var stageH = stage.getBoundingClientRect().height || H || window.innerHeight;
    var distance = Math.max(180, Math.min(320, stageH * 0.33)) * 0.70;

    // Remaining card transitions + a full viewport of breathing room after
    // the final card. This is intentionally scroll-distance based rather than
    // just time based, so the sticky stage cannot release mid-read.
    var neededRemaining = (remainingCards * distance) + stageH * 1.15;
    var currentRemaining = heroRect.bottom - stageH;

    if(currentRemaining < neededRemaining){
      var growBy = neededRemaining - currentRemaining;
      hero.style.height = (hero.offsetHeight + growBy) + 'px';
    }
  }

  function onScreenHero(){
    var r = hero.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  // Show or hide card k. Showing stacks it on the previous card; hiding also
  // hides every later card. Same choreography as the original 4-card version.
  function showCardAt(k, on){
    var c = cards[k]; if(!c) return;
    var last = cards.length - 1;
    c.classList.toggle('show', on);
    c.setAttribute('aria-hidden', on ? 'false' : 'true');
    if(k > 0) cards[k-1].classList.toggle('under', on);
    if(on){
      shownCount = Math.max(shownCount, k + 1);
      ensureHeroRunway(last - k);
      if(k === last){
        // Guarantee a full reading runway after the final card appears.
        var heroRect = hero.getBoundingClientRect();
        var stageH = stage.getBoundingClientRect().height || H || window.innerHeight;
        var finalRunway = stageH * 1.15;
        var remaining = heroRect.bottom - stageH;
        if(remaining < finalRunway){
          hero.style.height = (hero.offsetHeight + (finalRunway - remaining)) + 'px';
        }
      }
      revealY[k] = window.scrollY;
      revealAt[k] = performance.now();
    } else {
      shownCount = Math.min(shownCount, k);
      revealY[k] = 0; revealAt[k] = 0;
      showCardAt(k + 1, false);
    }
    if(k === 0){
      cardShown = on;
      hint.classList.toggle('show', started && !on && !reduce);
      stage.classList.toggle('card-open', on);
    }
  }
  function showCard(on){ showCardAt(0, on); }

  function maybeShowCards(){
    if(!cardShown) return;
    var k = shownCount;                 // next card to reveal
    if(k >= cards.length) return;
    // 1) let the newest card settle; 2) discard inertial scroll during that time;
    // 3) require the same fresh scroll distance before the next card.
    var now = performance.now();
    var distance = Math.max(180, Math.min(320, H * 0.33)) * 0.70;
    if(now - revealAt[k-1] < CARD_SETTLE_MS){ revealY[k-1] = window.scrollY; return; }
    if(window.scrollY - revealY[k-1] >= distance) showCardAt(k, true);
  }

  /* ---------- start / reset ---------- */
  function start(){
    if(started) return;
    started = true;
    if(!sprites) sprites = buildSprites();
    size();
    setupGrid();
    root.classList.remove('locked');
    stage.classList.add('opened');
    copy.classList.add('gone');
    mailbox.setAttribute('aria-disabled', 'true');
    mailbox.setAttribute('tabindex', '-1');

    if(reduce){
      var guard = 0;
      while(covered < cells.length && guard++ < 500){
        var g = guard < 40 ? -1 : uncoveredCell();
        var u = g < 0 ? -0.1 + Math.random() * 1.2 : ((g % cols) + 0.5) / cols;
        var v = g < 0 ? -0.08 + Math.random() * 1.16 : (Math.floor(g / cols) + 0.5) / rows;
        land({ k:pickType(), u:u, v:v, s:0.72 + Math.random() * 0.6, r:(Math.random() - 0.5) * 1.6 });
      }
      filled = true;
      showCard(true);
      replay.focus({ preventScroll:true });
      return;
    }
    burst(isSmall() ? 28 : 46);
    // Hard cap the mail-storm so the first stat card appears within 3 seconds.
    clearTimeout(stormCapTimer);
    stormCapTimer = setTimeout(function(){
      if(!started || cardShown) return;
      filled = true;
      flying = [];
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, flyC.width, flyC.height);
      showCard(true);
    }, 2900);
    hint.classList.add('show');
    last = performance.now(); lastY = window.scrollY;
    raf = requestAnimationFrame(frame);
  }

  function reset(){
    if(raf) cancelAnimationFrame(raf);
    clearTimeout(stormCapTimer);
    stormCapTimer = null;
    raf = null; started = false; filled = false; flying = []; stuck = []; acc = 0; vel = 0;
    for(var ri = 0; ri < cards.length; ri++){ revealY[ri] = 0; revealAt[ri] = 0; }
    hero.style.height = '';
    cells = new Uint8Array(cols * rows); covered = 0;
    rebake();
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, flyC.width, flyC.height);
    showCard(false);
    hint.classList.remove('show');
    stage.classList.remove('opened');
    copy.classList.remove('gone');
    mailbox.removeAttribute('aria-disabled');
    mailbox.setAttribute('tabindex', '0');
    try { window.scrollTo({ top:0, behavior:'instant' }); } catch(err){ window.scrollTo(0, 0); }
    root.classList.add('locked');
    mailbox.focus({ preventScroll:true });
  }

  mailbox.addEventListener('click', start);
  mailbox.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); start(); }
  });
  replayBtns.forEach(function(b){ if(b) b.addEventListener('click', reset); });
  nextBtns.forEach(function(b, i){
    if(!b) return;
    if(i < cards.length - 1){
      b.addEventListener('click', function(){ showCardAt(i + 1, true); });
    } else {
      b.addEventListener('click', function(){
        var elapsed = performance.now() - revealAt[i];
        if(cards[i].classList.contains('show') && elapsed < FINAL_CARD_READ_MS){
          // Keep the card in place for a short reading beat before allowing the article transition.
          return;
        }
        after.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block:'start' });
        after.focus({ preventScroll:true });
      });
    }
  });

  window.addEventListener('scroll', maybeShowCards, { passive:true });

  // Trying to scroll before opening the mailbox gives it a little jiggle
  var nudgeTimer = null;
  function nudge(){
    if(started || reduce) return;
    mailbox.classList.remove('nudge'); void mailbox.getBoundingClientRect();
    mailbox.classList.add('nudge');
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(function(){ mailbox.classList.remove('nudge'); }, 520);
  }
  window.addEventListener('wheel', nudge, { passive:true });
  window.addEventListener('touchmove', nudge, { passive:true });

  if('ResizeObserver' in window){
    new ResizeObserver(function(){ requestAnimationFrame(size); }).observe(stage);
  } else {
    window.addEventListener('resize', size);
  }
  size();
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ if(!sprites) sprites = buildSprites(); });
  }
})();
