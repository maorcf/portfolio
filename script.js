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
