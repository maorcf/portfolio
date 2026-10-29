// Design tuning panel: open any page with ?tune to adjust sizes and spacing live.
// Values are kept in this browser; "Copy values" puts them on the clipboard to send to Claude.
(function(){
  var KEY = 'tune:' + location.pathname;
  var home = !!document.querySelector('.hero-ethan'), cs = !!document.querySelector('main.cs2');
  var C = [];
  function add(group, label, sel, prop, unit, min, max, step){ C.push({ group:group, label:label, sel:sel, prop:prop, unit:unit, min:min, max:max, step:step || 1 }); }

  if(home){
    add('Home hero', 'Name size', '.hero .hero-name', 'font-size', 'px', 40, 260);
    add('Home hero', 'Name letter spacing', '.hero .hero-name', 'letter-spacing', 'em', -0.1, 0.05, 0.005);
    add('Home hero', 'Space above hero', '.hero.hero-ethan', 'padding-top', 'px', 0, 200);
    add('Home hero', 'Gap between items', '.hero.hero-ethan', 'gap', 'px', 0, 80);
    add('Home hero', 'Photo width', '.hero-portrait', 'max-width', 'px', 160, 480);
    add('Home hero', 'Photo corner radius', '.hero-portrait', 'border-radius', 'px', 0, 40);
    add('Home hero', 'Intro text size', '.hero.hero-ethan .lead', 'font-size', 'px', 12, 32);
    add('Home hero', 'Intro text width', '.hero.hero-ethan .lead', 'max-width', 'px', 240, 720);
    add('Home sections', 'Section title size', '.section-head .section-title', 'font-size', 'px', 32, 140);
  }
  if(cs){
    add('Case study hero', 'Project name size', '.cs2-clean .cs-hero-word', 'font-size', 'px', 40, 260);
    add('Case study hero', 'Screenshot width', '.cs2-clean .cs-hero-browser', 'width', 'vw', 30, 70);
    add('Case study hero', 'Intro text size', '.cs2-clean .page-title p', 'font-size', 'px', 12, 32);
    add('Case study sections', 'Space between sections', '.cs2-clean .cs2-band', 'padding-top', 'px', 32, 200);
    add('Case study sections', 'Section title size', '.cs2-band h2', 'font-size', 'px', 20, 80);
    add('Case study sections', 'Body text size', '.cs2-lead', 'font-size', 'px', 13, 24);
    add('Case study sections', 'Card title size', '.cs2-card h3', 'font-size', 'px', 13, 32);
    add('Case study sections', 'Card text size', '.cs2-card p', 'font-size', 'px', 12, 22);
    add('Case study sections', 'Card corner radius', '.cs2-card', 'border-radius', 'px', 0, 40);
    add('Case study sections', 'Image corner radius', '.cs2-shots img, .cs2-figure img, .cs2-compare img', 'border-radius', 'px', 0, 40);
  }
  add('Site', 'Header link size', '.floating-nav .nav-links a, header .nav-links a', 'font-size', 'px', 11, 22);

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){}
  var style = document.createElement('style'); document.head.appendChild(style);

  function current(c){
    var el = document.querySelector(c.sel.split(',')[0]);
    if(!el) return null;
    var v = parseFloat(getComputedStyle(el)[c.prop.replace(/-(\w)/g, function(_, l){ return l.toUpperCase(); })]);
    if(isNaN(v)) return c.min;
    if(c.unit === 'em') v = v / parseFloat(getComputedStyle(el).fontSize);
    if(c.unit === 'vw') v = v / window.innerWidth * 100;
    return Math.round(v / c.step) * c.step;
  }
  function id(c){ return c.sel + '|' + c.prop; }
  function css(){
    return C.filter(function(c){ return saved[id(c)] != null; }).map(function(c){
      return c.sel + '{ ' + c.prop + ':' + saved[id(c)] + c.unit + ' !important; }';
    }).join('\n');
  }
  function apply(){ style.textContent = css(); try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch(e){} }

  var p = document.createElement('div');
  p.setAttribute('data-lenis-prevent', '');
  p.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:100000;width:300px;max-height:75vh;overflow:auto;background:#fff;color:#141414;border:1px solid rgba(0,0,0,.15);border-radius:12px;box-shadow:0 20px 50px -20px rgba(0,0,0,.35);font:13px/1.35 Inter,system-ui,sans-serif;';
  var html = '<div style="position:sticky;top:0;background:#fff;padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center;z-index:1"><b>Tune this page</b><button data-act="min" style="all:unset;cursor:pointer;padding:0 4px">–</button></div><div data-body style="padding:6px 14px 14px">';
  var g = '';
  C.forEach(function(c, i){
    if(!document.querySelector(c.sel.split(',')[0])) return;
    if(c.group !== g){ g = c.group; html += '<div style="margin:14px 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888">' + g + '</div>'; }
    var v = saved[id(c)] != null ? saved[id(c)] : current(c);
    html += '<label style="display:block;margin:8px 0"><span style="display:flex;justify-content:space-between"><span>' + c.label + '</span><span data-out="' + i + '" style="color:#5B4CE0;font-weight:600">' + v + c.unit + '</span></span>' +
      '<input type="range" data-i="' + i + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + v + '" style="width:100%;accent-color:#5B4CE0"></label>';
  });
  html += '<div style="display:flex;gap:8px;margin-top:14px"><button data-act="copy" style="flex:1;padding:9px;border:0;border-radius:6px;background:#141414;color:#fff;font-weight:600;cursor:pointer">Copy values</button><button data-act="reset" style="padding:9px 12px;border:1px solid rgba(0,0,0,.2);border-radius:6px;background:#fff;cursor:pointer">Reset</button></div>' +
    '<div data-msg style="margin-top:8px;font-size:12px;color:#888">Sizes are for this screen width. Paste the copied values to Claude.</div></div>';
  p.innerHTML = html;
  document.body.appendChild(p);

  p.addEventListener('input', function(e){
    var i = e.target.getAttribute('data-i'); if(i == null) return;
    var c = C[i]; saved[id(c)] = parseFloat(e.target.value);
    p.querySelector('[data-out="' + i + '"]').textContent = e.target.value + c.unit;
    apply();
  });
  p.addEventListener('click', function(e){
    var act = e.target.getAttribute('data-act'); if(!act) return;
    var msg = p.querySelector('[data-msg]');
    if(act === 'min'){ var b = p.querySelector('[data-body]'); b.style.display = b.style.display === 'none' ? '' : 'none'; e.target.textContent = b.style.display === 'none' ? '+' : '–'; }
    if(act === 'reset'){ saved = {}; apply(); location.reload(); }
    if(act === 'copy'){
      var lines = C.filter(function(c){ return saved[id(c)] != null; }).map(function(c){ return c.label + ': ' + saved[id(c)] + c.unit; });
      var text = 'Tune values for ' + location.pathname + ' at ' + window.innerWidth + 'px wide:\n' + (lines.join('\n') || '(nothing changed)') + '\n\nCSS:\n' + css();
      var done = function(){ msg.textContent = 'Copied. Paste it in the chat.'; msg.style.color = '#2A8A3E'; };
      if(navigator.clipboard) navigator.clipboard.writeText(text).then(done, function(){ prompt('Copy this:', text); });
      else prompt('Copy this:', text);
    }
  });
  apply();
})();
