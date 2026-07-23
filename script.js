function openMobileNav(){
  document.getElementById('mobileNav').classList.add('open');
  document.getElementById('mobileNavOverlay').classList.add('open');
}
function closeMobileNav(){
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileNavOverlay').classList.remove('open');
}

function updateHeaderHeightVar(){
  var header = document.querySelector('header');
  if(header){
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
}
updateHeaderHeightVar();
window.addEventListener('resize', updateHeaderHeightVar);
