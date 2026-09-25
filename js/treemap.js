/* USPS sender treemap: squarified layout, flat or grouped by whether you can opt out. */
(function () {
  'use strict';
  var GROUPS = {
    stop: { name: "Can stop", long: "You can opt out" },
    part: { name: "Can partly stop", long: "You can partly opt out" },
    none: { name: "Can't stop", long: "No opt-out exists" }
  };

  var LEAVES = [
    { id: "fin", short: "Financial", name: "Banks, card issuers and insurers", group: "part", mm: 89.7, fc: 13.8,
      has: "Prescreened credit card and insurance offers, plus promotions from banks and card companies you already use.",
      how: "OptOutPrescreen.com stops prescreened offers for five years online, or permanently by mailed form. Promotions from your own bank or card issuer need a request to each company." },
    { id: "mer", short: "Retail", name: "Retailers and catalogs", group: "stop", mm: 71.2, fc: 7.2,
      has: "Catalogs and promotions from stores and national direct marketers, including companies you bought from once.",
      how: "Catalog Choice, DMAchoice, or PaperKarma. You can also call the company and quote the customer number printed near your address." },
    { id: "soc", short: "Charity", name: "Charities and political groups", group: "part", mm: 81.0, fc: 2.4,
      has: "Donation appeals, often with free gifts like address labels, and campaign and advocacy mail. Most 2024 election mail arrived after this fiscal year ended.",
      how: "Ask each charity to remove you and not to share your name. Campaign mail addressed to you can be refused; political flyers sent to \u201cResident\u201d can\u2019t." },
    { id: "svc", short: "Services", name: "Service companies", group: "part", mm: 72.2, fc: 10.8,
      has: "Offers from phone, cable, and utility companies, plus local services like HVAC, roofing, and real estate.",
      how: "Offers addressed to you can be stopped by contacting the sender. Local flyers sent to every home on a route usually can\u2019t." },
    { id: "shr", short: "Shared", name: "Shared mailers from several senders", group: "part", mm: 24.5, fc: 0,
      split: "All sent by Marketing Mail",
      has: "Single pieces carrying offers from more than one organization, such as coupon envelopes. USPS doesn\u2019t define this category further.",
      how: "Some coupon-pack companies, such as Valpak, accept address-removal requests online. Other shared mailers need a request to each company." },
    { id: "mfg", short: "Brands", name: "Product manufacturers", group: "stop", mm: 5.9, fc: 1.0,
      has: "Coupons, samples, and promotions from brands that make the products you buy.",
      how: "DMAchoice covers many national brands. For others, contact the brand directly." },
    { id: "una", short: "Unaddressed", name: "Unaddressed \u201cPostal Customer\u201d mail", group: "none", mm: 7.4, fc: 0,
      split: "Delivered without a name or address line",
      has: "Flyers delivered to every address on a carrier route with no name attached, most often through Every Door Direct Mail.",
      how: "There is no opt-out. The only option is asking individual senders, and most can\u2019t exclude a single address on a route." }
  ];
  LEAVES.forEach(function (d) { d.value = +(d.mm + d.fc).toFixed(1); });
  var TOTAL = LEAVES.reduce(function (s, d) { return s + d.value; }, 0);

  var map = document.getElementById("jm-map");
  var detail = document.getElementById("jm-detail");
  var legend = document.getElementById("jm-legend");
  var mode = "flat", selected = null, els = {}, frames = {};
  var tip = document.createElement("div");
  tip.className = "tip"; tip.setAttribute("aria-hidden", "true");
  map.appendChild(tip);

  function showTip(d, e) {
    tip.innerHTML = "<b></b><span></span>";
    tip.querySelector("b").textContent = d.name;
    tip.querySelector("span").textContent = d.value.toFixed(1) + " pieces a year, " + pct(d.value) + " of the total. " + GROUPS[d.group].long + ".";
    var mr = map.getBoundingClientRect(), br = els[d.id].getBoundingClientRect();
    tip.classList.add("on");
    var tw = tip.offsetWidth, th = tip.offsetHeight, x, y;
    if (e) { x = e.clientX - mr.left + 12; y = e.clientY - mr.top + 14; }
    else { x = br.left - mr.left + br.width / 2 - tw / 2; y = br.top - mr.top - th - 6; }
    if (x + tw > mr.width) x = (e ? e.clientX - mr.left - tw - 12 : mr.width - tw);
    if (y + th > mr.height) y = (e ? e.clientY - mr.top - th - 10 : br.top - mr.top - th - 6);
    if (y < 0) y = br.bottom - mr.top + 6;
    tip.style.left = Math.max(0, x) + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.classList.remove("on"); }

  function fmt(v) { return String(Math.round(v)); }
  function pct(v) { return Math.round(v / TOTAL * 100) + "%"; }

  // Squarified treemap layout
  function squarify(data, x, y, w, h) {
    var out = [], total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (!total || w <= 0 || h <= 0) return out;
    var items = data.slice().sort(function (a, b) { return b.value - a.value; })
      .map(function (d) { return { d: d, a: d.value / total * w * h }; });
    var rx = x, ry = y, rw = w, rh = h;
    function worst(row, side) {
      var s = 0, mx = 0, mn = Infinity;
      row.forEach(function (o) { s += o.a; mx = Math.max(mx, o.a); mn = Math.min(mn, o.a); });
      return Math.max(side * side * mx / (s * s), (s * s) / (side * side * mn));
    }
    while (items.length) {
      var side = Math.min(rw, rh), row = [items[0]], i = 1;
      while (i < items.length && worst(row.concat([items[i]]), side) <= worst(row, side)) { row.push(items[i]); i++; }
      var s = row.reduce(function (t, o) { return t + o.a; }, 0);
      if (rw >= rh) {
        var cw = s / rh, cy = ry;
        row.forEach(function (o) { var hh = o.a / cw; out.push({ d: o.d, x: rx, y: cy, w: cw, h: hh }); cy += hh; });
        rx += cw; rw -= cw;
      } else {
        var ch = s / rw, cx = rx;
        row.forEach(function (o) { var ww = o.a / ch; out.push({ d: o.d, x: cx, y: ry, w: ww, h: ch }); cx += ww; });
        ry += ch; rh -= ch;
      }
      items = items.slice(i);
    }
    return out;
  }

  function build() {
    LEAVES.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "leaf " + d.group;
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", d.name + ", " + d.value.toFixed(1) + " pieces per household per year, " + pct(d.value) + ". " + GROUPS[d.group].long + ".");
      b.innerHTML = '<span class="n"></span><span class="sh"></span><span class="v"><span class="num"></span><span class="p"></span></span>';
      b.querySelector(".n").textContent = d.name;
      b.querySelector(".sh").textContent = d.short;
      b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") showTip(d, e); });
      b.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") showTip(d, e); });
      b.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hideTip(); });
      b.addEventListener("focus", function () { showTip(d); });
      b.addEventListener("blur", hideTip);
      b.querySelector(".num").textContent = fmt(d.value);
      b.querySelector(".p").textContent = pct(d.value);
      b.addEventListener("click", function () {
        var next = d.id === selected ? null : d.id;
        select(next);
        if (next) showTip(d); else hideTip();
      });
      map.appendChild(b); els[d.id] = b;
    });
    Object.keys(GROUPS).forEach(function (g) {
      var f = document.createElement("div");
      f.className = "frame " + g;
      f.setAttribute("aria-hidden", "true");
      map.appendChild(f); frames[g] = f;

      var tot = LEAVES.filter(function (d) { return d.group === g; }).reduce(function (s, d) { return s + d.value; }, 0);
      GROUPS[g].total = tot;
      f.textContent = GROUPS[g].name + " " + fmt(tot);
      var li = document.createElement("li");
      li.innerHTML = '<span class="sw"></span><span><b></b> <span class="m"></span></span>';
      li.querySelector(".sw").style.background = "var(--" + g + ")";
      li.querySelector("b").textContent = GROUPS[g].name;
      li.querySelector(".m").textContent = fmt(tot) + " pieces a year, " + pct(tot);
      legend.appendChild(li);
    });
  }

  function place(el, r, gap) {
    el.style.left = (r.x + gap) + "px"; el.style.top = (r.y + gap) + "px";
    el.style.width = Math.max(0, r.w - gap * 2) + "px"; el.style.height = Math.max(0, r.h - gap * 2) + "px";
  }
  // Pick the richest label that fits the box's final size, measured with canvas
  var ctx = document.createElement("canvas").getContext("2d");
  var fontFamily = "", rem = 16; // refreshed once per layout, not per measurement
  function tw(text, px, weight) {
    ctx.font = weight + " " + px + "px " + fontFamily;
    return ctx.measureText(text).width;
  }
  function wrapLines(text, px, weight, maxW) {
    var words = text.split(" "), lines = 1, line = "";
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + " " + words[i] : words[i];
      if (tw(t, px, weight) <= maxW) line = t;
      else { if (!line || tw(words[i], px, weight) > maxW) return Infinity; lines++; line = words[i]; }
    }
    return lines;
  }
  var MODES = ["m-full", "m-row", "m-rname", "m-rshort", "m-stack", "m-val", "m-num", "m-tight", "m-vert"];
  function fitLabel(el, d, r) {
    var W = r.w - 2 - 16, H = r.h - 2 - 12;
    var nPx = 0.86 * rem, sPx = 0.72 * rem, vPx = 0.98 * rem, pPx = 0.75 * rem;
    var numW = tw(fmt(d.value), vPx, 800), valW = numW + 5 + tw(pct(d.value), pPx, 600);
    var vH = vPx * 1.15, nLH = nPx * 1.2, sLH = sPx * 1.2;
    var nameW = tw(d.name, nPx, 600), shortW = tw(d.short, sPx, 600);
    var mode = [];
    var lines = wrapLines(d.name, nPx, 600, W);
    if (valW <= W && lines * nLH + 2 + vH <= H) mode = ["m-full"];
    else if (nameW + 8 + valW <= W && vH <= H) mode = ["m-row", "m-rname"];
    else if (Math.max(shortW, valW) <= W && sLH + 2 + vH <= H) mode = ["m-stack"];
    else if (shortW + 8 + valW <= W && vH <= H) mode = ["m-row", "m-rshort"];
    else {
      // Tight stack: trim side padding and shrink the short label up to 22%
      var W2 = r.w - 2 - 10, scale = Math.min(1, W2 / shortW);
      if (scale >= 0.78 && valW <= W2 && sLH * scale + 2 + vH <= H) { mode = ["m-stack", "m-tight"]; el.style.setProperty("--shs", scale.toFixed(3)); }
    }
    if (mode.length) { /* fits */ }
    else if (r.w - 2 - 6 >= sLH && shortW + 6 + tw(fmt(d.value), 0.8 * rem, 800) <= r.h - 2 - 16) mode = ["m-vert"];
    else if (valW <= W && vH <= H) mode = ["m-val"];
    else if (numW <= W && vH <= H) mode = ["m-num"];
    if (mode.indexOf("m-tight") < 0) el.style.removeProperty("--shs");
    MODES.forEach(function (m) { el.classList.remove(m); });
    mode.forEach(function (m) { el.classList.add(m); });
  }

  function layout() {
    fontFamily = getComputedStyle(map).fontFamily;
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var W = map.clientWidth;
    var H = Math.round(W < 600 ? W * 1.15 : W * 0.56);
    H = Math.max(H, 300);
    map.style.height = H + "px";
    var rects = [];

    if (mode === "flat") {
      rects = squarify(LEAVES, 0, 0, W, H);
      Object.keys(frames).forEach(function (g) { frames[g].classList.remove("on"); });
    } else {
      var groupData = Object.keys(GROUPS).map(function (g) { return { id: g, value: GROUPS[g].total }; });
      squarify(groupData, 0, 0, W, H).forEach(function (gr) {
        var pad = 4, strip = (gr.w > 120 && gr.h > 90) ? 24 : 0;
        var f = frames[gr.d.id];
        place(f, { x: gr.x, y: gr.y, w: gr.w, h: strip + pad }, pad);
        f.classList.toggle("on", strip > 0);
        var kids = LEAVES.filter(function (d) { return d.group === gr.d.id; });
        rects = rects.concat(squarify(kids, gr.x + pad, gr.y + pad + strip, gr.w - pad * 2, gr.h - pad * 2 - strip));
      });
    }
    var unnamed = [];
    rects.forEach(function (r) {
      var el = els[r.d.id]; place(el, r, 1); fitLabel(el, r.d, r);
      if (!/m-full|m-row|m-stack|m-vert/.test(el.className)) unnamed.push(r.d);
    });
    renderSmallKey(unnamed);
  }

  function renderSmallKey(list) {
    var box = document.getElementById("jm-smallkey");
    box.innerHTML = "";
    if (!list.length) return;
    var lead = document.createElement("span");
    lead.textContent = "Smaller boxes:";
    box.appendChild(lead);
    list.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="sw"></span><span></span><b></b>';
      b.querySelector(".sw").style.background = "var(--" + d.group + ")";
      b.querySelector("span:nth-child(2)").textContent = d.short;
      b.querySelector("b").textContent = fmt(d.value) + ", " + pct(d.value);
      b.setAttribute("aria-label", d.name + ", " + d.value.toFixed(1) + " pieces a year, " + pct(d.value));
      b.addEventListener("click", function () {
        var next = d.id === selected ? null : d.id;
        select(next);
        if (next) showTip(d); else hideTip();
      });
      box.appendChild(b);
    });
  }

  function select(id) {
    selected = id;
    map.classList.toggle("dimmed", !!id);
    Object.keys(els).forEach(function (k) { els[k].setAttribute("aria-pressed", k === id ? "true" : "false"); });
    if (!id) { detail.innerHTML = '<p class="hint">Tap a box to see what that mail includes and how to stop it.</p>'; return; }
    var d = LEAVES.filter(function (x) { return x.id === id; })[0];
    var split = d.split || (d.mm.toFixed(1) + " by Marketing Mail and " + d.fc.toFixed(1) + " by First-Class Mail");
    detail.innerHTML =
      '<span class="chip ' + d.group + '"></span>' +
      '<p class="big"></p><p class="sub"></p><h3></h3>' +
      '<dl><div><dt>What it includes</dt><dd class="has"></dd></div>' +
      '<div><dt>How to stop it</dt><dd class="how"></dd></div></dl>';
    detail.querySelector(".chip").textContent = GROUPS[d.group].long;
    detail.querySelector(".big").textContent = d.value.toFixed(1) + " pieces a year";
    detail.querySelector(".sub").textContent = "Per household. " + pct(d.value) + " of the ad mail shown. " + split + ".";
    detail.querySelector("h3").textContent = d.name;
    detail.querySelector(".has").textContent = d.has;
    detail.querySelector(".how").textContent = d.how;
  }

  var toggles = document.querySelectorAll("#junk-mail-treemap .toggle button");
  toggles.forEach(function (b) {
    b.addEventListener("click", function () {
      mode = b.getAttribute("data-mode");
      toggles.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      hideTip();
      layout();
    });
  });

  build();
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  var lastW = map.clientWidth, raf = 0;
  function onResize() {
    var w = map.clientWidth;
    if (w === lastW || raf) return;
    raf = requestAnimationFrame(function () { raf = 0; lastW = map.clientWidth; layout(); });
  }
  new ResizeObserver(onResize).observe(map);
})();
