/* Homepage Playground strip as a 3D ring: the works orbit around a center,
   coming from behind, passing in front, and going back. Cards always face the
   viewer (no mirrored backs); depth comes from perspective, tilt and fade.
   Drag/swipe to spin; hover pauses on desktop. Falls back to the flat strip
   if anything is missing. */
(function(){
  var strip = document.querySelector('#playground-teaser .playground-strip');
  if(!strip) return;
  var track = strip.querySelector('.playground-strip-track');
  if(!track) return;
  var links = Array.prototype.slice.call(track.querySelectorAll(':scope > a'))
    .filter(function(a){ return a.getAttribute('aria-hidden') !== 'true'; });
  if(links.length < 4) return;

  // ?ring=inside brings back the inward-curving version
  var INSIDE = /[?&]ring=inside/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  strip.classList.add('is-ring');
  var items = links.map(function(a){
    var img = a.querySelector('img');
    return { el: a, img: img, ratio: 0.75, theta: 0, w: 0 };
  });

  var H = 0, R = 0, P = 1100, F = 385, RC = 1200, angle = 0;

  function readRatio(it){
    if(it.img && it.img.naturalWidth) it.ratio = it.img.naturalWidth / it.img.naturalHeight;
  }

  function layout(){
    var vw = window.innerWidth;
    H = vw < 640 ? 160 : 280;
    var gap = vw < 640 ? 8 : 12;
    var total = 0;
    items.forEach(function(it){
      readRatio(it);
      it.w = Math.round(H * it.ratio);
      it.el.style.width = it.w + 'px';
      it.el.style.height = H + 'px';
      it.el.style.marginLeft = (-it.w / 2) + 'px';
      it.el.style.marginTop = (-H / 2) + 'px';
      total += it.w + gap;
    });
    R = total / (2 * Math.PI);
    if(INSIDE){
      // viewer stands inside the ring: front cards sit back, cards at the screen edges curve toward you
      P = vw < 640 ? 800 : 1400;
      F = P * 0.3;
    } else {
      // viewer outside the ring: the center card is biggest, the sides turn away and shrink
      // outside of a cylinder: center card biggest, sides bend away
      P = vw < 640 ? 800 : 1400;
      F = 0;
      RC = vw < 640 ? 330 : 1100;
      P = vw < 640 ? 1100 : 2600;
    }
    track.style.perspective = P + 'px';
    // place each card at the middle of its slice, slices sized by card width
    var acc = 0;
    items.forEach(function(it){
      var slice = (it.w + gap) / total * Math.PI * 2;
      it.theta = acc + slice / 2;
      acc += slice;
    });
    strip.style.setProperty('--ring-h', H + 'px');
    render();
  }

  function render(){
    if(!INSIDE) return renderFlow();
    var zc = R - F;
    for(var i = 0; i < items.length; i++){
      var it = items[i];
      var t = Math.atan2(Math.sin(it.theta + angle), Math.cos(it.theta + angle));
      var s = Math.sin(t), c = Math.cos(t);
      var z = INSIDE ? zc - R * c : (R * c - R) * 0.75;
      var on = INSIDE ? (c > 0.05 && z < P - 30) : c > 0.02;
      if(!on){
        if(it.on !== false){ it.el.style.visibility = 'hidden'; it.el.tabIndex = -1; it.on = false; }
        continue;
      }
      if(it.on !== true){ it.el.style.visibility = ''; it.el.tabIndex = 0; it.on = true; }
      it.el.style.transform = 'translate3d(' + (R * s * (INSIDE ? 1 : 1.06)).toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + ((INSIDE ? -t : t) * 180 / Math.PI).toFixed(2) + 'deg)';
      it.el.style.zIndex = String(Math.round(1000 + z));
    }
  }

  function renderFlow(){
    // outside of a cylinder: the center card is closest and biggest,
    // the row bends away and shrinks toward the screen sides
    for(var i = 0; i < items.length; i++){
      var it = items[i];
      var t = Math.atan2(Math.sin(it.theta + angle), Math.cos(it.theta + angle));
      var u = t * R;                   // signed distance from the center along the row
      var tc = u / RC;                 // angle on the (tighter) visible cylinder
      var on = Math.abs(tc) < 1.5;
      if(!on){
        if(it.on !== false){ it.el.style.visibility = 'hidden'; it.el.tabIndex = -1; it.on = false; }
        continue;
      }
      if(it.on !== true){ it.el.style.visibility = ''; it.el.tabIndex = 0; it.on = true; }
      var z = RC * (Math.cos(tc) - 1);
      it.el.style.transform = 'translate3d(' + (RC * Math.sin(tc)).toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + (tc * 180 / Math.PI).toFixed(2) + 'deg)';
      it.el.style.zIndex = String(Math.round(1000 + z));
    }
  }

  // motion
  var BASE = reduce ? 0 : -0.06;   // rad per second (one turn ≈ 105s)
  var speed = BASE, target = BASE, vel = 0;
  var hovering = false, dragging = false, visible = true, last = 0, raf = 0;

  function frame(now){
    raf = 0;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    if(!dragging){
      target = hovering ? 0 : BASE;
      speed += (target - speed) * Math.min(1, dt * 3);
      vel *= Math.pow(0.04, dt);           // fling decays
      if(Math.abs(vel) < 0.002) vel = 0;
      angle += (speed + vel) * dt;
      render();
    }
    if(visible && (speed !== 0 || vel !== 0 || dragging || BASE !== 0 || hovering)) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick(){ if(!raf && visible){ last = 0; raf = requestAnimationFrame(frame); } }

  if(canHover){
    strip.addEventListener('mouseenter', function(){ hovering = true; kick(); });
    strip.addEventListener('mouseleave', function(){ hovering = false; kick(); });
  }

  // drag / swipe
  var startX = 0, startY = 0, lastX = 0, lastT = 0, moved = false, pid = null, axis = '';
  strip.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    pid = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now();
    moved = false; axis = ''; vel = 0;
  });
  window.addEventListener('pointermove', function(e){
    if(pid === null || e.pointerId !== pid) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if(!axis){
      if(Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if(axis === 'y'){ pid = null; return; }   // let the page scroll
      dragging = true; moved = true; strip.classList.add('is-dragging');
      try{ strip.setPointerCapture(pid); }catch(_){}
    }
    var now = performance.now();
    var step = (e.clientX - lastX) / R;
    angle += step;
    var dtm = Math.max(now - lastT, 8);
    vel = step / (dtm / 1000);
    lastX = e.clientX; lastT = now;
    render();
  });
  function end(e){
    if(pid === null || (e && e.pointerId !== pid)) return;
    pid = null;
    if(dragging){
      dragging = false; strip.classList.remove('is-dragging');
      if(performance.now() - lastT > 80) vel = 0;
      vel = Math.max(-3, Math.min(3, vel));
      kick();
    }
  }
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  // a drag must not open the project underneath
  strip.addEventListener('click', function(e){
    if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
  strip.addEventListener('dragstart', function(e){ e.preventDefault(); });

  // keyboard: focusing a card brings it to the front
  items.forEach(function(it){
    it.el.addEventListener('focus', function(){
      var a = -it.theta;
      var d = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
      angle += d; render();
    });
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if(visible) kick();
    }, { rootMargin: '100px' }).observe(strip);
  }

  items.forEach(function(it){
    if(it.img && !it.img.complete) it.img.addEventListener('load', layout, { once: true });
  });
  var rt;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(layout, 120); });
  layout();
  kick();
})();
