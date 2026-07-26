function openMobileNav(){
  document.getElementById('mobileNav').classList.add('open');
  document.getElementById('mobileNavOverlay').classList.add('open');
}
function closeMobileNav(){
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
}

var floatingNav = document.querySelector('.floating-nav');
if(floatingNav){
  window.addEventListener('scroll', function(){
    if(window.scrollY > 200){
      floatingNav.classList.add('visible');
    } else {
      floatingNav.classList.remove('visible');
    }
  });
}
