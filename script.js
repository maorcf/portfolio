(function(){
  var IDLE_MS = 45000;
  var saver = document.createElement('div');
  saver.className = 'screensaver';
  saver.setAttribute('aria-hidden', 'true');
  saver.innerHTML =
    '<a href="index.html" class="logo-mark">M</a>' +
    '<h2>Let\'s talk.</h2>' +
    '<p>maorcohenfalah.com</p>';
  document.body.appendChild(saver);

  var idleTimer;
  function show(){ saver.classList.add('active'); }
  function hide(){ saver.classList.remove('active'); }
  function resetIdle(){
    if(saver.classList.contains('active')) hide();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(show, IDLE_MS);
  }

  ['mousemove','mousedown','keydown','touchstart','scroll','wheel'].forEach(function(evt){
    document.addEventListener(evt, resetIdle, { passive:true });
  });
  saver.addEventListener('click', function(e){
    if(e.target === saver) resetIdle();
  });

  resetIdle();

  var autoVideos = document.querySelectorAll('video[autoplay]');
  if(autoVideos.length && 'IntersectionObserver' in window){
    var videoObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting) entry.target.play().catch(function(){});
        else entry.target.pause();
      });
    }, { rootMargin: '200px' });
    autoVideos.forEach(function(v){ videoObserver.observe(v); });
  }
})();

var lastMenuToggle = null;
function openMobileNav(){
  var nav = document.getElementById('mobileNav');
  lastMenuToggle = document.activeElement;
  nav.classList.add('open');
  document.getElementById('mobileNavOverlay').classList.add('open');
  nav.removeAttribute('inert');
  nav.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('.menu-toggle').forEach(function(btn){
    btn.setAttribute('aria-expanded', 'true');
  });
  var closeBtn = nav.querySelector('.mobile-nav-close');
  if(closeBtn) closeBtn.focus();
  document.addEventListener('keydown', onMobileNavKeydown);
}
function closeMobileNav(){
  var nav = document.getElementById('mobileNav');
  nav.classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
  nav.setAttribute('inert', '');
  nav.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.menu-toggle').forEach(function(btn){
    btn.setAttribute('aria-expanded', 'false');
  });
  document.removeEventListener('keydown', onMobileNavKeydown);
  if(lastMenuToggle) lastMenuToggle.focus();
}
function onMobileNavKeydown(e){
  if(e.key === 'Escape') closeMobileNav();
}

var floatingNav = document.querySelector('.floating-nav');
var backToTop = document.querySelector('.back-to-top');
var pageCover = document.querySelector('.page-cover');
if(floatingNav || backToTop){
  var scrollTicking = false;
  var lastScrollY = window.scrollY;
  window.addEventListener('scroll', function(){
    if(scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function(){
      var currentY = window.scrollY;
      var pastThreshold = currentY > 200;
      var navThreshold = pageCover ? pageCover.offsetTop + 120 : 200;
      var scrollingDown = currentY > lastScrollY;
      if(floatingNav) floatingNav.classList.toggle('visible', currentY > navThreshold && !scrollingDown);
      if(backToTop) backToTop.classList.toggle('visible', pastThreshold);
      lastScrollY = currentY;
      scrollTicking = false;
    });
  }, { passive: true });
}

(function(){
  var heroSection = document.querySelector('.hero');
  var heading = heroSection ? heroSection.querySelector('h1') : null;
  if(!heroSection || !heading || heroSection.classList.contains('hero-ethan')) return;

  function wrapChars(el){
    Array.prototype.forEach.call(Array.prototype.slice.call(el.childNodes), function(node){
      if(node.nodeType === 3){
        var frag = document.createDocumentFragment();
        node.textContent.split('').forEach(function(ch){
          if(ch === ' '){
            frag.appendChild(document.createTextNode(' '));
          } else {
            var span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if(node.nodeType === 1 && node.tagName !== 'BR' && !node.classList.contains('icon-chip')){
        wrapChars(node);
      }
    });
  }
  wrapChars(heading);
})();

(function(){
  var overlay = document.getElementById('lightbox');
  if(!overlay) return;
  var content = overlay.querySelector('.lightbox-content');
  var lastFocused = null;
  var gallery = [];
  var galleryIndex = 0;

  function showMedia(el){
    content.innerHTML = '';
    if(el.tagName === 'VIDEO'){
      var v = document.createElement('video');
      v.src = el.currentSrc || el.src;
      v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.controls = true;
      content.appendChild(v);
    } else {
      var img = document.createElement('img');
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      content.appendChild(img);
    }
  }
  function openLightbox(el, galleryEls){
    gallery = galleryEls && galleryEls.length ? galleryEls : [el];
    galleryIndex = gallery.indexOf(el);
    if(galleryIndex < 0) galleryIndex = 0;
    showMedia(gallery[galleryIndex]);
    overlay.classList.toggle('has-gallery', gallery.length > 1);
    lastFocused = document.activeElement;
    overlay.classList.add('open');
    overlay.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onLightboxKeydown);
  }
  function closeLightbox(){
    overlay.classList.remove('open');
    overlay.setAttribute('inert', '');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onLightboxKeydown);
    setTimeout(function(){ content.innerHTML = ''; }, 250);
    if(lastFocused) lastFocused.focus();
  }
  function lightboxPrev(){
    if(gallery.length < 2) return;
    galleryIndex = (galleryIndex - 1 + gallery.length) % gallery.length;
    showMedia(gallery[galleryIndex]);
  }
  function lightboxNext(){
    if(gallery.length < 2) return;
    galleryIndex = (galleryIndex + 1) % gallery.length;
    showMedia(gallery[galleryIndex]);
  }
  function onLightboxKeydown(e){
    if(e.key === 'Escape') closeLightbox();
    else if(e.key === 'ArrowLeft') lightboxPrev();
    else if(e.key === 'ArrowRight') lightboxNext();
  }
  window.closeLightbox = closeLightbox;
  window.lightboxPrev = lightboxPrev;
  window.lightboxNext = lightboxNext;

  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closeLightbox();
  });

  // Swipe left/right (touch) — magazine galleries only
  var touchStartX = 0, touchStartY = 0;
  content.addEventListener('touchstart', function(e){
    if(gallery.length < 2) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  content.addEventListener('touchend', function(e){
    if(gallery.length < 2) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) lightboxNext(); else lightboxPrev();
    }
  }, { passive: true });

  // Horizontal scroll / trackpad swipe — magazine galleries only
  var wheelLocked = false;
  overlay.addEventListener('wheel', function(e){
    if(gallery.length < 2) return;
    if(Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    e.preventDefault();
    if(wheelLocked) return;
    wheelLocked = true;
    if(e.deltaX > 0) lightboxNext(); else lightboxPrev();
    setTimeout(function(){ wheelLocked = false; }, 350);
  }, { passive: false });

  document.querySelectorAll('.thumb-grid .thumb').forEach(function(el){
    el.addEventListener('click', function(){
      var media = el.tagName === 'IMG' || el.tagName === 'VIDEO' ? el : el.querySelector('img, video');
      if(media) openLightbox(media, [media]);
    });
  });

  document.querySelectorAll('.mag-carousel').forEach(function(carousel){
    var allImgs = carousel.querySelectorAll('img');
    var uniqueImgs = Array.prototype.filter.call(allImgs, function(img){
      return img.getAttribute('aria-hidden') !== 'true';
    });
    Array.prototype.forEach.call(allImgs, function(img){
      img.addEventListener('click', function(){
        var match = uniqueImgs.filter(function(i){ return i.src === img.src; })[0];
        openLightbox(match || uniqueImgs[0], uniqueImgs);
      });
    });
  });

  document.querySelectorAll('.side-gallery').forEach(function(gallery){
    var imgs = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    imgs.forEach(function(img){
      img.addEventListener('click', function(){
        openLightbox(img, imgs);
      });
    });
  });

  document.querySelectorAll('.playground-strip-track').forEach(function(track){
    var allImgs = Array.prototype.slice.call(track.querySelectorAll(':scope > img'));
    var uniqueImgs = allImgs.filter(function(img){ return img.getAttribute('aria-hidden') !== 'true'; });
    if(!uniqueImgs.length) return;
    allImgs.forEach(function(img){
      img.addEventListener('click', function(){
        var match = uniqueImgs.filter(function(i){ return i.src === img.src; })[0];
        openLightbox(match || uniqueImgs[0], uniqueImgs);
      });
    });
  });
})();


(function(){
  var card = document.querySelector('.hero-frame-outer .hero-card');
  if(!card || !document.querySelector('.hero') || document.querySelector('.hero-ethan') || card.querySelector('.liquid-canvas')) return; // the liquid headline replaces the dot trail
  if(window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var NS = 'http://www.w3.org/2000/svg';
  var POOL = 60, N = 8, SPACING = 13;
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  svg.innerHTML =
    '<defs>' +
      '<mask id="heroTrailMask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="6000" height="6000"><g id="heroTrailPaths"></g></mask>' +
      '<pattern id="heroTrailDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(20,20,20,0.16)"/></pattern>' +
    '</defs>' +
    '<g mask="url(#heroTrailMask)">' +
      '<rect width="100%" height="100%" fill="#C9C2ED"/>' +
      '<rect width="100%" height="100%" fill="url(#heroTrailDots)"/>' +
    '</g>';
  card.insertBefore(svg, card.firstChild);
  var group = svg.querySelector('#heroTrailPaths');

  var parts = [], i;
  for(i = 0; i < POOL; i++){
    var el = document.createElementNS(NS, 'path');
    el.setAttribute('fill', '#fff');
    el.setAttribute('opacity', '0');
    group.appendChild(el);
    parts.push({ el: el, alive: false, x: 0, y: 0, r: 0, rot: 0, born: 0, life: 0, ph: 0, wob: 0 });
  }
  var next = 0;

  var rect = card.getBoundingClientRect(), rectDirty = false;
  var tx = 0, ty = 0, hx = 0, hy = 0, sx = 0, sy = 0;
  var haveHead = false, moving = false, lastMove = 0, raf = 0;

  function markDirty(){ rectDirty = true; if(!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty);

  function setTarget(e){
    tx = e.clientX - rect.left; ty = e.clientY - rect.top;
    lastMove = performance.now(); moving = true;
    if(!haveHead){ hx = sx = tx; hy = sy = ty; haveHead = true; }
    if(!raf) raf = requestAnimationFrame(frame);
  }
  card.addEventListener('pointerenter', function(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    rect = card.getBoundingClientRect(); haveHead = false; setTarget(e);
  });
  card.addEventListener('pointermove', function(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    setTarget(e);
  });
  card.addEventListener('pointerleave', function(){ moving = false; haveHead = false; });

  function spawn(x, y, now){
    var p = parts[next]; next = (next + 1) % POOL;
    p.alive = true; p.x = x; p.y = y; p.born = now;
    p.r = 35 + Math.random() * 15;
    p.rot = Math.random() * Math.PI * 2;
    p.life = 1500 + Math.random() * 1500;
    p.ph = Math.random() * 6.28; p.wob = 0.8 + Math.random() * 1.2;
  }

  function draw(p, now){
    var age = now - p.born;
    if(age >= p.life){ p.alive = false; p.el.setAttribute('opacity', '0'); return; }
    var k = age / p.life;
    var fadeIn = Math.min(age / 120, 1);
    var alpha = fadeIn * Math.pow(1 - k, 1.3);
    var scale = (0.55 + 0.45 * fadeIn) * (1 - 0.25 * k);
    var t = age / 1000, pts = [], a, r, c = Math.cos(p.rot), sn = Math.sin(p.rot), j;
    for(j = 0; j < N; j++){
      a = (j / N) * 6.2832 + p.rot;
      r = p.r * scale * (1 + 0.16 * Math.sin(t * p.wob * 2 + j * 2.1 + p.ph) + 0.09 * Math.sin(t * p.wob * 3.3 + j * 3.7));
      pts.push([p.x + Math.cos(a) * r * 1.08, p.y + Math.sin(a) * r * 0.92]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1), p0, p1, p2, p3;
    for(j = 0; j < N; j++){
      p0 = pts[(j - 1 + N) % N]; p1 = pts[j]; p2 = pts[(j + 1) % N]; p3 = pts[(j + 2) % N];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
                 (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
                 p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    p.el.setAttribute('d', d + 'Z');
    p.el.setAttribute('opacity', alpha.toFixed(3));
  }

  function frame(now){
    raf = 0;
    if(rectDirty){ rect = card.getBoundingClientRect(); rectDirty = false; }
    if(moving && now - lastMove > 90) moving = false;
    if(haveHead && moving){
      hx += (tx - hx) * 0.35; hy += (ty - hy) * 0.35;
      var dx = hx - sx, dy = hy - sy, dist = Math.sqrt(dx * dx + dy * dy);
      if(dist >= SPACING){
        var steps = Math.min(Math.floor(dist / SPACING), 10), s;
        for(s = 1; s <= steps; s++){
          var f = (s * SPACING) / dist;
          spawn(sx + dx * f + (Math.random() - 0.5) * 6, sy + dy * f + (Math.random() - 0.5) * 6, now);
        }
        sx += dx * (steps * SPACING) / dist; sy += dy * (steps * SPACING) / dist;
      }
    }
    var any = false;
    for(i = 0; i < POOL; i++){
      if(parts[i].alive){ draw(parts[i], now); any = parts[i].alive || any; }
    }
    if(any || moving) raf = requestAnimationFrame(frame);
  }
})();

(function(){
  var hero = document.getElementById('csHero');
  if(hero){
    var t = false;
    var fit = function(){ var top = hero.getBoundingClientRect().top + window.scrollY; var hh = Math.max(window.innerHeight - top, 520); hero.style.height = hh + 'px'; hero.style.setProperty('--hh', hh + 'px'); };
    fit(); window.addEventListener('resize', fit); window.addEventListener('load', fit);
    var upd = function(){
      var p = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.75), 0), 1);
      hero.style.setProperty('--p', p.toFixed(3)); t = false;
    };
    window.addEventListener('scroll', function(){ if(!t){ t = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
  var items = document.querySelectorAll('.cs-reveal');
  if(items.length){
    if(!('IntersectionObserver' in window)){ items.forEach(function(e){ e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function(e){ io.observe(e); });
  }
})();

// Ethan theme motion: scroll reveals, page transitions, cursor dot, portrait flicker, footer clock
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var clocks = document.querySelectorAll('.footer-clock');
  if(clocks.length){
    var fmt = new Intl.DateTimeFormat('en-US', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Jerusalem' });
    var tick = function(){ var s = fmt.format(new Date()); clocks.forEach(function(c){ c.textContent = s; }); };
    tick(); setInterval(tick, 15000);
  }

  if(reduce){ root.classList.remove('pt-enter'); return; }

  // page transition: the new page opens from the center, the old one closes into it
  try { sessionStorage.removeItem('pt'); } catch(e){}
  if(root.classList.contains('pt-enter')) setTimeout(function(){ root.classList.remove('pt-enter'); }, 700);
  window.addEventListener('pageshow', function(e){ if(e.persisted) root.classList.remove('pt-leave', 'pt-enter'); });
  document.addEventListener('click', function(e){
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if(!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if(url.origin !== location.origin || /\.(pdf|jpe?g|png|mp4)$/i.test(url.pathname)) return;
    if(url.pathname === location.pathname && url.search === location.search) return; // same-page anchors scroll normally
    e.preventDefault();
    try { sessionStorage.setItem('pt', '1'); } catch(err){}
    root.classList.add('pt-leave');
    setTimeout(function(){ location.href = url.href; }, 430);
  });

  // fade-up reveals as sections scroll into view
  var sel = '.section-head-center, #work .project, .playground-strip, .footer-card, .case-section, .case-row, .more-work-head, .more-work-card, #playground > .project, .about-card, #hobbies > *';
  var els = Array.prototype.filter.call(document.querySelectorAll(sel), function(el){ return !el.classList.contains('cs-reveal'); });
  if(els.length && 'IntersectionObserver' in window){
    els.forEach(function(el){ if(el.getBoundingClientRect().top > window.innerHeight * 0.9) el.classList.add('reveal'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        el.classList.add('in');
        setTimeout(function(){ el.classList.remove('reveal', 'in'); }, 1100); // hand transforms back to hover styles
      });
    }, { rootMargin:'0px 0px -12% 0px', threshold:0 });
    els.forEach(function(el){ if(el.classList.contains('reveal')) io.observe(el); });
  }

  // work card images open up through a growing, wobbling blob (the template's "Image Blob Reveal":
  // starts at a quarter size in the center, 3s, ease-out quart, once 50% of the image is on screen)
  var blobThumbs = document.querySelectorAll('.project-grid .project-cover .thumb');
  if(blobThumbs.length && window.CSS && CSS.supports('clip-path', 'path("M0 0Z")')){
    var BLOB = [[0,-.94],[.34,-1.07],[.78,-.82],[.9,-.46],[1.08,-.1],[.88,.38],[.7,.64],[.44,1.02],[.06,.92],[-.29,.91],[-.71,.93],[-1.03,.58],[-1.02,.18],[-1.05,-.2],[-.75,-.48],[-.58,-.7],[-.4,-.96],[-.13,-.93],[0,-.94]];
    function blobFrame(el, D){
      var w = el.offsetWidth, h = el.offsetHeight;
      if(D >= .999 || !w){ el.style.clipPath = ''; return; }
      var L = Math.max(40, Math.min(w, h) * .26), cx = w / 2, cy = h / 2;
      var z = .25, te = Math.hypot(cx, cy) / L * 1.55, B = z + (te - z) * D, V = Math.sin(D * Math.PI);
      var sx = B * (1 + V * .06) * L, sy = B * (1 - V * .035) * L, a = (-8 + D * 13) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      var p = BLOB.map(function(q){ var x = q[0] * sx, y = q[1] * sy; return (cx + x * ca - y * sa).toFixed(1) + ' ' + (cy + x * sa + y * ca).toFixed(1); });
      var d = 'M ' + p[0];
      for(var i = 1; i < p.length; i += 3) d += ' C ' + p[i] + ', ' + p[i + 1] + ', ' + p[i + 2];
      el.style.clipPath = 'path("' + d + ' Z")';
    }
    var blobIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        blobIO.unobserve(en.target);
        var el = en.target.querySelector('.thumb'), t0 = performance.now();
        (function step(now){
          var o = Math.min(1, (now - t0) / 3000);
          blobFrame(el, 1 - Math.pow(1 - o, 4));
          if(o < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .5 });
    blobThumbs.forEach(function(el){ blobFrame(el, 0); blobIO.observe(el.parentNode); });  // observe the parent: the clip itself shrinks the visible area
  }

  // moving the mouse over the hero leaves a trail of project covers (same recipe as the Framer "Cursor Image Trail":
  // a cover drops at the cursor every ~100px, springs in from half size, stays .5s, then fades out on its own)
  var heroTrail = document.querySelector('.hero-ethan');
  if(heroTrail && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    var covers = ['work-chido-cover.jpg?v=2', 'work-pazi-mockup2.jpg', 'work-filmroll-mockup2.jpg', 'work-austrip-mockup2.jpg', 'work-fireline-cover.jpg', 'work-woom-cover.jpg', 'work-mimi-card.jpg'];
    covers.forEach(function(src){ new Image().src = src; });
    // overdamped springs sampled into linear() easings: in = stiffness 500 / damping 60, out = 600 / 60
    function springEase(k, c){
      var d = Math.sqrt(c * c - 4 * k), r1 = (c - d) / 2, r2 = (c + d) / 2, T = 4.6 / r1, pts = [];
      for(var i = 0; i <= 40; i++){
        var t = T * i / 40;
        pts.push((1 - (r2 * Math.exp(-r1 * t) - r1 * Math.exp(-r2 * t)) / (r2 - r1)).toFixed(4));
      }
      pts[40] = '1';
      return { ms: Math.round(T * 1000), ease: 'linear(' + pts.join(',') + ')' };
    }
    var hasLinear = window.CSS && CSS.supports('animation-timing-function', 'linear(0, 1)');
    var IN = springEase(500, 60), OUT = springEase(600, 60);
    if(!hasLinear){ IN.ease = 'cubic-bezier(.2,.8,.2,1)'; OUT.ease = 'cubic-bezier(.3,.7,.3,1)'; }
    var ci = 0, lx = null, ly = null, GAP = 102;
    function spawn(x, y){
      var img = document.createElement('img');
      img.className = 'hero-trail'; img.alt = ''; img.setAttribute('aria-hidden', 'true');
      img.src = covers[ci]; ci = (ci + 1) % covers.length;
      img.style.left = x + 'px'; img.style.top = y + 'px';
      heroTrail.appendChild(img);
      img.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }],
        { duration: IN.ms, easing: IN.ease, fill: 'forwards' });
      setTimeout(function(){
        var cs = getComputedStyle(img);
        img.animate([{ opacity: cs.opacity, transform: cs.transform }, { opacity: 0, transform: cs.transform }],
          { duration: OUT.ms, easing: OUT.ease, fill: 'forwards' }).onfinish = function(){ img.remove(); };
      }, 500);
    }
    heroTrail.addEventListener('mousemove', function(e){
      var r = heroTrail.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if(lx !== null && Math.hypot(x - lx, y - ly) <= GAP) return;
      spawn(x, y); lx = x; ly = y;
    });
    heroTrail.addEventListener('mouseleave', function(){ lx = ly = null; });
  }

  // red dot that trails the mouse
  if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var dot = document.createElement('div');
  dot.className = 'cursor-dot'; dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  var mx = 0, my = 0, x = 0, y = 0, raf = 0, started = false;
  function loop(){
    x += (mx - x) * 0.2; y += (my - y) * 0.2;
    dot.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    raf = (Math.abs(mx - x) > 0.2 || Math.abs(my - y) > 0.2) ? requestAnimationFrame(loop) : 0;
  }
  document.addEventListener('pointermove', function(e){
    if(e.pointerType !== 'mouse') return;
    mx = e.clientX + 18; my = e.clientY + 24;
    if(!started){ x = mx; y = my; started = true; }
    dot.classList.add('on');
    dot.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button')));
    if(!raf) raf = requestAnimationFrame(loop);
  }, { passive:true });
  document.documentElement.addEventListener('mouseleave', function(){ dot.classList.remove('on'); });
})();

// case study pages: a sticky bar with the project name and its sections, like a table of contents
(function(){
  var main = document.querySelector('main.cs2'), toc = main && main.querySelector('.cs2-toc'), hero = main && main.querySelector('.cs2-hero');
  if(!toc || !hero) return;
  document.documentElement.classList.add('cs2-page');
  var bar = document.createElement('nav');
  bar.className = 'cs2-bar'; bar.setAttribute('aria-label', 'Case study sections');
  bar.innerHTML = '<div class="cs2-bar-in"><a href="index.html#work" class="cs2-bar-name"><span aria-hidden="true">←</span> ' + main.querySelector('h1').textContent + '</a><div class="cs2-bar-links"></div></div>';
  var links = bar.querySelector('.cs2-bar-links');
  toc.querySelectorAll('a').forEach(function(a){ links.appendChild(a.cloneNode(true)); });
  document.body.appendChild(bar);
  var shown = false;
  function onScroll(){
    var s = hero.getBoundingClientRect().bottom < 0;
    if(s !== shown){ shown = s; bar.classList.toggle('on', s); }
  }
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
  // lazy images above the target can load mid-scroll and push it down, so re-aim a couple of times
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('.cs2-bar-links a, .cs2-toc a');
    if(!a) return;
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if(!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior:'smooth' });
    history.replaceState(null, '', '#' + t.id);
    [700, 1400, 2200].forEach(function(ms){ setTimeout(function(){ if(Math.abs(t.getBoundingClientRect().top - 56) > 6) t.scrollIntoView({ behavior:'smooth' }); }, ms); });
  });
  // highlight the section currently on screen
  var map = {};
  links.querySelectorAll('a').forEach(function(a){ var t = document.getElementById(a.getAttribute('href').slice(1)); if(t) map[t.id] = a; });
  if(!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting || !map[e.target.id]) return;
      links.querySelectorAll('a.active').forEach(function(x){ x.classList.remove('active'); });
      var a = map[e.target.id]; a.classList.add('active');
      if(links.scrollWidth > links.clientWidth) links.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(map).forEach(function(id){ io.observe(document.getElementById(id)); });
})();
