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
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;';
  svg.innerHTML =
    '<defs>' +
      '<clipPath id="heroBlobClip"><path id="heroBlob" d=""/></clipPath>' +
      '<pattern id="heroBlobDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(20,20,20,0.16)"/></pattern>' +
    '</defs>' +
    '<g clip-path="url(#heroBlobClip)">' +
      '<rect id="heroBlobFill" width="100%" height="100%" fill="#C9C2ED"/>' +
      '<rect width="100%" height="100%" fill="url(#heroBlobDots)"/>' +
    '</g>';
  card.insertBefore(svg, card.firstChild);
  var blob = svg.querySelector('#heroBlob');

  var rect = card.getBoundingClientRect(), rectDirty = false;
  var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0;
  var inside = false, appear = 0, raf = 0, last = 0;
  var N = 9;

  function markDirty(){ rectDirty = true; if(!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty);

  card.addEventListener('pointerenter', function(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    rect = card.getBoundingClientRect();
    tx = e.clientX - rect.left; ty = e.clientY - rect.top;
    if(!inside && appear < 0.02){ x = tx; y = ty; }
    inside = true;
    if(!raf){ last = 0; raf = requestAnimationFrame(frame); }
  });
  card.addEventListener('pointermove', function(e){
    if(e.pointerType && e.pointerType !== 'mouse') return;
    tx = e.clientX - rect.left; ty = e.clientY - rect.top;
    inside = true;
    if(!raf){ last = 0; raf = requestAnimationFrame(frame); }
  });
  card.addEventListener('pointerleave', function(){ inside = false; });

  function pathFor(t, R, sx, angle){
    var pts = [], i, a, r, px, py, ca = Math.cos(angle), sa = Math.sin(angle), sy = 1 / (1 + (sx - 1) * 0.6);
    for(i = 0; i < N; i++){
      a = (i / N) * Math.PI * 2;
      r = R * (1 + 0.20 * Math.sin(t * 1.3 + i * 2.1) + 0.13 * Math.sin(t * 2.2 + i * 3.7) + 0.06 * Math.sin(t * 3.1 + i * 1.3));
      px = Math.cos(a) * r; py = Math.sin(a) * r;
      var rx = px * ca + py * sa, ry = -px * sa + py * ca;
      rx *= sx; ry *= sy;
      pts.push([x + rx * ca - ry * sa, y + rx * sa + ry * ca]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for(i = 0; i < N; i++){
      var p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
                 (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
                 p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }

  function frame(now){
    raf = 0;
    if(rectDirty){
      rect = card.getBoundingClientRect(); rectDirty = false;
      svg.setAttribute('viewBox', '0 0 ' + rect.width.toFixed(0) + ' ' + rect.height.toFixed(0));
    }
    var dt = last ? Math.min((now - last) / 16.67, 3) : 1; last = now;
    var px = x, py = y;
    var ease = 1 - Math.pow(1 - 0.16, dt);
    x += (tx - x) * ease; y += (ty - y) * ease;
    vx += ((x - px) / dt - vx) * 0.25; vy += ((y - py) / dt - vy) * 0.25;
    var speed = Math.sqrt(vx * vx + vy * vy);
    appear += ((inside ? 1 : 0) - appear) * (1 - Math.pow(1 - (inside ? 0.12 : 0.09), dt));
    if(!inside && appear < 0.01){
      appear = 0; blob.setAttribute('d', ''); last = 0; return;
    }
    var R = appear * (105 + Math.min(speed * 2.2, 80));
    var sx = 1 + Math.min(speed / 38, 0.7);
    blob.setAttribute('d', pathFor(now / 1000, R, sx, Math.atan2(vy, vx)));
    raf = requestAnimationFrame(frame);
  }
  svg.setAttribute('viewBox', '0 0 ' + rect.width.toFixed(0) + ' ' + rect.height.toFixed(0));
})();
