(function(){
  var reveal = document.getElementById('heroReveal');
  if(!reveal) return;
  var cols = 8, rows = 5;
  var colors = ['c-ink', 'c-violet', 'c-lime'];
  var maxDelay = 0;
  for(var r = 0; r < rows; r++){
    for(var c = 0; c < cols; c++){
      var tile = document.createElement('div');
      var idx = r * cols + c;
      var color = (idx % 9 === 0) ? 'c-cream' : colors[(r + c) % colors.length];
      tile.className = 'tile ' + color;
      var delay = (r + c) * 35;
      tile.style.animationDelay = delay + 'ms';
      if(delay > maxDelay) maxDelay = delay;
      reveal.appendChild(tile);
    }
  }
  setTimeout(function(){
    reveal.style.display = 'none';
  }, maxDelay + 650);
})();

function openMobileNav(){
  document.getElementById('mobileNav').classList.add('open');
  document.getElementById('mobileNavOverlay').classList.add('open');
}
function closeMobileNav(){
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
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
  var heroCard = document.querySelector('.hero-card');
  if(!heroSection || !heading || !heroCard) return;

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

  var chars = Array.prototype.slice.call(heading.querySelectorAll('.char'));

  function cacheFallDistances(){
    var cardRect = heroCard.getBoundingClientRect();
    chars.forEach(function(c){
      var wasFallen = c.classList.contains('fallen');
      if(wasFallen) c.classList.remove('fallen');
      var r = c.getBoundingClientRect();
      var fall = (cardRect.bottom - 28) - r.bottom;
      c.dataset.fall = fall.toFixed(1);
      if(wasFallen) c.classList.add('fallen');
    });
  }
  cacheFallDistances();
  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheFallDistances, 250);
  });

  chars.forEach(function(c){
    c.addEventListener('mouseenter', function(){
      var falling = c.classList.toggle('fallen');
      c.style.transform = falling ? 'translateY(' + c.dataset.fall + 'px)' : 'translateY(0px)';
    });
  });
})();
