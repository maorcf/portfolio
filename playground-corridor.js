/* Homepage Playground as a 3D corridor: the section pins to the screen and scrolling walks the camera
   down a hallway where the works float at eye level. Works are read from the existing
   carousel (.playground-strip-track, the real set only), so new Playground items show up here too.
   Reduced motion or no 3D support keeps the plain carousel. */
(function(){
  var sec = document.getElementById('playground-teaser');
  if(!sec) return;
  /* the hallway page is opened on purpose to walk through, so it runs even with reduced motion (it only moves while you scroll) */
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches && !sec.classList.contains('hallway-section')) return;
  if(!(window.CSS && CSS.supports('transform-style', 'preserve-3d'))) return;
  var links = [].slice.call(sec.querySelectorAll('.playground-strip-track > a:not([aria-hidden])'));
  if(!links.length) return;

  /* phones (iOS Safari above all) run out of memory with dozens of big 3D layers, so there: no floor light pools,
     and only the stretch of corridor near the camera is rendered at all (see FAR) */
  var SMALL = window.matchMedia('(max-width:809px), (pointer:coarse)').matches;
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
    if(!SMALL){
      var pool = document.createElement('div');
      pool.className = 'pgc-pool';
      pool.style.transform = 'translate3d(0,' + (H/2 - 2) + 'px,' + (z - GAP/2) + 'px) rotateX(90deg)';
      world.appendChild(pool);
      rungs.push({ el:pool, z:z - GAP/2 });
    }
    world.appendChild(lamp); world.appendChild(seam);
    rungs.push({ el:lamp, z:z - GAP/2 }, { el:seam, z:z });
  }

  /* far wall with the way out to the full Playground page */
  var end = document.createElement('div');
  end.className = 'pgc-end';
  end.style.transform = 'translate3d(0,0,' + (-DEPTH - GAP * 0.4) + 'px)';
  end.innerHTML = '<span class="pgc-end-title">That’s the hallway.</span><a class="pgc-end-cta" href="playground.html">&larr; Back to the grid</a>';
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
    /* a soft shadow on the floor under it */
    var shadow = document.createElement('div');
    shadow.className = 'pgc-shadow';
    world.insertBefore(shadow, el);
    return { el:el, z:z, side:side, lift:lift, extra:[shadow] };
  });
  var endItem = { el:end, z:-DEPTH - GAP * 0.4 };
  var FAR = GAP * (SMALL ? 7 : 14);   /* anything further ahead than this is taken out of rendering */
  function cull(o, off){ if(o.off !== off){ o.off = off; o.el.style.display = off ? 'none' : ''; if(o.extra) o.extra.forEach(function(x){ x.style.display = off ? 'none' : ''; }); } }
  var signs = works.filter(function(w){ return w.sign; });

  var vw = 0, vh = 0, target = 0, cam = 0, raf = 0;
  var sticky = wrap.querySelector('.pgc-sticky');
  function measure(){
    /* use the sticky box's height (100svh), not innerHeight: on phones innerHeight changes every time the
       address bar slides in or out, which used to resize the whole walk and make the scroll jump */
    vw = window.innerWidth; vh = sticky.clientHeight || window.innerHeight;
    /* section height = one screen + the walk; ~0.55 screen of scroll per work */
    sec.style.setProperty('--pgc-h', (vh + N * vh * 0.45) + 'px');
    /* fill the screen; on narrow screens hang the works closer to the middle so both rows stay in view */
    var s = Math.max(vw / W, vh / H) * 1.02;
    wrap.style.setProperty('--pgc-scale', s);
    var xOff = Math.min(W * 0.2, (vw / s) * (vw < 810 ? 0.24 : 0.36));
    works.forEach(function(w){
      if(w.sign){ w.el.style.transform = 'translate3d(0,' + (-H/2 + 270) + 'px,' + w.z + 'px)'; return; }
      var x = w.side * xOff, rot = 'rotateY(' + (-w.side * (vw < 810 ? 8 : 14)) + 'deg)';
      var top = -250 + w.lift;
      w.el.style.transform = 'translate3d(' + x + 'px,' + top + 'px,' + w.z + 'px) ' + rot;
      w.extra[0].style.transform = 'translate3d(' + x + 'px,' + (H/2 - 3) + 'px,' + w.z + 'px) rotateX(90deg)';
    });
    /* the room: four planes meeting at the vanishing point (screen centre); corridor corners run from there
       towards the corners of the W x H cross-section at the camera plane, scaled to the screen */
    var cx = vw / 2, cy = vh / 2, hx = W / 2 * s * 3, hy = H / 2 * s * 3, bb = 70 * s * 3;
    function P(x, y){ return (cx + x).toFixed(1) + ',' + (cy + y).toFixed(1); }
    room.innerHTML = '<svg width="' + vw + '" height="' + vh + '" viewBox="0 0 ' + vw + ' ' + vh + '" aria-hidden="true">' +
      '<defs><radialGradient id="pgcFog" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".07"/><stop offset=".35" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><filter id="pgcBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + (10 * s * 3).toFixed(1) + '"/></filter>' +
      /* textures: fine grain (concrete / plaster) everywhere, soft cloudy patches on the floor */
      '<filter id="pgcGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .9 0 0 0 -.38"/></filter>' +
      '<filter id="pgcMottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0035 .011" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .7 0 0 0 -.3"/></filter>' +
      '<clipPath id="pgcFloorClip"><polygon points="' + P(0,0) + ' ' + P(-hx,hy) + ' ' + P(hx,hy) + '"/></clipPath></defs>' +
      '<polygon class="pgc-c" points="' + P(0,0) + ' ' + P(-hx,-hy) + ' ' + P(hx,-hy) + '"/>' +
      '<polygon class="pgc-f" points="' + P(0,0) + ' ' + P(-hx,hy) + ' ' + P(hx,hy) + '"/>' +
      '<polygon class="pgc-w" points="' + P(0,0) + ' ' + P(-hx,-hy) + ' ' + P(-hx,hy) + '"/>' +
      '<polygon class="pgc-w" points="' + P(0,0) + ' ' + P(hx,-hy) + ' ' + P(hx,hy) + '"/>' +
      '<g class="pgc-tex"><rect width="' + vw + '" height="' + vh + '" filter="url(#pgcGrain)"/></g>' +
      '<g clip-path="url(#pgcFloorClip)"><rect class="pgc-mottle" width="' + vw + '" height="' + vh + '" filter="url(#pgcMottle)"/>' +
        [-750, -375, 0, 375, 750].map(function(x){ return '<line class="pgc-joint" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + x * s * 3).toFixed(1) + '" y2="' + (cy + hy).toFixed(1) + '"/>'; }).join('') + '</g>' +
      '<g class="pgc-ao" filter="url(#pgcBlur)"><polyline points="' + P(-hx,hy) + ' ' + P(0,0) + ' ' + P(hx,hy) + '"/><polyline points="' + P(-hx,-hy) + ' ' + P(0,0) + ' ' + P(hx,-hy) + '"/></g>' +
      '<polygon class="pgc-bb" points="' + P(0,0) + ' ' + P(-hx,hy) + ' ' + P(-hx,hy - bb) + '"/>' +
      '<polygon class="pgc-bb" points="' + P(0,0) + ' ' + P(hx,hy) + ' ' + P(hx,hy - bb) + '"/>' +
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
    target = progress() * (DEPTH - GAP * 0.6);
    cam += (target - cam) * 0.2;
    if(Math.abs(target - cam) < 0.5) cam = target;
    world.style.transform = 'translate3d(0,0,' + cam.toFixed(1) + 'px)';
    rungs.forEach(function(r){
      var d = r.z + cam;                       /* > 0 means behind the camera */
      var hide = d > GAP * 0.55;
      if(r.hidden !== hide){ r.hidden = hide; r.el.style.visibility = hide ? 'hidden' : ''; }
      cull(r, d < -FAR || d > GAP);
    });
    cull(endItem, endItem.z + cam < -FAR);
    works.forEach(function(w, i){
      var d = w.z + cam;                       /* distance: negative = ahead */
      cull(w, d < -FAR || d > GAP);
      var op = d > 240 ? 0 : d > -90 ? Math.max(0, 1 - (d + 90) / 330) : Math.max(0.05, Math.min(1, 1 + (d + 900) / 3900));
      /* signs only show when you get close, so far-off names don't pile up behind the works */
      if(w.sign) op = d < -GAP * 1.9 ? 0 : Math.min(op, Math.min(1, (d + GAP * 1.9) / (GAP * 0.7)));
      op = Math.round(op * 50) / 50;
      if(w.op === op) return;
      w.op = op;
      w.el.style.opacity = op;
      w.el.style.visibility = op < 0.02 ? 'hidden' : '';
      w.el.style.pointerEvents = op > 0.4 ? '' : 'none';
      if(w.extra) w.extra.forEach(function(x){ x.style.opacity = op; x.style.visibility = op < 0.02 ? 'hidden' : ''; });
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
  /* ignore height-only resizes (the phone address bar); re-measure when the width really changes */
  var lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function(){
    var w = window.innerWidth, h = window.innerHeight;
    if(w === lastW && SMALL && Math.abs(h - lastH) < 160) return;
    lastW = w; lastH = h; measure(); kick();
  });
  measure();
  cam = target = progress() * (DEPTH - GAP * 0.6);
  frame();
})();
