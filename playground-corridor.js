/* Homepage Playground as a 3D corridor: the section pins to the screen and scrolling walks the camera
   down a hallway where the works float at eye level. Works are read from the existing
   carousel (.playground-strip-track, the real set only), so new Playground items show up here too.
   Reduced motion or no 3D support keeps the plain carousel. */
(function(){
  var sec = document.getElementById('playground-teaser');
  if(!sec) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!(window.CSS && CSS.supports('transform-style', 'preserve-3d'))) return;
  var links = [].slice.call(sec.querySelectorAll('.playground-strip-track > a:not([aria-hidden])'));
  if(!links.length) return;

  var GAP = 840;                 /* depth between two slots (a work or a category sign) */
  /* links may carry data-cat: a sign with the category name is placed before each new category */
  var slots = [], lastCat = null;
  links.forEach(function(a){
    var cat = a.getAttribute('data-cat');
    if(cat && cat !== lastCat){ slots.push({ cat:cat }); lastCat = cat; }
    slots.push({ a:a, cat:cat });
  });
  var N = slots.length;
  /* with category signs, leave one empty slot at the start so the first sign doesn't sit behind the intro text */
  var LEAD = slots.length > links.length ? 1 : 0;
  N += LEAD;
  var DEPTH = (N + 1) * GAP;     /* corridor length */
  var W = 2250, H = 1350;         /* corridor cross-section */

  var wrap = document.createElement('div');
  wrap.className = 'pgc';
  wrap.innerHTML = '<div class="pgc-sticky"><div class="pgc-view"><div class="pgc-world"></div></div>' +
                   '<div class="pgc-hud"><span class="pgc-count"></span><span class="pgc-hint">Scroll to walk in</span></div></div>';
  var head = sec.querySelector('.section-head');
  wrap.querySelector('.pgc-sticky').insertBefore(head, wrap.querySelector('.pgc-view'));
  sec.appendChild(wrap);
  sec.classList.add('has-corridor');
  var world = wrap.querySelector('.pgc-world');
  var count = wrap.querySelector('.pgc-count');

  /* The corridor itself is straight and uniform, so its walls look the same from any depth: they are a
     static 2D drawing (.pgc-room, drawn in measure()). Only light panels on the ceiling and joints on the
     floor move in 3D, which is what gives the feeling of walking. Few, small layers keep it smooth. */
  var room = document.createElement('div');
  room.className = 'pgc-room';
  wrap.querySelector('.pgc-sticky').insertBefore(room, wrap.querySelector('.pgc-view'));
  var rungs = [];
  for(var k = 0; k <= N + 1; k++){
    var z = -k * GAP;
    var lamp = document.createElement('div');
    lamp.className = 'pgc-lamp';
    lamp.style.transform = 'translate3d(0,' + (-H/2 + 1) + 'px,' + (z - GAP/2) + 'px) rotateX(-90deg)';
    var seam = document.createElement('div');
    seam.className = 'pgc-seam';
    seam.style.transform = 'translate3d(0,' + (H/2 - 1) + 'px,' + z + 'px) rotateX(90deg)';
    world.appendChild(lamp); world.appendChild(seam);
    rungs.push({ el:lamp, z:z - GAP/2 }, { el:seam, z:z });
  }

  /* far wall with the way out to the full Playground page */
  var end = document.createElement('a');
  end.href = 'playground.html';
  end.className = 'pgc-end';
  end.style.transform = 'translate3d(0,0,' + (-DEPTH - GAP * 0.4) + 'px)';
  end.innerHTML = '<span class="pgc-end-title">That’s the hallway.</span><span class="pgc-end-cta">&larr; Back to the grid</span>';
  world.appendChild(end);

  /* the works (alternating sides, restarting at each category) and the category signs */
  var catNo = 0, sideIx = 0;
  var works = slots.map(function(sl, i){
    var z = -(i + 1 + LEAD) * GAP;
    var el;
    if(!sl.a){
      catNo++; sideIx = 0;
      el = document.createElement('div');
      el.className = 'pgc-sign';
      el.innerHTML = '<span class="pgc-sign-name">' + sl.cat + '</span>';
      world.appendChild(el);
      return { el:el, z:z, side:0, lift:0, sign:sl.cat };
    }
    var a = sl.a, img = a.querySelector('img');
    var label = a.querySelector('.playground-strip-label');
    var side = sideIx++ % 2 ? 1 : -1;
    var lift = (i * 53 % 90) - 45;          /* small height variation so they don't line up */
    el = document.createElement('a');
    el.href = a.getAttribute('href');
    el.className = 'pgc-work';
    el.innerHTML = '<span class="pgc-swing">' +
                     '<span class="pgc-frame"><img src="' + img.getAttribute('src') + '" alt="' + (img.getAttribute('alt') || '') + '" draggable="false" decoding="async"></span>' +
                     '<span class="pgc-label">' + (label ? label.textContent : '') + '</span>' +
                   '</span>';
    world.appendChild(el);
    return { el:el, z:z, side:side, lift:lift };
  });
  var signs = works.filter(function(w){ return w.sign; });

  var vw = 0, vh = 0, target = 0, cam = 0, raf = 0;
  function measure(){
    vw = window.innerWidth; vh = window.innerHeight;
    /* section height = one screen + the walk; ~0.55 screen of scroll per work */
    sec.style.setProperty('--pgc-h', (vh + N * vh * 0.45) + 'px');
    /* fill the screen; on narrow screens hang the works closer to the middle so both rows stay in view */
    var s = Math.max(vw / W, vh / H) * 1.02;
    wrap.style.setProperty('--pgc-scale', s);
    var xOff = Math.min(W * 0.2, (vw / s) * (vw < 810 ? 0.24 : 0.36));
    works.forEach(function(w){
      if(w.sign){ w.el.style.transform = 'translate3d(0,' + (-H/2 + 270) + 'px,' + w.z + 'px)'; return; }
      w.el.style.transform = 'translate3d(' + (w.side * xOff) + 'px,' + (-250 + w.lift) + 'px,' + w.z + 'px) rotateY(' + (-w.side * (vw < 810 ? 8 : 14)) + 'deg)';
    });
    /* the room: four planes meeting at the vanishing point (screen centre); corridor corners run from there
       towards the corners of the W x H cross-section at the camera plane, scaled to the screen */
    var cx = vw / 2, cy = vh / 2, hx = W / 2 * s * 3, hy = H / 2 * s * 3;
    function P(x, y){ return (cx + x).toFixed(1) + ',' + (cy + y).toFixed(1); }
    room.innerHTML = '<svg width="' + vw + '" height="' + vh + '" viewBox="0 0 ' + vw + ' ' + vh + '" aria-hidden="true">' +
      '<defs><radialGradient id="pgcFog" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".07"/><stop offset=".35" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<polygon class="pgc-c" points="' + P(0,0) + ' ' + P(-hx,-hy) + ' ' + P(hx,-hy) + '"/>' +
      '<polygon class="pgc-f" points="' + P(0,0) + ' ' + P(-hx,hy) + ' ' + P(hx,hy) + '"/>' +
      '<polygon class="pgc-w" points="' + P(0,0) + ' ' + P(-hx,-hy) + ' ' + P(-hx,hy) + '"/>' +
      '<polygon class="pgc-w" points="' + P(0,0) + ' ' + P(hx,-hy) + ' ' + P(hx,hy) + '"/>' +
      '<rect x="' + (cx - vw) + '" y="' + (cy - vw) + '" width="' + (vw * 2) + '" height="' + (vw * 2) + '" fill="url(#pgcFog)"/>' +
      '</svg>';
  }
  function progress(){
    var r = wrap.getBoundingClientRect();
    var run = r.height - vh;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }
  function frame(){
    raf = 0;
    target = progress() * (DEPTH - GAP * 0.7);
    cam += (target - cam) * 0.2;
    if(Math.abs(target - cam) < 0.5) cam = target;
    world.style.transform = 'translate3d(0,0,' + cam.toFixed(1) + 'px)';
    rungs.forEach(function(r){
      var d = r.z + cam;                       /* > 0 means behind the camera */
      var hide = d > GAP * 0.55;
      if(r.hidden !== hide){ r.hidden = hide; r.el.style.visibility = hide ? 'hidden' : ''; }
    });
    works.forEach(function(w, i){
      var d = w.z + cam;                       /* distance: negative = ahead */
      var op = d > 270 ? 0 : d > -90 ? Math.max(0, 1 - (d + 90) / 360) : Math.max(0.05, Math.min(1, 1 + (d + 900) / 3900));
      /* signs only show when you get close, so far-off names don't pile up behind the works */
      if(w.sign) op = d < -GAP * 1.9 ? 0 : Math.min(op, Math.min(1, (d + GAP * 1.9) / (GAP * 0.7)));
      op = Math.round(op * 50) / 50;
      if(w.op === op) return;
      w.op = op;
      w.el.style.opacity = op;
      w.el.style.visibility = op < 0.02 ? 'hidden' : '';
      w.el.style.pointerEvents = op > 0.4 ? '' : 'none';
    });
    var c;
    if(signs.length){
      c = signs[0].sign;
      signs.forEach(function(sg){ if(sg.z + cam > -GAP * 0.5) c = sg.sign; });
    } else c = String(Math.min(N, Math.max(1, Math.round(cam / GAP)))).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    if(count.textContent !== c) count.textContent = c;
    wrap.classList.toggle('is-walking', cam > 60);
    if(cam !== target) raf = requestAnimationFrame(frame);
  }
  function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', kick, { passive:true });
  window.addEventListener('resize', function(){ measure(); kick(); });
  measure();
  cam = target = progress() * (DEPTH - GAP * 0.7);
  frame();
})();
