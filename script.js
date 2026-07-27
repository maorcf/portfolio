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

var heroSection = document.querySelector('.hero');
var heroHeading = heroSection ? heroSection.querySelector('h1') : null;
if(heroSection && heroHeading){
  heroSection.addEventListener('mousemove', function(e){
    var rect = heroSection.getBoundingClientRect();
    var relX = (e.clientX - rect.left) / rect.width - 0.5;
    var relY = (e.clientY - rect.top) / rect.height - 0.5;
    var moveX = relX * 40;
    var moveY = relY * 20;
    heroHeading.style.transform = 'translate(' + moveX.toFixed(1) + 'px, ' + moveY.toFixed(1) + 'px)';
  });
  heroSection.addEventListener('mouseleave', function(){
    heroHeading.style.transform = 'translate(0px, 0px)';
  });
}
