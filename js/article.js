/* Article body: animated counters, Matter.js mail piles, scene reveals. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- counters ---------- */
  function formatNum(val, decimals, prefix, suffix) {
    var parts = val.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (prefix || '') + parts.join('.') + (suffix || '');
  }

  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = formatNum(target, decimals, prefix, suffix);
      return;
    }
    var start = null;
    var duration = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(target * eased, decimals, prefix, suffix);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.done) {
        entry.target.dataset.done = '1';
        countObserver.unobserve(entry.target);
        runCount(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ---------- mail pile system (hero, spam-race minis, kicker) ---------- */
  function readColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  var palette = {
    paper: readColor('--paper-contrast', '#FBF9F2'),
    paperRaised: readColor('--paper-raised', '#E8E3D3'),
    red: readColor('--red', '#B7362A'),
    green: readColor('--green', '#2E6B4F'),
    line: readColor('--rule', 'rgba(28,26,20,0.14)'),
    ink: readColor('--ink-faint', '#8B8575')
  };

  var STEP_MS = 1000 / 60; // fixed physics step: same speed on 60Hz and 120Hz screens

  function createMailPile(cfg) {
    var stage = cfg.stage, canvas = cfg.canvas;
    if (!stage || !canvas) return;
    var ctx = canvas.getContext('2d');
    var isMobile = window.matchMedia('(max-width: 640px)').matches;
    var COUNT = isMobile ? cfg.mobileCount : cfg.count;
    var SPAWN_MS = isMobile ? (cfg.mobileSpawnMs || cfg.spawnMs) : cfg.spawnMs;
    var envMin = isMobile ? cfg.envMinMobile : cfg.envMinDesktop;
    var envMax = isMobile ? cfg.envMaxMobile : cfg.envMaxDesktop;
    var bodyColors = cfg.bodyColors || [palette.paper, palette.paperRaised];
    var accentColor = cfg.accentColor || palette.red;
    var accentColor2 = cfg.accentColor2 || null;
    var accentRatio = (cfg.accentRatio != null) ? cfg.accentRatio : 0.14;

    function pickShade() { return bodyColors[Math.random() < 0.5 ? 0 : 1]; }
    function pickAccentColor() {
      return (accentColor2 && Math.random() < 0.5) ? accentColor2 : accentColor;
    }

    var figureRevealed = false;
    function revealFigure() {
      if (figureRevealed) return;
      figureRevealed = true;
      if (cfg.figure) {
        cfg.figure.classList.add('show');
        var num = cfg.figure.querySelector('[data-count]');
        if (num) runCount(num);
      }
    }

    // Optional early reveal driven by scroll position, so the figure card
    // doesn't wait for every envelope to settle.
    if (cfg.revealOnScrollEl) {
      var revealAt = (cfg.revealAtViewportRatio != null) ? cfg.revealAtViewportRatio : 0.56;
      var revealTicking = false;
      var checkFigureScrollReveal = function () {
        if (figureRevealed) return;
        if (cfg.revealOnScrollEl.getBoundingClientRect().top <= window.innerHeight * revealAt) {
          revealFigure();
          window.removeEventListener('scroll', onFigureScroll);
        }
      };
      var onFigureScroll = function () {
        if (revealTicking || figureRevealed) return;
        revealTicking = true;
        requestAnimationFrame(function () { revealTicking = false; checkFigureScrollReveal(); });
      };
      window.addEventListener('scroll', onFigureScroll, { passive: true });
      requestAnimationFrame(checkFigureScrollReveal);
    }

    function drawEnvelope(x, y, w, h, angle, shade, accent) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 2); else ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = shade;
      ctx.fill();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = palette.ink;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(0, h * 0.08);
      ctx.lineTo(w / 2, -h / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (accent) {
        ctx.fillStyle = accent;
        ctx.fillRect(w / 2 - w * 0.26, -h / 2 + h * 0.16, w * 0.18, h * 0.18);
      }
      ctx.restore();
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dims = { width: 0, height: 0 };
    function sizeCanvas() {
      var rect = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dims.width = rect.width;
      dims.height = rect.height;
    }
    sizeCanvas();

    function newEnvelope() {
      var w = envMin + Math.random() * (envMax - envMin);
      var accented = Math.random() < accentRatio;
      return { w: w, h: w * (0.58 + Math.random() * 0.08), shade: accented ? bodyColors[0] : pickShade(), accent: accented ? pickAccentColor() : null };
    }

    /* Reduced motion: a static pile, drawn once. */
    if (reduceMotion) {
      var baseN = cfg.fillFrame ? (isMobile ? (cfg.mobileFillCap || COUNT) : (cfg.fillCap || COUNT)) : COUNT;
      var n = Math.max(1, Math.round(baseN * 0.6));
      var seed = 7;
      var rand = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var perRow = Math.max(2, Math.floor(dims.width / (envMax * 1.15)));
      for (var i = 0; i < n; i++) {
        var w = envMin + rand() * (envMax - envMin), h = w * 0.62;
        var accented = rand() < accentRatio;
        drawEnvelope(
          14 + rand() * (dims.width - 28),
          dims.height - 14 - Math.floor(i / perRow) * (h * 0.72) - rand() * 6,
          w, h, (rand() - 0.5) * 0.7,
          accented ? bodyColors[0] : bodyColors[rand() < 0.5 ? 0 : 1],
          accented ? pickAccentColor() : null
        );
      }
      revealFigure();
      return;
    }

    /* Matter.js failed to load: simple shower without collisions. */
    if (typeof window.Matter === 'undefined') {
      fallbackShower();
      return;
    }

    var Engine = Matter.Engine, Composite = Matter.Composite, Bodies = Matter.Bodies,
        Body = Matter.Body, Sleeping = Matter.Sleeping;

    var engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1;
    var world = engine.world;

    // Ground is extra wide so a later resize never leaves envelopes without a floor.
    var ground = Bodies.rectangle(dims.width / 2, dims.height + 26, dims.width + 4000, 60, { isStatic: true, friction: 0.7 });
    var wallL = Bodies.rectangle(-24, dims.height / 2, 40, dims.height * 3, { isStatic: true });
    var wallR = Bodies.rectangle(dims.width + 24, dims.height / 2, 40, dims.height * 3, { isStatic: true });
    Composite.add(world, [ground, wallL, wallR]);

    var state = { spawned: 0, spawning: true, crashed: false, done: false, raining: false };
    var spawnTimer = null, rainTimer = null;
    var pileVisible = true;

    /* One rAF loop per pile (physics + draw). It stops when the pile is off
       screen or fully asleep, and wake() restarts it when something changes. */
    var raf = 0, lastT = 0, acc = 0;

    function draw() {
      ctx.clearRect(0, 0, dims.width, dims.height);
      var bodies = Composite.allBodies(world);
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        if (b.isStatic) continue;
        var m = b.plugin;
        drawEnvelope(b.position.x, b.position.y, m.w, m.h, b.angle, m.shade, m.accent);
      }
    }

    function allAsleep() {
      var bodies = Composite.allBodies(world);
      for (var i = 0; i < bodies.length; i++) {
        if (!bodies[i].isStatic && !bodies[i].isSleeping) return false;
      }
      return true;
    }

    function loop(now) {
      raf = 0;
      if (state.done) return;
      if (!pileVisible && !state.crashed) { lastT = 0; return; }

      acc += lastT ? Math.min(now - lastT, 100) : STEP_MS;
      lastT = now;
      var steps = 0;
      while (acc >= STEP_MS && steps < 4) { Engine.update(engine, STEP_MS); acc -= STEP_MS; steps++; }
      if (steps === 4) acc = 0;
      draw();

      if (state.crashed) {
        var gone = Composite.allBodies(world).every(function (b) { return b.isStatic || b.position.y > dims.height + 140; });
        if (gone) {
          state.done = true;
          stage.classList.add('is-gone');
          if (cfg.onCrashDone) cfg.onCrashDone();
          // if the reader already scrolled back up during the fall, refill without waiting for a scroll
          setTimeout(checkCrash, 900);
          return;
        }
      } else if (!state.spawning && !state.raining && allAsleep()) {
        lastT = 0; // idle: canvas keeps the last frame
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function wake() {
      if (raf || state.done || (!pileVisible && !state.crashed)) return;
      lastT = 0; acc = 0;
      raf = requestAnimationFrame(loop);
    }

    new IntersectionObserver(function (entries) {
      pileVisible = entries[entries.length - 1].isIntersecting;
      if (pileVisible) wake();
    }, { rootMargin: '150px 0px' }).observe(stage);

    new ResizeObserver(function () {
      var r = stage.getBoundingClientRect();
      if (Math.abs(r.width - dims.width) < 2 && Math.abs(r.height - dims.height) < 2) return;
      sizeCanvas();
      if (!state.crashed) Body.setPosition(ground, { x: dims.width / 2, y: dims.height + 26 });
      Body.setPosition(wallR, { x: dims.width + 24, y: dims.height / 2 });
      Composite.allBodies(world).forEach(function (b) { if (!b.isStatic) Sleeping.set(b, false); });
      draw();
      wake();
    }).observe(stage);

    function spawnOne() {
      var env = newEnvelope();
      var body = Bodies.rectangle(dims.width * (0.06 + Math.random() * 0.88), -30 - Math.random() * 40, env.w, env.h, {
        angle: (Math.random() - 0.5) * 1.2,
        restitution: 0.12,
        friction: 0.55,
        frictionAir: 0.012,
        chamfer: { radius: 2 }
      });
      env.born = performance.now();
      body.plugin = env;
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);
      Composite.add(world, body);
      state.spawned++;
      wake();
    }

    function isFilled() {
      if (!cfg.fillFrame) return true;
      var minY = dims.height, any = false;
      Composite.allBodies(world).forEach(function (b) {
        if (!b.isStatic && (b.isSleeping || b.speed < 0.4)) { any = true; minY = Math.min(minY, b.position.y); }
      });
      return any && minY < dims.height * (cfg.fillCheckY != null ? cfg.fillCheckY : 0.2);
    }

    var fillCap = isMobile ? (cfg.mobileFillCap || cfg.mobileCount) : (cfg.fillCap || cfg.count);
    var fillBatch = cfg.fillBatch || 8;

    function startContinuousRain() {
      if (state.raining || !cfg.continuousAfterReveal || state.crashed) return;
      state.raining = true;
      var maxBodies = isMobile ? 150 : 240;
      rainTimer = setInterval(function () {
        if (state.crashed || !pileVisible) return;
        var dynamic = Composite.allBodies(world).filter(function (b) { return !b.isStatic; });
        if (dynamic.length >= maxBodies) {
          dynamic.sort(function (a, b) { return a.plugin.born - b.plugin.born; });
          var removeN = dynamic.length - maxBodies + 1;
          for (var r = 0; r < removeN; r++) Composite.remove(world, dynamic[r]);
        }
        spawnOne();
      }, cfg.continuousSpawnMs || 420);
    }

    function finishSpawning() {
      state.spawning = false;
      revealFigure();
      startContinuousRain();
      wake();
    }

    function topUp() {
      if (state.crashed) { revealFigure(); return; }
      if (!pileVisible) { setTimeout(topUp, 550); return; }
      if (isFilled() || state.spawned >= fillCap) { finishSpawning(); return; }
      var batch = Math.min(fillBatch, fillCap - state.spawned);
      for (var i = 0; i < batch; i++) spawnOne();
      setTimeout(topUp, 550);
    }

    var checkCrash = function () {};
    var gen = 0; // bumps on every refill so timers from an earlier round are ignored
    function startSpawning() {
      var myGen = gen;
      spawnTimer = setInterval(function () {
        if (myGen !== gen) { clearInterval(spawnTimer); return; }
        if (state.spawned >= COUNT || state.crashed) {
          clearInterval(spawnTimer);
          if (!state.crashed) {
            if (cfg.fillFrame) setTimeout(topUp, 550);
            else setTimeout(function () { if (myGen === gen) finishSpawning(); }, 700);
          }
          return;
        }
        if (pileVisible) spawnOne();
      }, SPAWN_MS);
    }
    startSpawning();

    // A crashed pile refills when the reader scrolls back up to it, so the
    // section never sits there as an empty box.
    function refill() {
      gen++;
      clearInterval(spawnTimer);
      clearInterval(rainTimer);
      Composite.allBodies(world).forEach(function (b) { if (!b.isStatic) Composite.remove(world, b); });
      Body.setPosition(ground, { x: dims.width / 2, y: dims.height + 26 });
      Composite.add(world, ground);
      engine.gravity.y = 1;
      state.spawned = 0; state.spawning = true; state.crashed = false; state.done = false; state.raining = false;
      ctx.clearRect(0, 0, dims.width, dims.height);
      stage.classList.remove('is-gone');
      if (cfg.onRefill) cfg.onRefill();
      startSpawning();
      wake();
    }

    function triggerCrash() {
      if (state.crashed) return;
      state.crashed = true;
      state.spawning = false;
      clearInterval(spawnTimer);
      clearInterval(rainTimer);
      Composite.remove(world, ground);
      engine.gravity.y = 2.4;
      Composite.allBodies(world).forEach(function (b) {
        if (b.isStatic) return;
        Sleeping.set(b, false);
        Body.setVelocity(b, { x: (Math.random() - 0.5) * 16, y: 5 + Math.random() * 7 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.7);
      });
      wake();
    }

    if (cfg.crashScrollEl) {
      var ticking = false;
      checkCrash = function () {
        var bottom = cfg.crashScrollEl.getBoundingClientRect().bottom;
        if (bottom < 60) triggerCrash();
        // back in view after it has fully fallen away: rebuild it
        else if (state.done && bottom > Math.min(window.innerHeight * 0.6, 420)) refill();
      };
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; checkCrash(); });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    wake();

    /* ---- dependency-free fallback (only if vendor/matter.min.js fails) ---- */
    function fallbackShower() {
      var particles = [];
      var start = performance.now();
      var duration = cfg.fillFrame ? 2700 : 1800;
      var total = cfg.fillFrame ? (isMobile ? (cfg.mobileFillCap || 90) : (cfg.fillCap || 150)) : COUNT;
      total = Math.max(Math.min(total, isMobile ? 90 : 150), COUNT);
      var crashing = false, showerDone = false;

      for (var i = 0; i < total; i++) {
        var env = newEnvelope();
        var band = i / Math.max(1, total - 1);
        env.x = dims.width * (0.04 + Math.random() * 0.92);
        env.y = -env.h - Math.random() * dims.height * 0.55;
        env.a = (Math.random() - 0.5) * 1.1;
        env.va = (Math.random() - 0.5) * 0.035;
        env.vy = 1.4 + Math.random() * 2.5;
        env.delay = Math.random() * duration * 0.72;
        env.restY = dims.height - 10 - (band * dims.height * (cfg.fillFrame ? 0.78 : 0.42)) - Math.random() * 18;
        particles.push(env);
      }

      if (cfg.crashScrollEl) {
        var onScroll = function () {
          if (cfg.crashScrollEl.getBoundingClientRect().bottom < 60) {
            window.removeEventListener('scroll', onScroll);
            crashing = true;
            particles.forEach(function (p) { p.vy = 5 + Math.random() * 7; p.vx = (Math.random() - 0.5) * 10; p.va = (Math.random() - 0.5) * 0.18; });
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
      }

      function tick(now) {
        var elapsed = now - start;
        ctx.clearRect(0, 0, dims.width, dims.height);
        var moving = false, allGone = true;
        particles.forEach(function (p) {
          if (elapsed < p.delay && !crashing) { moving = true; allGone = false; return; }
          if (crashing) { p.x += p.vx || 0; p.y += p.vy; p.vy += 0.13; p.a += p.va; }
          else if (p.y < p.restY) {
            p.y = Math.min(p.restY, p.y + p.vy + Math.min(1, (elapsed - p.delay) / 900) * 3.6);
            p.a += p.va;
            moving = true;
          }
          if (p.y < dims.height + 120) allGone = false;
          drawEnvelope(p.x, p.y, p.w, p.h, p.a, p.shade, p.accent);
        });
        if (!crashing && !showerDone && elapsed >= duration) { showerDone = true; revealFigure(); }
        if (crashing && allGone) {
          stage.classList.add('is-gone');
          if (cfg.onCrashDone) cfg.onCrashDone();
          return;
        }
        if (moving || crashing || !showerDone) requestAnimationFrame(tick);
        else if (cfg.crashScrollEl) {
          // settled: restart only when the crash fires
          var poll = function () { if (crashing) requestAnimationFrame(tick); else setTimeout(poll, 250); };
          poll();
        }
      }
      requestAnimationFrame(tick);
    }
  }

  function lazyInit(triggerEl, fn, options) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && (!options || entry.intersectionRatio >= (options.minRatio || 0))) {
          io.disconnect();
          fn();
        }
      });
    }, options && options.io || { rootMargin: '200px 0px' });
    io.observe(triggerEl);
  }

  // GDP thought experiment: mail showers in and stays piled up.
  var heroFigure = document.getElementById('pileFigure');
  var heroNum = heroFigure && heroFigure.querySelector('[data-count]');
  if (heroNum) { countObserver.unobserve(heroNum); heroNum.dataset.done = '1'; }
  lazyInit(document.getElementById('s1'), function () {
    createMailPile({
      stage: document.getElementById('pileStage'),
      canvas: document.getElementById('pileCanvas'),
      figure: heroFigure,
      revealOnScrollEl: document.getElementById('pileStage'),
      revealAtViewportRatio: 0.56,
      count: 50, mobileCount: 24, spawnMs: 34, mobileSpawnMs: 50,
      fillFrame: true, fillCap: 300, mobileFillCap: 160, fillCheckY: 0.2, fillBatch: 10,
      envMinDesktop: 40, envMaxDesktop: 56, envMinMobile: 30, envMaxMobile: 40,
      accentRatio: 0.14, accentColor: palette.red,
      continuousAfterReveal: true,
      continuousSpawnMs: 390
    });
  });

  // Spam comparison: starts once the reader is in the section so the fall is visible.
  // Counts are compressed but keep the ~13.6:1 GDP ratio ($62,000 vs $4,560).
  lazyInit(document.getElementById('s2'), function () {
    createMailPile({
      stage: document.getElementById('junkPileStage'),
      canvas: document.getElementById('junkPileCanvas'),
      count: 54, mobileCount: 40, spawnMs: 34, mobileSpawnMs: 42,
      envMinDesktop: 16, envMaxDesktop: 22, envMinMobile: 14, envMaxMobile: 18,
      accentRatio: 0.16, accentColor: palette.red
    });
    createMailPile({
      stage: document.getElementById('spamPileStage'),
      canvas: document.getElementById('spamPileCanvas'),
      count: 4, mobileCount: 3, spawnMs: 120, mobileSpawnMs: 140,
      envMinDesktop: 16, envMaxDesktop: 22, envMinMobile: 14, envMaxMobile: 18,
      accentRatio: 0.6, accentColor: palette.green
    });
  }, { minRatio: 0.28, io: { threshold: [0.28, 0.4] } });

  // Kicker: everything in one pile; it crashes as you scroll past.
  lazyInit(document.getElementById('s5'), function () {
    var kickerNote = document.getElementById('kickerPileNote');
    var kickerNoteText = kickerNote ? kickerNote.textContent : '';
    createMailPile({
      stage: document.getElementById('kickerPileStage'),
      canvas: document.getElementById('kickerPileCanvas'),
      count: 56, mobileCount: 26, spawnMs: 45, mobileSpawnMs: 65,
      envMinDesktop: 32, envMaxDesktop: 46, envMinMobile: 24, envMaxMobile: 32,
      accentRatio: 0.45, accentColor: palette.red, accentColor2: palette.green,
      crashScrollEl: document.getElementById('s5'),
      onCrashDone: function () { if (kickerNote) kickerNote.textContent = "Gone. That's the idea."; },
      onRefill: function () { if (kickerNote) kickerNote.textContent = kickerNoteText; }
    });
  });

  /* ---------- scene reveal ---------- */
  var sceneList = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  document.documentElement.classList.add('scene-reveal-ready');
  var sceneObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      // Also reveal every scene above this one, so a section skipped by a fast
      // flick can never stay stuck at opacity:0.
      var idx = sceneList.indexOf(entry.target);
      for (var i = 0; i <= idx; i++) {
        if (!sceneList[i].classList.contains('in-view')) {
          sceneList[i].classList.add('in-view');
          sceneObserver.unobserve(sceneList[i]);
        }
      }
    });
  // Trigger on position rather than visible ratio: a ratio threshold can never be
  // reached by a section taller than the viewport, leaving it stuck invisible.
  }, { threshold: 0, rootMargin: window.matchMedia('(max-width:680px)').matches ? '0px 0px -6% 0px' : '0px 0px -18% 0px' });
  sceneList.forEach(function (el) { sceneObserver.observe(el); });
})();
