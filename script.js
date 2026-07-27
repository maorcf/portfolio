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
  window.addEventListener('scroll', function(){
    var pastThreshold = window.scrollY > 200;
    if(floatingNav) floatingNav.classList.toggle('visible', pastThreshold);
    if(backToTop) backToTop.classList.toggle('visible', pastThreshold);
  });
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
  window.addEventListener('resize', cacheFallDistances);

  chars.forEach(function(c){
    c.addEventListener('mouseenter', function(){
      var falling = c.classList.toggle('fallen');
      c.style.transform = falling ? 'translateY(' + c.dataset.fall + 'px)' : 'translateY(0px)';
    });
  });
})();
