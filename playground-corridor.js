/* Homepage Playground as a 3D corridor: the section pins to the screen and scrolling walks the camera
   down a hallway where the works hang from the ceiling on strings. Works are read from the existing
   carousel (.playground-strip-track, the real set only), so new Playground items show up here too.
   Reduced motion or no 3D support keeps the plain carousel. */
(function(){
  var sec = document.getElementById('playground-teaser');
  if(!sec) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!(window.CSS && CSS.supports('transform-style', 'preserve-3d'))) return;
  var links = [].slice.call(sec.querySelectorAll('.playground-strip-track > a:not([aria-hidden])'));
  if(!links.length) return;

  var GAP = 840;                 /* depth between two hanging works */
  var N = links.length;
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

  /* walls, floor and ceiling in GAP-long segments, so pieces behind the camera can be hidden */
  var segs = [];
  for(var k = 0; k <= N + 1; k++){
    var z = -k * GAP;
    ['l','r','f','c'].forEach(function(side){
      var p = document.createElement('div');
      p.className = 'pgc-plane pgc-' + side;
      var t;
      if(side === 'l') t = 'translate3d(' + (-W/2) + 'px,0,' + (z - GAP/2) + 'px) rotateY(90deg)';
      if(side === 'r') t = 'translate3d(' + (W/2) + 'px,0,' + (z - GAP/2) + 'px) rotateY(-90deg)';
      if(side === 'f') t = 'translate3d(0,' + (H/2) + 'px,' + (z - GAP/2) + 'px) rotateX(90deg)';
      if(side === 'c') t = 'translate3d(0,' + (-H/2) + 'px,' + (z - GAP/2) + 'px) rotateX(-90deg)';
      p.style.transform = t;
      world.appendChild(p);
      segs.push({ el:p, z:z });
    });
  }

  /* far wall with the way out to the full Playground page */
  var end = document.createElement('a');
  end.href = 'playground.html';
  end.className = 'pgc-end';
  end.style.transform = 'translate3d(0,0,' + (-DEPTH - GAP * 0.4) + 'px)';
  end.innerHTML = '<span class="pgc-end-title">That’s the hallway.</span><span class="pgc-end-cta">See the whole Playground &rarr;</span>';
  world.appendChild(end);

  /* the hanging works */
  var works = links.map(function(a, i){
    var img = a.querySelector('img');
    var label = a.querySelector('.playground-strip-label');
    var side = i % 2 ? 1 : -1;
    var z = -(i + 1) * GAP;
    var drop = 180 + (i * 53 % 135);          /* string length, varied */
    var el = document.createElement('a');
    el.href = a.getAttribute('href');
    el.className = 'pgc-work';
    el.innerHTML = '<span class="pgc-swing" style="padding-top:' + drop + 'px;animation-delay:' + (-i * 0.7) + 's">' +
                     '<span class="pgc-string pgc-string-l" style="height:' + drop + 'px"></span><span class="pgc-string pgc-string-r" style="height:' + drop + 'px"></span>' +
                     '<span class="pgc-frame"><img src="' + img.getAttribute('src') + '" alt="' + (img.getAttribute('alt') || '') + '" draggable="false"></span>' +
                     '<span class="pgc-label">' + (label ? label.textContent : '') + '</span>' +
                   '</span>';
    world.appendChild(el);
    return { el:el, z:z, side:side };
  });

  var vw = 0, vh = 0, mx = 0, my = 0, cx = 0, cy = 0, target = 0, cam = 0, raf = 0;
  function measure(){
    vw = window.innerWidth; vh = window.innerHeight;
    /* section height = one screen + the walk; ~0.55 screen of scroll per work */
    sec.style.setProperty('--pgc-h', (vh + N * vh * 0.55) + 'px');
    /* fill the screen; on narrow screens hang the works closer to the middle so both rows stay in view */
    var s = Math.max(vw / W, vh / H) * 1.02;
    wrap.style.setProperty('--pgc-scale', s);
    var xOff = Math.min(W * 0.2, (vw / s) * (vw < 810 ? 0.24 : 0.36));
    works.forEach(function(w){
      w.el.style.transform = 'translate3d(' + (w.side * xOff) + 'px,' + (-H/2) + 'px,' + w.z + 'px) rotateY(' + (-w.side * (vw < 810 ? 8 : 14)) + 'deg)';
    });
  }
  function progress(){
    var r = wrap.getBoundingClientRect();
    var run = r.height - vh;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }
  function frame(){
    raf = 0;
    target = progress() * (DEPTH - GAP * 0.7);
    cam += (target - cam) * 0.12;
    cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
    world.style.transform = 'translateZ(' + cam + 'px) rotateY(' + (cx * 3) + 'deg) rotateX(' + (-cy * 2) + 'deg)';
    segs.forEach(function(s){
      var d = s.z + cam;                       /* > 0 means behind the camera */
      s.el.style.visibility = d > GAP * 1.02 ? 'hidden' : '';
    });
    works.forEach(function(w, i){
      var d = w.z + cam;                       /* distance: negative = ahead */
      var op = d > 270 ? 0 : d > -90 ? Math.max(0, 1 - (d + 90) / 360) : Math.max(0.05, Math.min(1, 1 + (d + 900) / 3900));
      w.el.style.opacity = op;
      w.el.style.visibility = op < 0.02 ? 'hidden' : '';
      w.el.style.pointerEvents = op > 0.4 ? '' : 'none';
    });
    count.textContent = String(Math.min(N, Math.max(1, Math.round(cam / GAP)))).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    wrap.classList.toggle('is-walking', cam > 60);
    if(Math.abs(target - cam) > 0.5 || Math.abs(mx - cx) > 0.002 || Math.abs(my - cy) > 0.002) raf = requestAnimationFrame(frame);
  }
  function kick(){ if(!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', kick, { passive:true });
  window.addEventListener('resize', function(){ measure(); kick(); });
  wrap.addEventListener('pointermove', function(e){
    if(e.pointerType !== 'mouse') return;
    mx = e.clientX / vw - 0.5; my = e.clientY / vh - 0.5; kick();
  });
  measure();
  cam = target = progress() * (DEPTH - GAP * 0.7);
  frame();
})();
