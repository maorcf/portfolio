/* Record crate in the home hero: flip through sleeves, click one to pull the vinyl out and spin it.
   To add a song, add a line to SONGS:
     title, artist  - shown on the sleeve label and under the crate
     cover          - square image path (e.g. 'records/song.jpg'); without one a colored sleeve is drawn
     spotify        - Spotify track id (the part after /track/ in a share link); plays in a small player
     color          - sleeve color when there is no cover */
(function(){
  var SONGS = [
    { title:'Song title', artist:'Artist', color:'#D3F26A' },
    { title:'Song title', artist:'Artist', color:'#F4C93B' },
    { title:'Song title', artist:'Artist', color:'#F2977B' },
    { title:'Low', artist:'Lenny Kravitz', cover:'https://i.scdn.co/image/ab67616d0000b2738931c3b826502240726251a7', spotify:'3zcccQe4KhGXRqRBUwGU3G', color:'#2a2a2a' },
    { title:'Crazy', artist:'Seal', cover:'https://i.scdn.co/image/ab67616d0000b273d214956335b4cfab9e302c81', spotify:'2KP6bTmxOSEVMXAnbapkpa', color:'#2a2a2a' },
    { title:'Song title', artist:'Artist', color:'#C9C2ED' },
    { title:'Song title', artist:'Artist', color:'#3C8A5A' },
    { title:'Song title', artist:'Artist', color:'#E8E2D0' }
  ];

  var root = document.querySelector('.record-crate');
  if(!root || !SONGS.length) return;
  var stage = root.querySelector('.rc-stage');
  var now = root.querySelector('.rc-now');
  var player = root.querySelector('.rc-player');
  var active = Math.floor((SONGS.length - 1) / 2), playing = -1, items = [];

  function isDark(hex){
    var h = hex.replace('#',''); if(h.length !== 6) return false;
    var r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
    return (r*299 + g*587 + b*114) / 1000 < 140;
  }

  SONGS.forEach(function(s, i){
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'rc-record';
    el.setAttribute('aria-label', s.title + ' by ' + s.artist);
    var edge = s.edge || s.color || '#1d1d1d';
    var sleeve = s.cover
      ? '<img src="' + s.cover + '" alt="" draggable="false">'
      : '<span class="rc-art' + (isDark(s.color || '#5B4CE0') ? ' is-dark' : '') + '" style="background:' + (s.color || '#5B4CE0') + '">' +
          '<span class="rc-art-no">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="rc-art-title">' + s.title + '</span><span class="rc-art-artist">' + s.artist + '</span></span>';
    el.innerHTML = '<span class="rc-vinyl" aria-hidden="true"><span class="rc-label" style="background:' + (s.color || '#5B4CE0') + '"></span></span>' +
                   '<span class="rc-sleeve">' + sleeve + '</span>' +
                   '<span class="rc-side rc-side-r" style="background-color:' + edge + '"></span><span class="rc-side rc-side-l" style="background-color:' + edge + '"></span>' +
                   '<span class="rc-side rc-side-t" style="background-color:' + edge + '"></span><span class="rc-back" style="background-color:' + edge + '"></span>';
    el.addEventListener('click', function(){
      if(dragged) return;
      if(i !== active){ go(i); return; }
      toggle(i);
    });
    stage.appendChild(el);
    items.push(el);
  });

  function size(){ return items[0].offsetWidth || 160; }
  /* records shown on each side of the front one, so the fan fits the width */
  function perSide(open){ var S = size(); return Math.max(1, Math.floor((root.offsetWidth / 2 - S * 0.9 - open) / (S * 0.34)) + 1); }

  function layout(){
    var S = size(), step = S * 0.34, open = playing === active ? S * 0.55 : 0, shift = -open / 2;
    var nR = perSide(open), nL = perSide(0);
    items.forEach(function(el, i){
      var d = i - active, x, ry, z, op = 1;
      if(d === 0){ x = 0; ry = 0; z = 50; }
      else if(d < 0){ x = -(S * 0.9 + (-d - 1) * step); ry = 52; z = 40 + d; op = -d > nL ? 0 : 1; }
      else { x = S * 0.9 + open + (d - 1) * step; ry = -52; z = 40 - d; op = d > nR ? 0 : 1; }
      x += shift;
      el.style.transform = 'translateX(' + x + 'px) translateZ(' + (d ? -S * 0.45 : 0) + 'px) rotateY(' + ry + 'deg)';
      el.style.zIndex = z;
      el.style.opacity = op;
      el.style.pointerEvents = op ? '' : 'none';
      el.classList.toggle('is-active', d === 0);
      el.classList.toggle('is-playing', i === playing);
      el.tabIndex = d === 0 ? 0 : -1;
    });
    var s = SONGS[active];
    now.innerHTML = (playing === active ? '<b>Now spinning</b> ' : '') + s.title + ' <span>· ' + s.artist + '</span>';
  }

  function go(i){
    active = Math.max(0, Math.min(SONGS.length - 1, i));
    layout();
  }

  function toggle(i){
    if(playing === i){ playing = -1; player.innerHTML = ''; player.hidden = true; }
    else {
      playing = i;
      var s = SONGS[i];
      if(s.spotify){
        player.innerHTML = '<iframe src="https://open.spotify.com/embed/track/' + s.spotify + '?utm_source=generator&theme=0" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" title="' + s.title + '"></iframe>';
        player.hidden = false;
      } else { player.innerHTML = ''; player.hidden = true; }
    }
    layout();
  }

  root.querySelector('.rc-prev').addEventListener('click', function(){ go(active - 1); });
  root.querySelector('.rc-next').addEventListener('click', function(){ go(active + 1); });
  root.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight'){ go(active + 1); e.preventDefault(); }
    else if(e.key === 'ArrowLeft'){ go(active - 1); e.preventDefault(); }
  });

  /* horizontal wheel / trackpad flips one record per gesture step */
  var wheelAcc = 0, wheelT = 0;
  stage.addEventListener('wheel', function(e){
    if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAcc += e.deltaX;
    var t = Date.now();
    if(Math.abs(wheelAcc) > 40 && t - wheelT > 160){ go(active + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelT = t; }
  }, { passive:false });

  /* drag / swipe */
  var startX = null, dragged = false;
  stage.addEventListener('pointerdown', function(e){ startX = e.clientX; dragged = false; });
  window.addEventListener('pointermove', function(e){
    if(startX === null) return;
    var dx = e.clientX - startX, step = size() * 0.34;
    if(Math.abs(dx) > step){ dragged = true; go(active + (dx < 0 ? 1 : -1)); startX = e.clientX; }
  });
  window.addEventListener('pointerup', function(){ startX = null; setTimeout(function(){ dragged = false; }, 0); });

  window.addEventListener('resize', layout);
  layout();
})();
