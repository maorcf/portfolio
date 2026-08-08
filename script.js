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
  var canvas = document.getElementById('heroParticles');
  var heroCard = document.querySelector('.hero-card');
  if(!canvas || !heroCard) return;

  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var particles = [];
  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function rand(min, max){ return min + Math.random() * (max - min); }

  function buildParticles(){
    var rect = heroCard.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cx = w / 2, cy = h / 2;
    var maxDist = Math.sqrt(cx * cx + cy * cy);
    var count = Math.round((w * h) / 4200);
    particles = [];
    for(var i = 0; i < count; i++){
      var x = rand(0, w), y = rand(0, h);
      var dx = x - cx, dy = y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      var keepChance = Math.pow(dist, 2.2);
      if(Math.random() > keepChance) continue;
      particles.push({
        x: x, y: y,
        baseX: x, baseY: y,
        r: rand(1, 2.6),
        alpha: rand(0.15, 0.55),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.25, 0.6),
        amp: rand(6, 18)
      });
    }
  }

  function draw(t){
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#5B4CE0';
    for(var i = 0; i < particles.length; i++){
      var p = particles[i];
      var x = p.baseX + Math.sin(t * 0.0006 * p.speed + p.phase) * p.amp;
      var y = p.baseY + Math.cos(t * 0.0005 * p.speed + p.phase) * p.amp;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  buildParticles();

  if(reduceMotion){
    draw(0);
  } else {
    (function loop(t){
      draw(t);
      requestAnimationFrame(loop);
    })(0);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      buildParticles();
      if(reduceMotion) draw(0);
    }, 250);
  });
})();

