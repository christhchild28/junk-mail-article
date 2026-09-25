/* Mailstream flow chart: category -> household group ribbons with flowing mail.
   One component, two datasets: <junk-mail-flow variant="income|age">.
   Ribbons and labels are SVG; the moving particles are drawn on a canvas
   overlay (much cheaper than updating ~120 SVG nodes every frame). */
(function () {
  'use strict';

  var CATEGORIES = [
    { id: 'retail', name: 'Retail + catalogs', daily: 38800000, color: '#e15759' },
    { id: 'credit', name: 'Credit + financial', daily: 28000000, color: '#4e79a7' },
    { id: 'local', name: 'Local services', daily: 24200000, color: '#59a14f' },
    { id: 'insurance', name: 'Insurance + health', daily: 19300000, color: '#f28e2b' },
    { id: 'fundraising', name: 'Fundraising', daily: 16800000, color: '#b07aa1' },
    { id: 'other', name: 'Other direct mail', daily: 12700000, color: '#79706e' }
  ];

  var VARIANTS = {
    income: {
      axis: 'HOUSEHOLD INCOME',
      groupNoun: 'income group',
      groupPlural: 'income tiers',
      title: 'Higher-income households receive more advertising mail',
      dek: 'The highest-income 15% of households receive 21% of advertising mail—and nearly twice as many pieces per household as those earning under $50,000.',
      svgTitle: 'Advertising mail received per household by income',
      svgDesc: 'Colored ribbons compare equal-sized groups of households, showing that advertising-mail pieces received per household rise sharply with income.',
      note: 'Ribbon widths compare equal numbers of households in each income tier; they encode mail received per household, not each tier’s national population. A representation ratio of 1.00× means a tier receives mail in proportion to its share of households. Category composition remains illustrative.',
      desktopY: [125, 300, 475, 650],
      groups: [
        { id: '150plus', name: '$150K+', householdShare: 15, piecesAnnual: 527.0, mailShare: .212252, shares: [.324088, .324088, .324088, .324088, .324088, .324088] },
        { id: '100to149', name: '$100K–$149K', householdShare: 16, piecesAnnual: 451.2, mailShare: .193838, shares: [.277474, .277474, .277474, .277474, .277474, .277474] },
        { id: '50to99', name: '$50K–$99K', householdShare: 32, piecesAnnual: 370.6, mailShare: .318423, shares: [.227908, .227908, .227908, .227908, .227908, .227908] },
        { id: 'under50', name: 'Under $50K', householdShare: 37, piecesAnnual: 277.3, mailShare: .275487, shares: [.170530, .170530, .170530, .170530, .170530, .170530] }
      ]
    },
    age: {
      axis: 'AGE OF HOUSEHOLDER',
      groupNoun: 'age group',
      groupPlural: 'age groups',
      title: 'Older households receive far more advertising mail',
      dek: 'Households headed by someone 65 or older receive 42% of advertising mail despite representing 30% of households—and more than twice as many pieces per household as those under 45.',
      svgTitle: 'Advertising mail received per household by age of householder',
      svgDesc: 'Colored ribbons compare equal-sized groups of households, showing that advertising-mail pieces received per household rise sharply with the age of the householder.',
      note: 'Ribbon widths compare equal numbers of households in each age group; they encode mail received per household, not each group’s national population. Age totals and household shares come from the FY2025 USPS Household Mail Survey. Category composition remains illustrative because USPS does not publish category-by-age cross-tabs.',
      desktopY: [170, 380, 590],
      groups: [
        { id: '65plus', name: '65 and over', householdShare: 30, piecesAnnual: 529.1, mailShare: .419, shares: [.4532, .4532, .4532, .4532, .4532, .4532] },
        { id: '45to64', name: '45–64', householdShare: 33, piecesAnnual: 406.1, mailShare: .354, shares: [.3477, .3477, .3477, .3477, .3477, .3477] },
        { id: 'under45', name: 'Under 45', householdShare: 37, piecesAnnual: 232.7, mailShare: .227, shares: [.1991, .1991, .1991, .1991, .1991, .1991] }
      ]
    }
  };

  var PARTICLE_VALUE = 1200000; // 1 square = 1.2M pieces / day
  var SAMPLES = 160;
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STYLES = `
    :host { display:block; color:var(--ink,#1C1A14); background:var(--paper,#F1EEE3); font-family:"Inter", system-ui, sans-serif; }
    * { box-sizing:border-box; }
    .wrap { max-width:1100px; margin:auto; padding:28px 18px 22px; }
    .kicker { font:700 12px/1.2 "Inter",system-ui,sans-serif; letter-spacing:.12em; text-transform:uppercase; border-top:1px solid var(--ink,#1C1A14); padding-top:10px; }
    h1 { margin:10px 0 8px; max-width:780px; font:600 clamp(28px,4vw,48px)/1.04 "Fraunces",Georgia,serif; letter-spacing:-.025em; }
    .dek { max-width:760px; margin:0 0 20px; color:var(--ink-soft,#5B564A); font:17px/1.45 "Inter",system-ui,sans-serif; }
    .toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-top:1px solid var(--rule,rgba(28,26,20,.18)); border-bottom:1px solid var(--rule,rgba(28,26,20,.18)); }
    .metric { font:13px/1.3 "Inter",system-ui,sans-serif; color:var(--ink-soft,#5B564A); }
    .metric strong { display:block; color:var(--ink,#1C1A14); font-size:22px; font-weight:700; }
    .controls { display:flex; gap:8px; }
    button { appearance:none; border:1px solid var(--rule,rgba(28,26,20,.18)); border-radius:3px; padding:8px 12px; background:var(--paper,#F1EEE3); color:var(--ink,#1C1A14); font:600 13px "Inter",system-ui,sans-serif; cursor:pointer; }
    button:hover, button:focus-visible { background:var(--paper-raised,#E8E3D3); outline:none; }
    button:focus-visible { box-shadow:0 0 0 2px var(--focus,#2E5FB0); }
    .legend { display:flex; flex-wrap:wrap; gap:8px 18px; padding:14px 0 8px; }
    .legend button { border:0; padding:3px 0; font-weight:400; background:transparent; }
    .legend button[aria-pressed="true"] { font-weight:700; text-decoration:underline; text-underline-offset:3px; }
    .swatch { width:10px; height:10px; display:inline-block; margin-right:6px; }
    .chart { position:relative; width:100%; overflow-x:auto; }
    .particles { position:absolute; left:0; top:0; pointer-events:none; z-index:1; }
    .hover-label { position:absolute; display:none; z-index:10; padding:5px 7px; border:1px solid var(--rule,rgba(28,26,20,.18)); border-radius:3px; background:color-mix(in srgb,var(--paper-contrast,#FBF9F2) 96%,transparent); color:var(--ink,#1C1A14); box-shadow:0 2px 6px rgba(0,0,0,.10); font:11px/1.2 "Inter",system-ui,sans-serif; white-space:nowrap; pointer-events:none; }
    .hover-label.show { display:block; }
    svg { display:block; width:100%; min-width:760px; height:auto; -webkit-tap-highlight-color:transparent; }
    svg.compact { min-width:0; }
    .label { font:600 13px "Inter",system-ui,sans-serif; fill:var(--ink,#1C1A14); }
    .value { font:12px "Inter",system-ui,sans-serif; fill:var(--ink-soft,#5B564A); }
    .cap { font:700 10px "Inter",system-ui,sans-serif; fill:var(--ink-faint,#8B8575); letter-spacing:.12em; }
    svg.compact .label { font-size:12.5px; }
    svg.compact .value { font-size:11.5px; }
    svg.compact .cap { font-size:9.5px; letter-spacing:.08em; }
    .ribbon { fill:none; stroke-linecap:butt; stroke-linejoin:miter; cursor:pointer; transition:opacity .18s; }
    .node { cursor:pointer; transition:opacity .18s; }
    .node.is-selected > rect:first-child { stroke:var(--ink,#1C1A14); stroke-width:1.75; }
    .composition-segment { transition:opacity .15s; }
    .composition-segment:hover, .composition-segment:focus { opacity:.62; outline:none; }
    .detail { min-height:42px; padding:12px 0 8px; border-top:1px solid var(--rule,rgba(28,26,20,.18)); color:var(--ink-soft,#5B564A); font:14px/1.45 "Inter",system-ui,sans-serif; }
    .detail .hint { color:var(--ink-faint,#8B8575); }
    .note { color:var(--ink-faint,#8B8575); font:11px/1.45 "Inter",system-ui,sans-serif; }
    @media (max-width:620px) { .wrap{padding:20px 12px} .dek{font-size:16px} }`;

  function representation(g) {
    var ratio = g.mailShare / (g.householdShare / 100);
    return Math.abs(ratio - 1) < .01
      ? 'Proportionally represented'
      : Math.round(Math.abs(ratio - 1) * 100) + '% ' + (ratio > 1 ? 'overrepresented' : 'underrepresented');
  }

  class JunkMailFlow extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.attachShadow({ mode: 'open' });
      this.render(VARIANTS[this.getAttribute('variant')] || VARIANTS.income);
    }

    render(V) {
      const root = this.shadowRoot;
      const categories = CATEGORIES;
      const groups = V.groups;
      const totalDaily = categories.reduce((sum, c) => sum + c.daily, 0);
      const defaultDetail = 'Select a category, ribbon or ' + V.groupNoun + ' to isolate its flow.';

      root.innerHTML = `
        <style>${STYLES}</style>
        <div class="wrap">
          <div class="kicker">The American mailstream</div>
          <h1>${V.title}</h1>
          <p class="dek">${V.dek}</p>
          <div class="toolbar">
            <div class="metric"><strong>${(totalDaily / 1e6).toFixed(0)} million</strong>advertising pieces / day</div>
            <div class="metric"><strong>1 square = 1.2M</strong>mail pieces per day</div>
            <div class="controls"><button id="pause" type="button">Pause</button><button id="reset" type="button">Show all</button></div>
          </div>
          <div class="legend" id="legend"></div>
          <div class="chart">
            <svg viewBox="0 0 1000 760" role="img" aria-labelledby="title desc"><title id="title">${V.svgTitle}</title><desc id="desc">${V.svgDesc}</desc></svg>
            <canvas class="particles" aria-hidden="true"></canvas>
            <div id="hoverLabel" class="hover-label" aria-hidden="true"></div>
          </div>
          <div class="detail" id="detail">${defaultDetail}</div>
          <div class="note">${V.note}</div>
        </div>`;

      const svg = root.querySelector('svg');
      const chartEl = root.querySelector('.chart');
      const canvas = root.querySelector('canvas.particles');
      const pctx = canvas.getContext('2d');
      const legend = root.querySelector('#legend');
      const detail = root.querySelector('#detail');
      const hoverLabel = root.querySelector('#hoverLabel');
      const pauseBtn = root.querySelector('#pause');

      const make = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; };
      const text = (x, y, value, cls, anchor = 'start') => { const el = make('text', { x, y, class: cls, 'text-anchor': anchor }); el.textContent = value; return el; };
      const mctx = document.createElement('canvas').getContext('2d');
      const FONT = { label: '600 12.5px "Inter",system-ui,sans-serif', value: '11.5px "Inter",system-ui,sans-serif', cap: '700 9.5px "Inter",system-ui,sans-serif' };
      const tw = (str, font) => { mctx.font = font; return mctx.measureText(str).width; };
      const wrap = (str, font, max) => { const out = []; let cur = ''; String(str).split(' ').forEach(w => { const t = cur ? cur + ' ' + w : w; if (cur && tw(t, font) > max) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; };
      const multi = (x, y, lines, cls, lh, anchor = 'start') => { const el = make('text', { x, y, class: cls, 'text-anchor': anchor }); lines.forEach((ln, i) => { const t = make('tspan', { x, dy: i ? lh : 0 }); t.textContent = ln; el.append(t); }); return el; };

      const paths = {};
      let particles = [];
      let pSize = 8, layoutKey = '', vbW = 1000;
      let paused = reduceMotion, filter = null;
      let pinned = null, lastPtr = null; // touch tooltip state
      const sampleCache = new Map();

      /* ---------- layout ---------- */
      const build = () => {
        const cw0 = chartEl.clientWidth || 0;
        const compact = cw0 > 0 && cw0 < 700;
        const key = compact ? 'c' + Math.round(cw0 / 4) * 4 : 'd';
        if (key === layoutKey) return;
        layoutKey = key;
        hideTip();
        Array.from(svg.childNodes).forEach(n => { if (n.nodeName !== 'title' && n.nodeName !== 'desc') svg.removeChild(n); });
        Object.keys(paths).forEach(k => delete paths[k]);
        sampleCache.clear();
        svg.classList.toggle('compact', compact);

        if (!compact) {
          pSize = 8; vbW = 1000;
          svg.setAttribute('viewBox', '0 0 1000 760');
          const sy = [112, 218, 324, 430, 536, 642], ty = V.desktopY;
          svg.append(text(24, 40, 'MAIL CATEGORY', 'cap'));
          svg.append(text(976, 40, V.axis, 'cap', 'end'));
          svg.append(text(500, 66, 'WIDTH = ADVERTISING MAIL RECEIVED PER HOUSEHOLD', 'cap', 'middle'));
          const ribbons = make('g'); svg.append(ribbons);

          categories.forEach((cat, ci) => groups.forEach((grp, gi) => {
            const volume = cat.daily * grp.shares[ci];
            const path = make('path', { d: `M 230 ${sy[ci]} C 385 ${sy[ci]}, 520 ${ty[gi]}, 705 ${ty[gi]}`, stroke: cat.color, 'stroke-width': Math.max(4, volume / 210000), 'stroke-opacity': '.42', class: 'ribbon', 'data-cat': cat.id, 'data-group': grp.id });
            ribbons.append(path); paths[cat.id + '-' + grp.id] = path;
          }));

          categories.forEach((cat, ci) => {
            const g = make('g', { class: 'node', 'data-cat': cat.id });
            g.append(make('rect', { x: 20, y: sy[ci] - 35, width: 195, height: 70, rx: 9, fill: 'var(--paper-contrast,#FBF9F2)', stroke: 'var(--rule,rgba(28,26,20,.18))', 'stroke-width': 1 }));
            g.append(make('rect', { x: 32, y: sy[ci] - 20, width: 12, height: 40, fill: cat.color }));
            g.append(text(56, sy[ci] - 4, cat.name, 'label'));
            g.append(text(56, sy[ci] + 18, `${(cat.daily / 1e6).toFixed(1)}M / day`, 'value'));
            g.append(make('rect', { x: 56, y: sy[ci] + 25, width: 125 * (cat.daily / categories[0].daily), height: 5, rx: 2.5, fill: cat.color }));
            svg.append(g);
          });

          groups.forEach((grp, gi) => {
            const value = categories.reduce((sum, c, ci) => sum + c.daily * grp.shares[ci], 0);
            const g = make('g', { class: 'node', 'data-group': grp.id });
            g.append(make('rect', { x: 720, y: ty[gi] - 52, width: 256, height: 104, rx: 10, fill: 'var(--paper-contrast,#FBF9F2)', stroke: 'var(--rule,rgba(28,26,20,.18))', 'stroke-width': 1 }));
            g.append(text(958, ty[gi] - 30, grp.name, 'label', 'end'));
            g.append(text(958, ty[gi] - 10, `${grp.piecesAnnual.toFixed(0)} advertising pieces / household / year`, 'value', 'end'));
            g.append(text(958, ty[gi] + 8, `${grp.householdShare}% of households → ${(grp.mailShare * 100).toFixed(1)}% of ad mail`, 'value', 'end'));
            g.append(text(958, ty[gi] + 28, representation(grp), 'label', 'end'));
            let barX = 742;
            const barWidth = 216;
            categories.forEach((cat, ci) => {
              const share = cat.daily * grp.shares[ci] / value;
              const hoverText = `${cat.name} · ${(share * 100).toFixed(1)}%`;
              g.append(make('rect', { x: barX, y: ty[gi] + 42, width: barWidth * share, height: 6, fill: cat.color, 'aria-label': `${hoverText} of ${grp.name} advertising mail`, 'data-composition': 'true', 'data-hover': hoverText, class: 'composition-segment' }));
              barX += barWidth * share;
            });
            svg.append(g);
          });
        } else {
          // Compact (mobile) layout: 1 unit = 1 CSS px, measured + wrapped text
          pSize = 6;
          const W = Math.max(280, Math.round(cw0));
          vbW = W;
          const lw = Math.round(Math.min(150, Math.max(104, W * .31)));
          const rw = Math.round(Math.min(200, Math.max(140, W * .42)));
          const rx = W - rw;
          const LH = 15, VH = 14;
          svg.append(text(0, 12, 'MAIL CATEGORY', 'cap'));
          svg.append(text(W, 12, V.axis, 'cap', 'end'));
          const midLines = wrap('WIDTH = ADVERTISING MAIL RECEIVED PER HOUSEHOLD', FONT.cap, (W - 16) * .86);
          svg.append(multi(W / 2, 32, midLines, 'cap', 12, 'middle'));
          const y0 = 32 + (midLines.length - 1) * 12 + 18;
          const L = categories.map(cat => { const nameL = wrap(cat.name, FONT.label, lw - 27); return { nameL, h: 36 + nameL.length * LH }; });
          const R = groups.map(grp => {
            const blocks = [
              { cls: 'label', lh: LH, lines: wrap(grp.name, FONT.label, rw - 20) },
              { cls: 'value', lh: VH, lines: wrap(`${grp.piecesAnnual.toFixed(0)} advertising pieces / household / year`, FONT.value, rw - 20) },
              { cls: 'value', lh: VH, lines: wrap(`${grp.householdShare}% of households → ${(grp.mailShare * 100).toFixed(1)}% of ad mail`, FONT.value, rw - 20) },
              { cls: 'label', lh: LH, lines: wrap(representation(grp), FONT.label, rw - 20) }];
            const n = blocks.reduce((a, b) => a + b.lines.length * b.lh, 0);
            return { blocks, h: 18 + n - blocks[3].lh + 8 + 6 + 10 };
          });
          const gapMin = 8;
          const sumL = L.reduce((a, b) => a + b.h, 0), sumR = R.reduce((a, b) => a + b.h, 0);
          const Hc = Math.max(sumL + gapMin * (L.length - 1), sumR + 12 * (R.length - 1));
          const gapL = (Hc - sumL) / (L.length - 1), gapR = (Hc - sumR) / Math.max(1, R.length - 1);
          const sy = [], ty = []; let yy = y0;
          L.forEach((b, i) => { b.top = yy; sy[i] = yy + b.h / 2; yy += b.h + gapL; });
          yy = y0; R.forEach((b, i) => { b.top = yy; ty[i] = yy + b.h / 2; yy += b.h + gapR; });
          svg.setAttribute('viewBox', `0 0 ${W} ${Math.ceil(y0 + Hc + 8)}`);
          const ribbons = make('g'); svg.append(ribbons);
          const ax = lw + 2, bx = rx - 2, span = bx - ax;
          categories.forEach((cat, ci) => groups.forEach((grp, gi) => {
            const volume = cat.daily * grp.shares[ci];
            const path = make('path', { d: `M ${ax} ${sy[ci]} C ${ax + span * .45} ${sy[ci]}, ${ax + span * .55} ${ty[gi]}, ${bx} ${ty[gi]}`, stroke: cat.color, 'stroke-width': Math.max(2.5, volume / 210000 * .6), 'stroke-opacity': '.42', class: 'ribbon', 'data-cat': cat.id, 'data-group': grp.id });
            ribbons.append(path); paths[cat.id + '-' + grp.id] = path;
          }));
          categories.forEach((cat, ci) => {
            const b = L[ci], t = b.top;
            const g = make('g', { class: 'node', 'data-cat': cat.id });
            g.append(make('rect', { x: 0, y: t, width: lw, height: b.h, rx: 7, fill: 'var(--paper-contrast,#FBF9F2)', stroke: 'var(--rule,rgba(28,26,20,.18))', 'stroke-width': 1 }));
            g.append(make('rect', { x: 7, y: t + 9, width: 5, height: b.h - 18, fill: cat.color }));
            g.append(multi(19, t + 18, b.nameL, 'label', LH));
            const vy = t + 18 + b.nameL.length * LH;
            g.append(text(19, vy, `${(cat.daily / 1e6).toFixed(1)}M / day`, 'value'));
            g.append(make('rect', { x: 19, y: vy + 6, width: (lw - 30) * (cat.daily / categories[0].daily), height: 4, rx: 2, fill: cat.color }));
            svg.append(g);
          });
          groups.forEach((grp, gi) => {
            const b = R[gi], t = b.top;
            const value = categories.reduce((sum, c, ci) => sum + c.daily * grp.shares[ci], 0);
            const g = make('g', { class: 'node', 'data-group': grp.id });
            g.append(make('rect', { x: rx, y: t, width: rw, height: b.h, rx: 8, fill: 'var(--paper-contrast,#FBF9F2)', stroke: 'var(--rule,rgba(28,26,20,.18))', 'stroke-width': 1 }));
            let by = t + 18, lastBase = by;
            b.blocks.forEach(bl => { g.append(multi(rx + 10, by, bl.lines, bl.cls, bl.lh)); lastBase = by + (bl.lines.length - 1) * bl.lh; by += bl.lines.length * bl.lh; });
            let barX = rx + 10; const barWidth = rw - 20;
            categories.forEach((cat, ci) => {
              const share = cat.daily * grp.shares[ci] / value;
              const hoverText = `${cat.name} · ${(share * 100).toFixed(1)}%`;
              g.append(make('rect', { x: barX, y: lastBase + 8, width: barWidth * share, height: 6, fill: cat.color, 'aria-label': `${hoverText} of ${grp.name} advertising mail`, 'data-composition': 'true', 'data-hover': hoverText, class: 'composition-segment' }));
              barX += barWidth * share;
            });
            svg.append(g);
          });
        }

        // particles (state only; drawn on the canvas overlay)
        const pickGroup = (ci) => { let r = Math.random(), a = 0; for (let i = 0; i < groups.length; i++) { a += groups[i].shares[ci]; if (r <= a) return i; } return groups.length - 1; };
        particles = [];
        categories.forEach((cat, ci) => {
          const count = Math.max(5, Math.round(cat.daily / PARTICLE_VALUE));
          for (let j = 0; j < count; j++) {
            const gi = pickGroup(ci);
            particles.push({
              path: paths[cat.id + '-' + groups[gi].id], color: cat.color, cat: cat.id, group: groups[gi].id,
              // reduced motion shows a still snapshot, so start everyone on the ribbon
              t: reduceMotion ? Math.random() : -Math.random(),
              speed: .045 + Math.random() * .02
            });
          }
        });
        if (filter) { apply(filter.type, filter.id); markSel(); }
      };

      /* ---------- particles ---------- */
      const pointAt = (path, t) => {
        let s = sampleCache.get(path);
        if (!s) {
          const len = path.getTotalLength();
          s = new Float32Array((SAMPLES + 1) * 2);
          for (let i = 0; i <= SAMPLES; i++) { const q = path.getPointAtLength(len * i / SAMPLES); s[i * 2] = q.x; s[i * 2 + 1] = q.y; }
          sampleCache.set(path, s);
        }
        const f = Math.min(1, Math.max(0, t)) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
        return { x: s[i * 2] + (s[i * 2 + 2] - s[i * 2]) * k, y: s[i * 2 + 1] + (s[i * 2 + 3] - s[i * 2 + 1]) * k };
      };
      const allowed = p => !filter || (filter.type === 'cat' ? p.cat === filter.id : p.group === filter.id);

      let cssW = 0, cssH = 0, scale = 1;
      const sizeCanvas = () => {
        cssW = svg.clientWidth; cssH = svg.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
        canvas.width = Math.max(1, Math.round(cssW * dpr));
        canvas.height = Math.max(1, Math.round(cssH * dpr));
        scale = cssW / vbW;
        pctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      };

      const draw = () => {
        pctx.clearRect(0, 0, vbW, cssH / scale);
        const half = pSize / 2;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.t < 0) continue;
          const pt = pointAt(p.path, p.t);
          pctx.globalAlpha = allowed(p) ? .95 : .03;
          pctx.fillStyle = p.color;
          pctx.fillRect(pt.x - half, pt.y - half, pSize, pSize);
        }
        pctx.globalAlpha = 1;
      };

      /* Loop runs only while on screen, in the active toggle view, and not paused. */
      const view = this.closest('.mailstream-view');
      let onScreen = false, raf = 0, last = 0;
      const shown = () => onScreen && (!view || view.classList.contains('is-active'));
      const tick = (time) => {
        raf = 0;
        if (!shown() || paused) return;
        const dt = last ? Math.min(40, time - last) / 1000 : 0;
        last = time;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.t += p.speed * dt;
          if (p.t > 1.03) p.t = -Math.random() * .35;
        }
        draw();
        raf = requestAnimationFrame(tick);
      };
      const sync = () => {
        if (shown() && !paused) { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      };
      new IntersectionObserver(es => { onScreen = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '120px 0px' }).observe(this);
      if (view) new MutationObserver(sync).observe(view, { attributes: true, attributeFilter: ['class'] });

      const relayout = () => { build(); sizeCanvas(); draw(); };
      relayout();
      new ResizeObserver(relayout).observe(chartEl);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (layoutKey[0] === 'c') { layoutKey = ''; relayout(); } });

      /* ---------- interaction ---------- */
      categories.forEach(cat => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.cat = cat.id;
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = `<span class="swatch" style="background:${cat.color}"></span>${cat.name}`;
        legend.append(b);
      });

      function apply(type, id) {
        filter = { type, id };
        root.querySelectorAll('.ribbon').forEach(p => { p.style.opacity = p.dataset[type] === id ? '1' : '.08'; });
        root.querySelectorAll('.node').forEach(n => { if (n.dataset[type] !== undefined) n.style.opacity = n.dataset[type] === id ? '1' : '.25'; });
        if (type === 'cat') {
          const c = categories.find(x => x.id === id);
          detail.innerHTML = `<strong>${c.name}</strong> accounts for ${(c.daily / 1e6).toFixed(1)} million modeled pieces per day. Its ribbons compare equal numbers of households across ${V.groupPlural}.`;
        } else {
          const g = groups.find(x => x.id === id), ratio = g.mailShare / (g.householdShare / 100);
          detail.innerHTML = `<strong>${g.name}</strong> households receive ${g.piecesAnnual.toFixed(0)} advertising pieces per household per year—${ratio.toFixed(2)}× their population-proportional share nationally.`;
        }
        if (paused) draw();
      }
      function markSel() {
        const on = n => !!filter && n.dataset[filter.type] === filter.id;
        root.querySelectorAll('.node').forEach(n => n.classList.toggle('is-selected', on(n)));
        legend.querySelectorAll('button[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(!!filter && filter.type === 'cat' && b.dataset.cat === filter.id)));
        if (filter && !detail.querySelector('.hint')) detail.insertAdjacentHTML('beforeend', ' <span class="hint">Select it again to show all.</span>');
      }
      function clearFilter() {
        hideTip();
        filter = null;
        detail.textContent = defaultDetail;
        root.querySelectorAll('.ribbon,.node').forEach(n => { n.style.opacity = '1'; });
        markSel();
        if (paused) draw();
      }
      function toggle(type, id) {
        hideTip();
        if (filter && filter.type === type && filter.id === id) { clearFilter(); return; }
        apply(type, id);
        markSel();
      }
      function showHover(segment, event) {
        const box = chartEl.getBoundingClientRect();
        hoverLabel.textContent = segment.dataset.hover;
        hoverLabel.classList.add('show');
        hoverLabel.setAttribute('aria-hidden', 'false');
        const width = hoverLabel.offsetWidth;
        const left = event.clientX - box.left + chartEl.scrollLeft - width / 2;
        const top = event.clientY - box.top + chartEl.scrollTop - 34;
        hoverLabel.style.left = `${Math.max(6, Math.min(left, chartEl.scrollWidth - width - 6))}px`;
        hoverLabel.style.top = `${Math.max(6, top)}px`;
      }
      function hideTip() {
        pinned = null;
        hoverLabel.classList.remove('show');
        hoverLabel.setAttribute('aria-hidden', 'true');
      }

      // Tap on / tap off: same item clears, another item switches, empty chart space clears.
      // On touch, a composition segment pins its tooltip until tapped again or elsewhere.
      svg.addEventListener('click', e => {
        const seg = e.target.closest('[data-composition]');
        if (seg) {
          if (lastPtr && lastPtr !== 'mouse') {
            if (pinned === seg) hideTip();
            else { showHover(seg, e); pinned = seg; }
          }
          return;
        }
        hideTip();
        const n = e.target.closest('[data-group],[data-cat]');
        if (!n) { if (filter) clearFilter(); return; }
        if (n.dataset.group) toggle('group', n.dataset.group); else toggle('cat', n.dataset.cat);
      });
      svg.addEventListener('pointerdown', e => { lastPtr = e.pointerType || 'mouse'; }, true);
      document.addEventListener('pointerdown', e => { if (pinned && !e.composedPath().includes(svg)) hideTip(); }, { passive: true });
      svg.addEventListener('pointerover', e => { if (e.pointerType && e.pointerType !== 'mouse') return; const s = e.target.closest('[data-composition]'); if (s) showHover(s, e); });
      svg.addEventListener('pointermove', e => { if (e.pointerType && e.pointerType !== 'mouse') return; const s = e.target.closest('[data-composition]'); if (s) showHover(s, e); });
      svg.addEventListener('pointerout', e => { if (e.pointerType && e.pointerType !== 'mouse') return; if (e.target.closest('[data-composition]')) { hoverLabel.classList.remove('show'); hoverLabel.setAttribute('aria-hidden', 'true'); } });

      legend.addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) toggle('cat', b.dataset.cat); });
      root.querySelector('#reset').addEventListener('click', clearFilter);
      pauseBtn.textContent = paused ? 'Play' : 'Pause';
      pauseBtn.addEventListener('click', () => { paused = !paused; pauseBtn.textContent = paused ? 'Play' : 'Pause'; sync(); });
    }
  }

  customElements.define('junk-mail-flow', JunkMailFlow);

  /* Income / age view switch */
  var incomeButton = document.getElementById('show-income');
  var ageButton = document.getElementById('show-age');
  var incomeView = document.getElementById('income-view');
  var ageView = document.getElementById('age-view');
  if (!incomeButton || !ageButton) return;

  function setView(showIncome) {
    incomeButton.setAttribute('aria-pressed', String(showIncome));
    ageButton.setAttribute('aria-pressed', String(!showIncome));
    incomeView.classList.toggle('is-active', showIncome);
    ageView.classList.toggle('is-active', !showIncome);
    incomeView.setAttribute('aria-hidden', String(!showIncome));
    ageView.setAttribute('aria-hidden', String(showIncome));
  }
  incomeButton.addEventListener('click', function () { setView(true); });
  ageButton.addEventListener('click', function () { setView(false); });
})();
