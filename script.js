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
      if(floatingNav) floatingNav.classList.toggle('visible', currentY > navThreshold && scrollingDown);
      if(backToTop) backToTop.classList.toggle('visible', pastThreshold);
      lastScrollY = currentY;
      scrollTicking = false;
    });
  }, { passive: true });
}

(function(){
  var heroSection = document.querySelector('.hero');
  var heading = heroSection ? heroSection.querySelector('h1') : null;
  if(!heroSection || !heading) return;

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
  var hero = document.querySelector('.hero-frame-outer:not(.page-frame)');
  var header = hero && hero.querySelector('header');
  if(!header) return;
  function setStick(){
    var offset = header.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
    hero.style.top = -(Math.round(offset) - 2) + 'px';
  }
  var lastW = window.innerWidth;
  window.addEventListener('resize', function(){
    if(window.innerWidth !== lastW){ lastW = window.innerWidth; setStick(); }
  });
  window.addEventListener('load', setStick);
  setStick();
})();

(function(){
  var card = document.querySelector('.hero-frame-outer .hero-card');
  if(!card || !document.querySelector('.hero')) return;
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
