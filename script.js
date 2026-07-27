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

  var chars = Array.prototype.slice.call(heading.querySelectorAll('.char'));
  var baseRects = [];

  function cacheRects(){
    baseRects = chars.map(function(c){
      var r = c.getBoundingClientRect();
      return { el: c, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
  }
  cacheRects();
  window.addEventListener('resize', cacheRects);

  var radius = 70;
  var maxPush = 34;

  heroSection.addEventListener('mousemove', function(e){
    baseRects.forEach(function(item){
      var dx = item.cx - e.clientX;
      var dy = item.cy - e.clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if(dist < radius){
        var factor = (radius - dist) / radius;
        var push = maxPush * factor;
        var angle = Math.atan2(dy, dx);
        var mx = Math.cos(angle) * push;
        var my = Math.sin(angle) * push;
        item.el.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px)';
      } else {
        item.el.style.transform = 'translate(0px,0px)';
      }
    });
  });
  heroSection.addEventListener('mouseleave', function(){
    baseRects.forEach(function(item){ item.el.style.transform = 'translate(0px,0px)'; });
  });
})();
