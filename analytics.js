/* Vercel Web Analytics + Microsoft Clarity, skipped on browsers Maor has marked as his own.
   Visit any page with ?notrack=1 to stop counting this browser, ?track=1 to undo. */
(function () {
  var KEY = 'mcf-notrack';
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('notrack') === '1') {
      localStorage.setItem(KEY, '1');
      alert('This browser will no longer be counted in analytics.');
    } else if (q.get('track') === '1') {
      localStorage.removeItem(KEY);
      alert('This browser is counted in analytics again.');
    }
    if (localStorage.getItem(KEY) === '1') return;
  } catch (e) {}
  if (/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) || location.protocol === 'file:') return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);

  // Microsoft Clarity: visit length, scroll depth, session recordings.
  var CLARITY_ID = '';
  if (!CLARITY_ID) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
})();
