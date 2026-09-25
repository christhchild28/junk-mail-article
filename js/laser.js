/* Opt-out section: falling mail gets zapped by lasers. Runs only while on screen. */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = document.getElementById('laserMailstormStage');
  var canvas = document.getElementById('laserMailstormCanvas');
  var ctx = canvas.getContext('2d');
  var bg = document.createElement('canvas'); // static haze/ground/emitter glow, drawn once per resize
  var bgCtx = bg.getContext('2d');

  var dpr = 1, W = 0, H = 0, groundY = 0;
  var pieces = [], lasers = [], sparks = [];
  var raf = 0, last = 0;
  var spawnAcc = 0, laserAcc = 0;

  var palette = {
    paper: '#FBF9F2',
    paper2: '#EFE7D4',
    stroke: 'rgba(28,26,20,.34)',
    red: '#C23A2B',
    blue: '#3D79B7',
    green: '#2E6B4F',
    gold: '#C4912F'
  };

  function rand(min,max){ return min + Math.random() * (max-min); }
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }

  function size(){
    var rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    groundY = H - 26;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    bg.width = canvas.width;
    bg.height = canvas.height;
    bgCtx.setTransform(dpr,0,0,dpr,0,0);
    drawBackground(bgCtx);
  }

  function makePiece(){
    var w = rand(14, 32);
    var h = w * rand(.58, .72);
    return {
      x: rand(10, W - 10),
      y: -rand(20, 180),
      w: w, h: h,
      vy: rand(62, 110),
      drift: rand(-14, 14),
      angle: rand(-0.45, 0.45),
      spin: rand(-0.9, 0.9),
      shade: Math.random() < .5 ? palette.paper : palette.paper2,
      accent: Math.random() < .35 ? pick([palette.red, palette.blue, palette.green, palette.gold]) : null,
      landed: false,
      targetQueued: false,
      settleDelay: rand(.06, .22)
    };
  }

  function spawnPiece(){
    if(pieces.length > 180) return;
    pieces.push(makePiece());
  }

  function drawEnvelope(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.fillStyle = p.shade;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-p.w/2, -p.h/2, p.w, p.h, 2);
    else ctx.rect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-p.w/2, -p.h/2);
    ctx.lineTo(0, p.h*0.08);
    ctx.lineTo(p.w/2, -p.h/2);
    ctx.stroke();

    if(p.accent){
      ctx.fillStyle = p.accent;
      ctx.fillRect(p.w*0.15, -p.h*0.28, p.w*0.18, p.h*0.18);
    }
    ctx.restore();
  }

  function queueLaser(piece){
    if(piece.targetQueued) return;
    piece.targetQueued = true;

    var from = pick(['left','right','left','right','top']);
    var sx, sy, color;
    if(from === 'left'){
      sx = -32;
      sy = rand(H*.10, H*.55);
      color = palette.red;
    } else if(from === 'right'){
      sx = W + 32;
      sy = rand(H*.12, H*.58);
      color = palette.blue;
    } else {
      sx = rand(W*.22, W*.78);
      sy = -10;
      color = palette.gold;
    }

    lasers.push({
      sx: sx, sy: sy,
      tx: piece.x,
      ty: piece.y - piece.h * 0.12,
      age: 0,
      life: rand(.06, .12),
      color: color,
      piece: piece
    });
  }

  function burst(x, y, color){
    var n = 10 + ((Math.random()*8)|0);
    for(var i=0; i<n; i++){
      sparks.push({
        x: x, y: y,
        vx: rand(-110, 110),
        vy: rand(-120, -15),
        age: 0,
        life: rand(.18, .55),
        size: rand(1.6, 3.6),
        color: color
      });
    }
  }

  function update(dt){
    spawnAcc += dt;
    while(spawnAcc >= 0.028){
      spawnAcc -= 0.028;
      spawnPiece();
    }

    laserAcc += dt;
    if(laserAcc >= 0.04){
      laserAcc = 0;
      var landed = [];
      for(var li = 0; li < pieces.length; li++){
        if(pieces[li].landed && !pieces[li].targetQueued) landed.push(pieces[li]);
      }
      var shots = landed.length > 20 ? 3 : (landed.length > 10 ? 2 : 1);
      for(var i=0; i<shots && landed.length; i++){
        queueLaser(landed.splice((Math.random()*landed.length)|0, 1)[0]);
      }
    }

    for(var i2 = pieces.length - 1; i2 >= 0; i2--){
      var pc = pieces[i2];
      if(!pc.landed){
        pc.vy += 360 * dt;
        pc.y += pc.vy * dt;
        pc.x += pc.drift * dt;
        pc.angle += pc.spin * dt;

        if(pc.y + pc.h * 0.5 >= groundY){
          pc.y = groundY - pc.h * 0.5;
          pc.landed = true;
          pc.vy = 0;
          pc.spin *= 0.18;
          pc.drift = 0;
        }
      } else if(!pc.targetQueued){
        pc.settleDelay -= dt;
        if(pc.settleDelay <= 0) queueLaser(pc);
      }
    }

    for(var j = lasers.length - 1; j >= 0; j--){
      var l = lasers[j];
      l.age += dt;
      if(l.age >= l.life){
        if(l.piece){
          burst(l.piece.x, l.piece.y, l.color);
          var idx = pieces.indexOf(l.piece);
          if(idx !== -1) pieces.splice(idx, 1);
          l.piece = null;
        }
        lasers.splice(j, 1);
      }
    }

    for(var k = sparks.length - 1; k >= 0; k--){
      var sp = sparks[k];
      sp.age += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 240 * dt;
      if(sp.age >= sp.life) sparks.splice(k, 1);
    }
  }

  function drawBackground(c){
    var haze = c.createLinearGradient(0, 0, 0, groundY);
    haze.addColorStop(0, 'rgba(255,255,255,.10)');
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = haze;
    c.fillRect(0,0,W,groundY);

    var g = c.createLinearGradient(0, groundY - 14, 0, H);
    g.addColorStop(0, 'rgba(168,151,119,.10)');
    g.addColorStop(1, 'rgba(145,125,88,.22)');
    c.fillStyle = g;
    c.fillRect(0, groundY, W, H-groundY);

    var emitters = [
      {x:-6, y:H*0.23, c:'rgba(194,58,43,.6)'},
      {x:W+6, y:H*0.36, c:'rgba(61,121,183,.6)'},
      {x:W*0.5, y:-4, c:'rgba(196,145,47,.52)'}
    ];
    emitters.forEach(function(e){
      var gr = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 34);
      gr.addColorStop(0, e.c);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.arc(e.x, e.y, 34, 0, Math.PI*2);
      c.fill();
    });
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(bg, 0, 0, W, H);

    for(var i=0;i<pieces.length;i++) drawEnvelope(pieces[i]);

    for(var i2=0;i2<lasers.length;i2++){
      var l = lasers[i2];
      var a = 1 - (l.age / l.life);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(l.sx, l.sy);
      ctx.lineTo(l.tx, l.ty);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(l.sx, l.sy);
      ctx.lineTo(l.tx, l.ty);
      ctx.stroke();

      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(l.tx, l.ty, 2.6 + 5 * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for(var k=0;k<sparks.length;k++){
      var sp = sparks[k];
      var a2 = 1 - (sp.age / sp.life);
      ctx.globalAlpha = a2;
      ctx.fillStyle = sp.color;
      ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
    }
    ctx.globalAlpha = 1;
  }

  function frame(ts){
    if(!last) last = ts;
    var dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start(){
    if(reduce) return;
    if(raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop(){
    if(raf){
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  size();

  new ResizeObserver(function(){ size(); if(!raf) draw(); }).observe(stage);

  new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting) start();
      else stop();
    });
  }, {threshold:0}).observe(stage);
})();
