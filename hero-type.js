/* Hero type play: the headline as a set of loose letters.
   - hover (mouse): letters near the cursor swell in weight (Inter is variable, 600 -> 900) and lift
   - drag: grab any letter, throw it around the card; it bounces off the edges, knocks other
     letters on the way, then springs back home with a little wobble
   - tap / click: the letter flips between Inter and an italic Bodoni Moda
   Only transforms + font-weight are touched, and the loop sleeps as soon as everything is at rest. */
(function(){
  var hero = document.querySelector('.hero.type-play');
  var heading = hero && hero.querySelector('h1');
  if(!hero || !heading) return;
  var card = hero.closest('.hero-card') || hero;
  var hint = hero.querySelector('.type-hint');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- split into words > letters ---------- */
  heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  var letters = [];
  function split(el){
    Array.prototype.slice.call(el.childNodes).forEach(function(node){
      if(node.nodeType === 3){
        var frag = document.createDocumentFragment();
        node.textContent.split(/( )/).forEach(function(part){
          if(!part) return;
          if(part === ' '){ frag.appendChild(document.createTextNode(' ')); return; }
          var word = document.createElement('span');
          word.className = 'word'; word.setAttribute('aria-hidden', 'true');
          part.split('').forEach(function(ch){
            if(ch === ' '){ word.appendChild(document.createTextNode(ch)); return; }
            var s = document.createElement('span');
            s.className = 'tl'; s.textContent = ch;
            word.appendChild(s);
            letters.push({ el:s, x:0, y:0, vx:0, vy:0, r:0, vr:0, w:600, lift:0,
                           hx:0, hy:0, hw:0, hh:0, held:false, flying:false, released:0 });
          });
          frag.appendChild(word);
        });
        node.parentNode.replaceChild(frag, node);
      } else if(node.nodeType === 1 && node.tagName !== 'BR' && !node.classList.contains('icon-chip')){
        split(node);
      } else if(node.nodeType === 1 && node.classList.contains('icon-chip')){
        node.setAttribute('aria-hidden', 'true');
      }
    });
  }
  split(heading);

  /* ---------- measuring (reads only) ---------- */
  var box = null, bounds = null, fs = 50;
  function measure(){
    var hr = heading.getBoundingClientRect(), cr = card.getBoundingClientRect();
    box = hr;
    bounds = { l:cr.left - hr.left, t:cr.top - hr.top, r:cr.right - hr.left, b:cr.bottom - hr.top };
    fs = parseFloat(getComputedStyle(heading).fontSize) || 50;
    for(var i = 0; i < letters.length; i++){
      var L = letters[i], e = L.el;
      // offsetLeft/Top ignore transforms, so this is where the letter lives at rest
      L.hw = e.offsetWidth/2; L.hh = e.offsetHeight/2;
      L.hx = e.offsetLeft + L.hw; L.hy = e.offsetTop + L.hh;
    }
  }

  /* ---------- pointer ---------- */
  var mouse = { x:-1e4, y:-1e4, over:false };
  var held = null, grab = { dx:0, dy:0, sx:0, sy:0, moved:false, px:0, py:0, t:0, vx:0, vy:0 };
  function local(e){ var hr = heading.getBoundingClientRect(); return { x:e.clientX - hr.left, y:e.clientY - hr.top }; }

  hero.addEventListener('pointermove', function(e){
    if(e.pointerType !== 'mouse') return;
    var p = local(e); mouse.x = p.x; mouse.y = p.y; mouse.over = true; wake();
  }, { passive:true });
  hero.addEventListener('pointerleave', function(){ mouse.over = false; wake(); });

  heading.addEventListener('pointerdown', function(e){
    var el = e.target.closest && e.target.closest('.tl');
    if(!el || held) return;
    var L = letters.find(function(l){ return l.el === el; });
    if(!L) return;
    e.preventDefault();
    try{ el.setPointerCapture(e.pointerId); }catch(_){}
    measure();
    var p = local(e);
    held = L; L.held = true; L.flying = false;
    grab.dx = p.x - (L.hx + L.x); grab.dy = p.y - (L.hy + L.y);
    grab.sx = e.clientX; grab.sy = e.clientY; grab.moved = false;
    grab.px = p.x; grab.py = p.y; grab.t = performance.now(); grab.vx = grab.vy = 0;
    el.classList.add('grabbed');
    wake();
  });
  window.addEventListener('pointermove', function(e){
    if(!held) return;
    if(Math.abs(e.clientX - grab.sx) + Math.abs(e.clientY - grab.sy) > 5) grab.moved = true;
    if(calm) return;
    var p = local(e), now = performance.now(), dt = Math.max(1, now - grab.t)/1000;
    // smoothed throw velocity
    grab.vx = grab.vx*.6 + ((p.x - grab.px)/dt)*.4; grab.vy = grab.vy*.6 + ((p.y - grab.py)/dt)*.4;
    grab.px = p.x; grab.py = p.y; grab.t = now;
    if(hint && grab.moved) hint.classList.add('gone');
  }, { passive:true });
  function release(){
    if(!held) return;
    var L = held; held = null; L.held = false;
    L.el.classList.remove('grabbed');
    if(!grab.moved){ flip(L); }
    else if(!calm){
      var sp = Math.hypot(grab.vx, grab.vy), cap = 4200;
      if(sp > cap){ grab.vx *= cap/sp; grab.vy *= cap/sp; }
      if(performance.now() - grab.t > 90){ grab.vx = grab.vy = 0; } // held still before letting go
      L.vx = grab.vx; L.vy = grab.vy; L.vr = grab.vx*.08;
      L.flying = true; L.released = performance.now();
    }
    wake();
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  function flip(L){
    L.el.classList.toggle('serif');
    L.el.classList.remove('pop'); void L.el.offsetWidth; L.el.classList.add('pop');
    if(hint) hint.classList.add('gone');
  }
  // keyboard / no-pointer fallback is the plain heading, which is still read as one label

  /* ---------- loop ---------- */
  var running = false, last = 0, visible = true;
  function wake(){ if(!running && visible){ running = true; last = performance.now(); requestAnimationFrame(loop); } }

  function loop(now){
    if(!visible){ running = false; return; }
    var dt = Math.min(1/30, (now - last)/1000); last = now;
    measure();
    var busy = false, R = fs*1.5;

    for(var i = 0; i < letters.length; i++){
      var L = letters[i];
      var cx = L.hx + L.x, cy = L.hy + L.y;

      /* weight + lift from the cursor */
      var A = 0;
      if(mouse.over && !calm){
        var dx = (mouse.x - L.hx)/R, dy = (mouse.y - L.hy)/(R*.8);
        A = Math.exp(-(dx*dx + dy*dy)*1.6);
      }
      var goalW = L.held ? 900 : 600 + 300*A, goalLift = calm ? 0 : -fs*.08*A;
      L.w += (goalW - L.w)*Math.min(1, dt*14);
      L.lift += (goalLift - L.lift)*Math.min(1, dt*12);

      if(!calm){
        if(L.held){
          var tx = grab.px - grab.dx - L.hx, ty = grab.py - grab.dy - L.hy;
          L.vx = (tx - L.x)/Math.max(dt, 1/120); L.vy = (ty - L.y)/Math.max(dt, 1/120);
          L.x += (tx - L.x)*Math.min(1, dt*28); L.y += (ty - L.y)*Math.min(1, dt*28);
          var goalR = Math.max(-28, Math.min(28, grab.vx*.012));
          L.r += (goalR - L.r)*Math.min(1, dt*10);
        } else if(L.flying){
          var fr = Math.exp(-1.6*dt);
          L.vx *= fr; L.vy *= fr; L.vr *= fr;
          L.x += L.vx*dt; L.y += L.vy*dt; L.r += L.vr*dt;
          // bounce off the hero card
          var ax = L.hx + L.x, ay = L.hy + L.y, pad = 6;
          if(ax - L.hw < bounds.l + pad){ L.x = bounds.l + pad + L.hw - L.hx; L.vx = Math.abs(L.vx)*.62; L.vr *= -.7; }
          if(ax + L.hw > bounds.r - pad){ L.x = bounds.r - pad - L.hw - L.hx; L.vx = -Math.abs(L.vx)*.62; L.vr *= -.7; }
          if(ay - L.hh < bounds.t + pad){ L.y = bounds.t + pad + L.hh - L.hy; L.vy = Math.abs(L.vy)*.62; }
          if(ay + L.hh > bounds.b - pad){ L.y = bounds.b - pad - L.hh - L.hy; L.vy = -Math.abs(L.vy)*.62; }
          if(now - L.released > 1100 || Math.hypot(L.vx, L.vy) < 40 && now - L.released > 450) L.flying = false;
        } else {
          // under-damped spring home: a little wobble as it lands
          L.vx += (-L.x*170 - L.vx*13)*dt; L.vy += (-L.y*170 - L.vy*13)*dt; L.vr += (-L.r*170 - L.vr*11)*dt;
          L.x += L.vx*dt; L.y += L.vy*dt; L.r += L.vr*dt;
        }

        /* a moving letter knocks the ones it passes */
        if(L.held || L.flying){
          var sp = Math.hypot(L.vx, L.vy);
          if(sp > 200){
            cx = L.hx + L.x; cy = L.hy + L.y;
            for(var j = 0; j < letters.length; j++){
              var O = letters[j]; if(O === L || O.held) continue;
              var ox = O.hx + O.x - cx, oy = O.hy + O.y - cy, d = Math.hypot(ox, oy), reach = L.hw + O.hw + fs*.15;
              if(d < reach && d > .01){
                var push = (1 - d/reach)*Math.min(sp, 2500)*.9;
                O.vx += ox/d*push; O.vy += oy/d*push; O.vr += (ox > 0 ? 1 : -1)*push*.15;
              }
            }
          }
        }
      }

      var moving = Math.abs(L.x) + Math.abs(L.y) + Math.abs(L.r) > .05 || Math.abs(L.vx) + Math.abs(L.vy) + Math.abs(L.vr) > .5;
      var weighting = Math.abs(L.w - goalW) > .5 || Math.abs(L.lift - goalLift) > .05;
      if(!moving && !L.held && !L.flying){ L.x = L.y = L.r = L.vx = L.vy = L.vr = 0; }
      if(moving || weighting || L.held || L.flying) busy = true;
    }

    /* writes */
    for(var k = 0; k < letters.length; k++){
      var M = letters[k], w = Math.round(M.w);
      if(w !== M._w){ M.el.style.fontWeight = w; M._w = w; }
      var tf = (M.x || M.y || M.r || M.lift) ? 'translate3d(' + M.x.toFixed(1) + 'px,' + (M.y + M.lift).toFixed(1) + 'px,0) rotate(' + M.r.toFixed(1) + 'deg)' : '';
      if(tf !== M._tf){ M.el.style.transform = tf; M._tf = tf; }
    }

    if(busy || held) requestAnimationFrame(loop);
    else running = false;
  }

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) wake(); }).observe(hero);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){ measure(); wake(); });
})();
