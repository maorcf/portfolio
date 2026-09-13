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
if(floatingNav || backToTop){
  var scrollTicking = false;
  var lastScrollY = window.scrollY;
  window.addEventListener('scroll', function(){
    if(scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function(){
      var currentY = window.scrollY;
      var pastThreshold = currentY > 200;
      var scrollingDown = currentY > lastScrollY;
      if(floatingNav) floatingNav.classList.toggle('visible', pastThreshold && scrollingDown);
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

  // Swipe left/right (touch)
  var touchStartX = 0, touchStartY = 0;
  content.addEventListener('touchstart', function(e){
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  content.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) lightboxNext(); else lightboxPrev();
    }
  }, { passive: true });

  // Horizontal scroll / trackpad swipe
  var wheelLocked = false;
  overlay.addEventListener('wheel', function(e){
    if(Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    e.preventDefault();
    if(wheelLocked) return;
    wheelLocked = true;
    if(e.deltaX > 0) lightboxNext(); else lightboxPrev();
    setTimeout(function(){ wheelLocked = false; }, 350);
  }, { passive: false });

  document.querySelectorAll('.thumb-grid .thumb, .crumple-flat').forEach(function(el){
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
})();

