/* GoatCounter events: what readers actually do, not only page visits.
   Each event is counted at most once per page load. GoatCounter skips
   localhost, so nothing is sent while you test locally. */
(function () {
  'use strict';

  var sent = {};

  function track(path, title) {
    if (sent[path]) return;
    sent[path] = true;
    var tries = 0;
    (function send() {
      // count.js loads async; wait for it (up to ~10 s) instead of dropping early events
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({ path: path, title: title, event: true });
      } else if (tries++ < 20) {
        setTimeout(send, 500);
      }
    })();
  }

  function once(el, type, fn) {
    if (el) el.addEventListener(type, fn, { once: true });
  }

  function whenSeen(el, fn) {
    if (!el) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { threshold: 0.25 });
    io.observe(el);
  }

  // Hero
  var mailbox = document.getElementById('mailbox');
  once(mailbox, 'click', function () { track('mailbox-open', 'Opened the mailbox'); });
  if (mailbox) {
    mailbox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') track('mailbox-open', 'Opened the mailbox');
    });
  }
  once(document.getElementById('next6'), 'click', function () { track('start-reading', 'Clicked "Start reading"'); });

  // Charts
  document.querySelectorAll('#junk-mail-treemap .toggle button[data-mode="grouped"]').forEach(function (b) {
    once(b, 'click', function () { track('treemap-grouped', 'Treemap: "Can you stop it?" view'); });
  });
  once(document.getElementById('show-age'), 'click', function () { track('flow-age-view', 'Flow chart: age view'); });

  // Reading depth
  whenSeen(document.getElementById('s3'), function () { track('reached-treemap', 'Reached the sender treemap'); });
  whenSeen(document.getElementById('mailstream-demographics'), function () { track('reached-flow-chart', 'Reached the flow chart'); });
  whenSeen(document.getElementById('optout-end'), function () { track('reached-optout', 'Reached the opt-out links'); });

  // Opt-out links: one event per destination
  document.querySelectorAll('#optout-end a[href]').forEach(function (a) {
    var host = a.hostname.replace(/^www\./, '');
    var slug = host === 'support.google.com' ? 'gmail-help' : host.split('.')[0];
    a.addEventListener('click', function () { track('optout-' + slug, 'Opt-out link: ' + host); });
  });
})();
