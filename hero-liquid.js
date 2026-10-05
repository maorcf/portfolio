/* Liquid headline: a small GPU fluid sim (WebGL2) whose dye is shaded as glossy,
   translucent slime that refracts the real headline underneath it. */
(function(){
  var hero = document.querySelector('.hero');
  var heading = hero && hero.querySelector('h1');
  var card = document.querySelector('.hero-card');
  if(!hero || !heading) return;
  var host = card || hero;           // the liquid lives across the whole hero card
  var lead = hero.querySelector('.lead');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'liquid-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var gl = canvas.getContext('webgl2', { alpha:true, premultipliedAlpha:true, antialias:false, depth:false, stencil:false });
  if(!gl || !gl.getExtension('EXT_color_buffer_float')){ canvas.remove(); return; }
  gl.getExtension('OES_texture_float_linear');

  /* ---------------- shaders ---------------- */
  var VS = '#version 300 es\nin vec2 aPos;out vec2 vUv;void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}';
  var HEAD = '#version 300 es\nprecision highp float;in vec2 vUv;out vec4 o;\n';

  var FS = {
    splat: HEAD +
      'uniform sampler2D uTarget;uniform float uAspect;uniform vec2 uPoint;uniform vec3 uValue;uniform float uRadius;uniform vec2 uDir;uniform float uStretch;uniform float uCap;' +
      'void main(){vec2 d=vUv-uPoint;d.x*=uAspect;float a=dot(d,uDir);float p=dot(d,vec2(-uDir.y,uDir.x));' +
      'float e=exp(-(a*a/uStretch+p*p)/uRadius);vec3 b=texture(uTarget,vUv).xyz+uValue*e;' +
      'if(uCap>0.)b.x=min(b.x,uCap);o=vec4(b,1.);}',

    advect: HEAD +
      'uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 uTexel;uniform float uDt;uniform float uDissipation;' +
      'uniform vec4 uZone;uniform float uZoneFade;uniform sampler2D uText;uniform vec4 uTextRect;uniform float uCling;' +
      'void main(){vec2 c=vUv-uDt*texture(uVelocity,vUv).xy*uTexel;vec4 r=texture(uSource,c);' +
      'float diss=uDissipation;' +
      'vec2 q=max(uZone.xy-vUv,vUv-uZone.zw);float out_=smoothstep(0.,.06,max(q.x,q.y));diss+=out_*uZoneFade;' +
      'vec2 tu=(vUv-uTextRect.xy)/uTextRect.zw;float t=(tu.x>0.&&tu.x<1.&&tu.y>0.&&tu.y<1.)?texture(uText,tu).a:0.;' +
      'diss*=1.-uCling*t;' +
      'o=r/(1.+diss*uDt);}',

    forces: HEAD +
      'uniform sampler2D uVelocity;uniform sampler2D uDye;uniform float uGravity;uniform float uDt;uniform sampler2D uText;uniform vec4 uTextRect;uniform float uTime;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'void main(){vec2 v=texture(uVelocity,vUv).xy;float d=texture(uDye,vUv).x;' +
      'float heavy=smoothstep(.45,1.1,d);' +
      'float w=.55+.9*h(floor(vUv*vec2(38.,1.))+floor(uTime*.25));' +
      'v.y-=uGravity*heavy*w*uDt;' +
      'vec2 tu=(vUv-uTextRect.xy)/uTextRect.zw;float t=(tu.x>0.&&tu.x<1.&&tu.y>0.&&tu.y<1.)?texture(uText,tu).a:0.;' +
      'v*=1.-.12*t*smoothstep(.1,.5,d);o=vec4(v,0.,1.);}',

    curl: HEAD +
      'uniform sampler2D uVelocity;uniform vec2 uTexel;' +
      'void main(){float L=texture(uVelocity,vUv-vec2(uTexel.x,0.)).y,R=texture(uVelocity,vUv+vec2(uTexel.x,0.)).y,' +
      'T=texture(uVelocity,vUv+vec2(0.,uTexel.y)).x,B=texture(uVelocity,vUv-vec2(0.,uTexel.y)).x;o=vec4(.5*(R-L-T+B),0.,0.,1.);}',

    vorticity: HEAD +
      'uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform vec2 uTexel;uniform float uCurlAmt;uniform float uDt;' +
      'void main(){float L=texture(uCurl,vUv-vec2(uTexel.x,0.)).x,R=texture(uCurl,vUv+vec2(uTexel.x,0.)).x,' +
      'T=texture(uCurl,vUv+vec2(0.,uTexel.y)).x,B=texture(uCurl,vUv-vec2(0.,uTexel.y)).x,C=texture(uCurl,vUv).x;' +
      'vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+1e-4;f*=uCurlAmt*C;f.y*=-1.;' +
      'vec2 v=texture(uVelocity,vUv).xy+f*uDt;o=vec4(clamp(v,-1000.,1000.),0.,1.);}',

    divergence: HEAD +
      'uniform sampler2D uVelocity;uniform vec2 uTexel;' +
      'void main(){vec2 C=texture(uVelocity,vUv).xy;' +
      'float L=texture(uVelocity,vUv-vec2(uTexel.x,0.)).x,R=texture(uVelocity,vUv+vec2(uTexel.x,0.)).x,' +
      'T=texture(uVelocity,vUv+vec2(0.,uTexel.y)).y,B=texture(uVelocity,vUv-vec2(0.,uTexel.y)).y;' +
      'if(vUv.x-uTexel.x<0.)L=-C.x;if(vUv.x+uTexel.x>1.)R=-C.x;if(vUv.y+uTexel.y>1.)T=-C.y;if(vUv.y-uTexel.y<0.)B=-C.y;' +
      'o=vec4(.5*(R-L+T-B),0.,0.,1.);}',

    clear: HEAD + 'uniform sampler2D uTex;uniform float uValue;void main(){o=uValue*texture(uTex,vUv);}',

    pressure: HEAD +
      'uniform sampler2D uPressure;uniform sampler2D uDivergence;uniform vec2 uTexel;' +
      'void main(){float L=texture(uPressure,vUv-vec2(uTexel.x,0.)).x,R=texture(uPressure,vUv+vec2(uTexel.x,0.)).x,' +
      'T=texture(uPressure,vUv+vec2(0.,uTexel.y)).x,B=texture(uPressure,vUv-vec2(0.,uTexel.y)).x;' +
      'o=vec4((L+R+B+T-texture(uDivergence,vUv).x)*.25,0.,0.,1.);}',

    gradient: HEAD +
      'uniform sampler2D uPressure;uniform sampler2D uVelocity;uniform vec2 uTexel;' +
      'void main(){float L=texture(uPressure,vUv-vec2(uTexel.x,0.)).x,R=texture(uPressure,vUv+vec2(uTexel.x,0.)).x,' +
      'T=texture(uPressure,vUv+vec2(0.,uTexel.y)).x,B=texture(uPressure,vUv-vec2(0.,uTexel.y)).x;' +
      'o=vec4(texture(uVelocity,vUv).xy-vec2(R-L,T-B),0.,1.);}',

    blur: HEAD +
      'uniform sampler2D uTex;uniform vec2 uDir;' +
      'void main(){vec4 c=texture(uTex,vUv)*.2270;' +
      'c+=(texture(uTex,vUv+uDir*1.3846)+texture(uTex,vUv-uDir*1.3846))*.3162;' +
      'c+=(texture(uTex,vUv+uDir*3.2308)+texture(uTex,vUv-uDir*3.2308))*.0703;o=c;}',

    /* Final look: thickness field -> normals -> refraction of the headline, tinted
       body, thin-film iridescence, specular + softbox reflections, cast shadow. */
    display: HEAD +
      'uniform sampler2D uDye;uniform sampler2D uText;uniform sampler2D uHead;uniform sampler2D uHeadBlur;uniform vec2 uHeadTexel;uniform vec4 uTextRect;uniform vec2 uSize;uniform vec2 uCardOffset;uniform float uTime;uniform float uDpr;uniform float uTopCut;' +
      'uniform vec4 uLetters[48];uniform vec4 uShape[48];uniform int uCount;' +
      'float hash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}' +
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);' +
      'return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}' +
      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+17.1;a*=.5;}return s;}' +
      'float field(vec2 uv){float d=texture(uDye,uv).x;vec2 px=uv*uSize;' +
      'float n=fbm(px*.012+vec2(uTime*.07,-uTime*.05))-.5;return d+n*.13*smoothstep(.05,.45,d);}' +
      'float height(float f){float x=max(f-.3,0.);return 1.-exp(-x*3.2);}' +
      /* inflated headline: each letter is warped around its own centre (independent x/y) and its
         outline is grown from a blurred copy, so corners round off like a pumped-up rubber shape */
      'vec2 tuv(vec2 p){return (p/uSize-uTextRect.xy)/uTextRect.zw;}' +
      'vec4 headAt(vec2 p,out float I,out vec2 g){I=0.;g=vec2(0.);vec2 t0=tuv(p);' +
      'if(t0.x<-.02||t0.x>1.02||t0.y<-.02||t0.y>1.02)return vec4(0.);' +
      'vec2 disp=vec2(0.);float ws=0.;' +
      'for(int i=0;i<48;i++){if(i>=uCount)break;vec4 S=uShape[i];if(S.z<.002)continue;vec4 L=uLetters[i];' +
      'vec2 d=p-L.xy;vec2 q=d/(L.zw*1.25+3.);float w=exp(-dot(q,q)*1.6);if(w<.01)continue;' +
      'disp+=w*d*(1.-1./S.xy);I+=w*S.z;ws+=w;}' +
      'float nm=max(1.,ws);disp/=nm;I/=nm;' +
      'vec2 tu=tuv(p-disp);if(tu.x<0.||tu.x>1.||tu.y<0.||tu.y>1.)return vec4(0.);' +
      'vec4 o=texture(uHead,tu),b=texture(uHeadBlur,tu);' +
      'float th=.5-.22*I;float aw=fwidth(b.a)*.8+.004;float ia=smoothstep(th-aw,th+aw,b.a)*smoothstep(0.,.1,I);' +
      'float a=max(o.a,ia);vec3 c=mix(b.rgb/max(b.a,1e-3),o.rgb/max(o.a,1e-3),clamp(o.a*1.5,0.,1.));' +
      'vec2 e=uHeadTexel*2.;g=vec2(texture(uHeadBlur,tu+vec2(e.x,0.)).a-texture(uHeadBlur,tu-vec2(e.x,0.)).a,' +
      'texture(uHeadBlur,tu+vec2(0.,e.y)).a-texture(uHeadBlur,tu-vec2(0.,e.y)).a);' +
      'return vec4(c,a);}' +
      /* soft rubber sheen on the inflated letters */
      'vec4 headShaded(vec2 p){float I;vec2 g;vec4 h=headAt(p,I,g);if(h.a<=0.)return h;' +
      'vec3 n=normalize(vec3(-g*7.,1.));vec3 Hd=normalize(normalize(vec3(-.45,.6,.65))+vec3(0.,0.,1.));' +
      'float sp=pow(max(dot(n,Hd),0.),16.);float rimL=1.-n.z;' +
      'vec3 c=h.rgb+vec3(1.)*sp*.42*I+vec3(.55,.5,.6)*pow(rimL,2.)*.25*I;' +
      'return vec4(c,h.a);}' +
      'vec4 scene(vec2 px){vec2 c=vec2(px.x,uSize.y-px.y)+uCardOffset;vec2 g=mod(c,22.)-11.;' +
      'vec3 bg=vec3(.953,.937,.894);bg=mix(bg,vec3(.078),.16*(1.-smoothstep(.6,1.4,length(g))));' +
      'vec2 tu=tuv(px);vec4 t=(tu.x>0.&&tu.x<1.&&tu.y>0.&&tu.y<1.)?texture(uText,tu):vec4(0.);' +
      'bg=mix(bg,t.rgb/max(t.a,1e-3),t.a);vec4 h=headShaded(px);' +
      'return vec4(mix(bg,h.rgb,h.a),max(t.a,h.a));}' +
      'void main(){vec2 uv=vUv;vec2 px=uv*uSize;vec2 e=vec2(3.5/uSize.x,3.5/uSize.y);' +
      'float f=field(uv);float H=height(f);' +
      'float hx=height(field(uv+vec2(e.x,0.)))-height(field(uv-vec2(e.x,0.)));' +
      'float hy=height(field(uv+vec2(0.,e.y)))-height(field(uv-vec2(0.,e.y)));' +
      'vec3 n=normalize(vec3(-hx*2.6,-hy*2.6,1.));' +
      'float aa=fwidth(f)*1.2+1e-3;float cut=smoothstep(uTopCut,uTopCut+16.,uSize.y-px.y);float alpha=smoothstep(.3-aa,.3+aa,f)*cut;' +
      /* cast shadow on paper (light comes from upper left) */
      'float sh=texture(uDye,uv+vec2(-7.,9.)/uSize).x;float shadow=smoothstep(.3,.75,sh)*.2*cut;' +
      'vec4 hd=headShaded(px);vec4 base=vec4(hd.rgb*hd.a,hd.a)+vec4(0.,0.,0.,shadow*(1.-hd.a));' +
      'if(alpha<=0.){o=base;return;}' +
      'float th=clamp(H,0.,1.);' +
      /* refraction: bend the headline underneath through the surface */
      'vec2 off=-n.xy*(10.+38.*th);vec4 sc=scene(px+off);' +
      'vec3 lime=vec3(.97,.985,1.);vec3 deep=vec3(.86,.89,.94);' +
      'vec3 body=sc.rgb*mix(vec3(1.),lime,.82);' +
      'body=mix(body,deep*(.8+.2*sc.rgb),th*th*.18);' +
      'body+=vec3(.05)*(1.-th)*(1.-sc.a);' +
      /* subsurface glow near thin edges */
      'float rim=1.-n.z;body+=vec3(1.)*pow(rim,1.2)*.22;' +
      /* thin-film iridescence */
      'float film=rim*3.6+th*1.6+fbm(px*.006+uTime*.02)*.9;' +
      'vec3 iri=.5+.5*cos(6.2832*(film+vec3(0.,.33,.67)));' +
      'iri=mix(vec3(.62,.38,1.),vec3(1.,.42,.78),iri.r)*.6+vec3(.25,.55,1.)*iri.b*.45;' +
      'float fres=pow(rim,1.15);body=mix(body,iri,clamp(fres*.9+.02,0.,.55));' +
      /* lights */
      'vec3 V=vec3(0.,0.,1.);vec3 L1=normalize(vec3(-.45,.6,.65)),L2=normalize(vec3(.6,-.35,.7));' +
      'float s1=pow(max(dot(n,normalize(L1+V)),0.),140.),s2=pow(max(dot(n,normalize(L2+V)),0.),60.);' +
      'float broad=pow(max(dot(n,normalize(L1+V)),0.),18.);' +
      'vec3 R=reflect(-V,n);float box=smoothstep(.18,.26,R.y)*smoothstep(.62,.5,R.y)*smoothstep(-.55,-.3,R.x)*smoothstep(.15,-.05,R.x);' +
      'vec3 col=body+vec3(1.)*(s1*1.5+box*.55)+vec3(.9,.95,1.)*s2*.45+vec3(1.,1.,.85)*broad*.12;' +
      /* darken the very edge a touch so the volume reads */
      'col*=mix(1.,.72,smoothstep(.0,.25,rim)*(1.-smoothstep(.25,.7,rim)));' +
      'float a=alpha;o=vec4(col*a,a)+base*(1.-a);}'
  };

  function compile(type, src){
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VS);
  function program(src){
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < n; i++){ var name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p:p, u:u };
  }
  var P = {};
  try { for(var k in FS) P[k] = program(FS[k]); }
  catch(err){ console.warn('liquid headline disabled:', err); canvas.remove(); return; }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function fbo(w, h, internal, format){
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex:t, fb:f, w:w, h:h };
  }
  function pair(w, h, internal, format){
    var a = fbo(w,h,internal,format), b = fbo(w,h,internal,format);
    return { read:a, write:b, w:w, h:h, swap:function(){ var t=this.read; this.read=this.write; this.write=t; } };
  }
  function bindTex(unit, tex){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; }
  function draw(target){
    if(target){ gl.viewport(0,0,target.w,target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); }
    else { gl.viewport(0,0,canvas.width,canvas.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* text texture: the headline as drawn by the browser, re-rasterised so the slime can refract it */
  var textTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  var headTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, headTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  var headBlur = null, headBlurTmp = null;
  var tc = document.createElement('canvas'), tctx = tc.getContext('2d');
  var headTexel = [0,0];
  var textRect = [0,0,1,1];  // uv rect (x, y, w, h) of the text texture inside the hero, GL y-up
  var PAD = 24;

  function rasterText(){
    var hr = host.getBoundingClientRect(), r = heading.getBoundingClientRect();
    var els = lead ? [heading, lead] : [heading];
    var L = r.left, T = r.top, Rr = r.right, B = r.bottom;
    if(lead){ var lr = lead.getBoundingClientRect(); L = Math.min(L, lr.left); T = Math.min(T, lr.top); Rr = Math.max(Rr, lr.right); B = Math.max(B, lr.bottom); }
    var s = Math.min(window.devicePixelRatio || 1, 2);
    var pad = Math.max(PAD, (parseFloat(getComputedStyle(heading).fontSize) || 50)*.5);
    var x0 = L - pad, y0 = T - pad, w = Rr - L + pad*2, h = B - T + pad*2;
    tc.width = Math.max(1, Math.round(w*s)); tc.height = Math.max(1, Math.round(h*s));
    host.classList.remove('liquid-on'); // read the real colours
    var range = document.createRange(), node;
    function upload(tex){
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    }
    function begin(){ tctx.setTransform(1,0,0,1,0,0); tctx.clearRect(0,0,tc.width,tc.height); tctx.setTransform(s,0,0,s,-x0*s,-y0*s); }
    begin();
    els.forEach(function(el, idx){
      if(idx === 1){ upload(headTex); begin(); }
      var cs = getComputedStyle(el);
      tctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; tctx.textBaseline = 'alphabetic';
      tctx.globalAlpha = parseFloat(cs.opacity) || 1;
      var m = tctx.measureText('Hg');
      var asc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize)*.97, desc = m.fontBoundingBoxDescent || parseFloat(cs.fontSize)*.24;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while((node = walker.nextNode())){
        var col = getComputedStyle(node.parentElement).color, txt = node.textContent;
        if(node.parentElement.closest('.icon-chip')) continue;
        for(var i = 0; i < txt.length; i++){
          if(/\s/.test(txt[i])) continue;
          range.setStart(node, i); range.setEnd(node, i+1);
          var b = range.getBoundingClientRect();
          if(!b.width) continue;
          tctx.fillStyle = col;
          tctx.fillText(txt[i], b.left, b.top + (b.height - asc - desc)/2 + asc);
        }
      }
    });
    tctx.globalAlpha = 1;
    var chip = heading.querySelector('.icon-chip');
    if(chip){
      var c = chip.getBoundingClientRect();
      tctx.fillStyle = '#fff'; tctx.strokeStyle = '#141414'; tctx.lineWidth = 2;
      tctx.beginPath(); (tctx.roundRect ? tctx.roundRect.bind(tctx) : tctx.rect.bind(tctx))(c.left+1, c.top+1, c.width-2, c.height-2, 11); tctx.fill(); tctx.stroke();
      tctx.lineWidth = c.width*.1; tctx.lineCap = 'round';
      var cx = c.left + c.width/2, cy = c.top + c.height/2, a = c.width*.27;
      tctx.beginPath(); tctx.moveTo(cx-a,cy); tctx.lineTo(cx+a,cy); tctx.moveTo(cx,cy-a); tctx.lineTo(cx,cy+a); tctx.stroke();
    }
    if(els.length === 1){ upload(headTex); begin(); }
    upload(textTex);
    host.classList.add('liquid-on');
    textRect = [(x0-hr.left)/hr.width, 1-(y0-hr.top+h)/hr.height, w/hr.width, h/hr.height];
    // blurred copy of the headline at half resolution: the source for the rounded, inflated outline
    var bw = Math.max(1, Math.round(tc.width/2)), bh = Math.max(1, Math.round(tc.height/2));
    if(!headBlur || headBlur.w !== bw || headBlur.h !== bh){ headBlur = fbo(bw, bh, gl.RGBA16F, gl.RGBA); headBlurTmp = fbo(bw, bh, gl.RGBA16F, gl.RGBA); }
    var rad = Math.max(.6, (parseFloat(getComputedStyle(heading).fontSize) || 50)*.016*s/2);
    gl.disable(gl.BLEND); gl.useProgram(P.blur.p);
    for(var it = 0; it < 3; it++){
      gl.uniform1i(P.blur.u.uTex, bindTex(0, it ? headBlur.tex : headTex)); gl.uniform2f(P.blur.u.uDir, rad/bw, 0); draw(headBlurTmp);
      gl.uniform1i(P.blur.u.uTex, bindTex(0, headBlurTmp.tex)); gl.uniform2f(P.blur.u.uDir, 0, rad/bh); draw(headBlur);
    }
    headTexel = [1/bw, 1/bh];
  }

  /* ---------------- sizing ---------------- */
  var W = 1, H = 1, dpr = 1, vel, dye, prs, div, crl, cardOffset = [0,0];
  function resize(){
    var r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    var simScale = Math.min(1, 240/Math.max(1, Math.min(W,H)));
    var sw = Math.max(16, Math.round(W*simScale)), sh = Math.max(16, Math.round(H*simScale));
    var dyeScale = Math.min(1, 720/Math.max(W,H));
    var dw = Math.round(W*dyeScale), dh = Math.round(H*dyeScale);
    if(!vel || vel.w !== sw || vel.h !== sh){
      vel = pair(sw, sh, gl.RG16F, gl.RG); prs = pair(sw, sh, gl.R16F, gl.RED);
      div = fbo(sw, sh, gl.R16F, gl.RED); crl = fbo(sw, sh, gl.R16F, gl.RED);
    }
    if(!dye || dye.w !== dw || dye.h !== dh) dye = pair(dw, dh, gl.R16F, gl.RED);
    if(card){ var cr = card.getBoundingClientRect(); cardOffset = [r.left-cr.left, r.top-cr.top]; }
    topCut = header ? header.getBoundingClientRect().bottom - r.top : 0;
    measureGlyphs();
    rasterText();
    wake();
  }

  /* ---------------- pointer with inertia ---------------- */
  var target = { x:0, y:0 }, blob = { x:0, y:0, vx:0, vy:0 }, inside = false, hasPointer = false;
  var lastInput = 0, zoneUv = [0,0,1,1], topCut = 0;
  var header = host.querySelector('header');
  function headingZone(){
    var hr = host.getBoundingClientRect();
    return { l:0, t:topCut, r:hr.width, b:hr.height, hr:hr };
  }
  function onMove(e){
    var z = headingZone(), x = e.clientX - z.hr.left, y = e.clientY - z.hr.top;
    var now = x > z.l && x < z.r && y > z.t && y < z.b;
    if(now && !inside){ blob.x = x; blob.y = y; blob.vx = blob.vy = 0; }
    inside = now; target.x = x; target.y = y; hasPointer = true;
    lastInput = performance.now();
    if(inside) wake();
  }
  window.addEventListener('pointermove', onMove, { passive:true });
  document.addEventListener('pointerleave', function(){ inside = false; });
  window.addEventListener('blur', function(){ inside = false; });

  /* Balloon letters: every glyph has its own under-damped springs for width, height and
     "puff" (outline growth). Targets come from how close the cursor is to the glyph centre and
     from which side it touches, so letters swell unevenly and wobble a little as they settle. */
  var glyphs = [], growing = false, letterBuf = new Float32Array(48*4), shapeBuf = new Float32Array(48*4);
  function measureGlyphs(){
    var hr = host.getBoundingClientRect();
    glyphs = Array.prototype.slice.call(heading.querySelectorAll('.char'), 0, 48).map(function(el){
      var b = el.getBoundingClientRect();
      return { x:b.left - hr.left + b.width/2, y:b.top - hr.top + b.height*.52, hw:b.width/2, hh:b.height*.36,
               sx:1, sy:1, vx:0, vy:0, p:0, vp:0 };
    });
  }
  function spring(cur, vel, goal, dt){
    var k = goal > cur ? 150 : 60, c = goal > cur ? 11 : 7.5; // quick puff up, slower soft deflate
    vel += ((goal - cur)*k - vel*c)*dt;
    return [cur + vel*dt, vel];
  }
  function grow(dt){
    growing = false;
    var sub = dt > 1/50 ? 2 : 1, h = dt/sub;
    for(var i = 0; i < glyphs.length; i++){
      var g = glyphs[i], A = 0, ox = 0, oy = 0;
      if(inside){
        var dx = (target.x - g.x)/(g.hw*2.2 + 6), dy = (target.y - g.y)/(g.hh*2.2 + 6);
        A = Math.exp(-(dx*dx + dy*dy)*1.1);
        ox = Math.min(1, Math.abs(dx)); oy = Math.min(1, Math.abs(dy));
      }
      var gx = 1 + .2*A*(.8 + .45*ox), gy = 1 + .2*A*(.8 + .45*oy), gp = A;
      for(var n = 0; n < sub; n++){
        var r = spring(g.sx, g.vx, gx, h); g.sx = r[0]; g.vx = r[1];
        r = spring(g.sy, g.vy, gy, h); g.sy = r[0]; g.vy = r[1];
        r = spring(g.p, g.vp, gp, h); g.p = r[0]; g.vp = r[1];
      }
      if(Math.abs(g.sx-1) + Math.abs(g.sy-1) + Math.abs(g.p) + Math.abs(g.vx) + Math.abs(g.vy) + Math.abs(g.vp) > .002) growing = true;
      else { g.sx = g.sy = 1; g.p = g.vx = g.vy = g.vp = 0; }
      // a letter puffing up shoves the slime around it
      if(g.vp > 1.2 && dye){
        var k2 = vel.w/W*30*Math.min(g.vp, 3);
        splat(g.x - g.hw*1.1, g.y, -k2, 0, 0, g.hh*.9, 1, 1, 0);
        splat(g.x + g.hw*1.1, g.y, k2, 0, 0, g.hh*.9, 1, 1, 0);
        splat(g.x, g.y - g.hh*1.4, 0, k2, 0, g.hw*.9, 1, 1, 0);
      }
    }
  }
  function letterUniforms(U){
    var n = glyphs.length;
    for(var i = 0; i < n; i++){
      var g = glyphs[i];
      letterBuf[i*4] = g.x; letterBuf[i*4+1] = H - g.y; letterBuf[i*4+2] = g.hw; letterBuf[i*4+3] = g.hh;
      shapeBuf[i*4] = Math.max(.5, g.sx); shapeBuf[i*4+1] = Math.max(.5, g.sy); shapeBuf[i*4+2] = Math.max(0, g.p); shapeBuf[i*4+3] = 0;
    }
    gl.uniform4fv(U['uLetters[0]'], letterBuf); gl.uniform4fv(U['uShape[0]'], shapeBuf); gl.uniform1i(U.uCount, n);
  }

  /* ---------------- simulation ---------------- */
  function splat(x, y, dvx, dvy, amount, radius, stretch, dirx, diry){
    var u = x/W, v = 1 - y/H, aspect = W/H;
    gl.useProgram(P.splat.p); var U = P.splat.u;
    gl.uniform1f(U.uAspect, aspect); gl.uniform2f(U.uPoint, u, v);
    gl.uniform2f(U.uDir, dirx, diry); gl.uniform1f(U.uStretch, stretch);
    gl.uniform1f(U.uRadius, (radius/H)*(radius/H));
    gl.uniform1i(U.uTarget, bindTex(0, vel.read.tex));
    gl.uniform3f(U.uValue, dvx, dvy, 0); gl.uniform1f(U.uCap, 0);
    draw(vel.write); vel.swap();
    gl.uniform1i(U.uTarget, bindTex(0, dye.read.tex));
    gl.uniform3f(U.uValue, amount, 0, 0); gl.uniform1f(U.uCap, 1.35);
    draw(dye.write); dye.swap();
  }

  function step(dt, t){
    var tx = 1/vel.w, ty = 1/vel.h, U;
    gl.disable(gl.BLEND);

    U = P.forces.u; gl.useProgram(P.forces.p);
    gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex)); gl.uniform1i(U.uDye, bindTex(1, dye.read.tex));
    gl.uniform1i(U.uText, bindTex(2, headTex)); gl.uniform4fv(U.uTextRect, textRect);
    gl.uniform1f(U.uGravity, 100); gl.uniform1f(U.uDt, dt); gl.uniform1f(U.uTime, t);
    draw(vel.write); vel.swap();

    U = P.curl.u; gl.useProgram(P.curl.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex)); draw(crl);

    U = P.vorticity.u; gl.useProgram(P.vorticity.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex));
    gl.uniform1i(U.uCurl, bindTex(1, crl.tex)); gl.uniform1f(U.uCurlAmt, 1.5); gl.uniform1f(U.uDt, dt);
    draw(vel.write); vel.swap();

    U = P.divergence.u; gl.useProgram(P.divergence.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex)); draw(div);

    U = P.clear.u; gl.useProgram(P.clear.p);
    gl.uniform1i(U.uTex, bindTex(0, prs.read.tex)); gl.uniform1f(U.uValue, .8); draw(prs.write); prs.swap();

    U = P.pressure.u; gl.useProgram(P.pressure.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1i(U.uDivergence, bindTex(1, div.tex));
    for(var i = 0; i < 18; i++){ gl.uniform1i(U.uPressure, bindTex(0, prs.read.tex)); draw(prs.write); prs.swap(); }

    U = P.gradient.u; gl.useProgram(P.gradient.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1i(U.uPressure, bindTex(0, prs.read.tex));
    gl.uniform1i(U.uVelocity, bindTex(1, vel.read.tex)); draw(vel.write); vel.swap();

    U = P.advect.u; gl.useProgram(P.advect.p);
    gl.uniform2f(U.uTexel, tx, ty); gl.uniform1f(U.uDt, dt);
    gl.uniform1i(U.uText, bindTex(2, headTex)); gl.uniform4fv(U.uTextRect, textRect);
    gl.uniform4fv(U.uZone, zoneUv);
    gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex)); gl.uniform1i(U.uSource, bindTex(1, vel.read.tex));
    gl.uniform1f(U.uDissipation, 3.6); gl.uniform1f(U.uZoneFade, 4); gl.uniform1f(U.uCling, 0);
    draw(vel.write); vel.swap();
    gl.uniform1i(U.uVelocity, bindTex(0, vel.read.tex)); gl.uniform1i(U.uSource, bindTex(1, dye.read.tex));
    gl.uniform1f(U.uDissipation, inside ? .6 : 1.4); gl.uniform1f(U.uZoneFade, 6); gl.uniform1f(U.uCling, .2);
    draw(dye.write); dye.swap();
  }

  function render(t){
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    var U = P.display.u; gl.useProgram(P.display.p);
    gl.uniform1i(U.uDye, bindTex(0, dye.read.tex)); gl.uniform1i(U.uText, bindTex(1, textTex));
    gl.uniform1i(U.uHead, bindTex(2, headTex)); gl.uniform1i(U.uHeadBlur, bindTex(3, headBlur.tex)); gl.uniform2f(U.uHeadTexel, headTexel[0], headTexel[1]);
    letterUniforms(U);
    gl.uniform4fv(U.uTextRect, textRect); gl.uniform2f(U.uSize, W, H);
    gl.uniform2f(U.uCardOffset, cardOffset[0], cardOffset[1]); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uTopCut, topCut);
    draw(null);
  }

  var running = false, visible = true, last = 0, frame = 0;
  function wake(){ if(!running && visible){ running = true; last = performance.now(); requestAnimationFrame(loop); } }
  function loop(now){
    if(!visible){ running = false; return; }
    var dt = Math.min(1/30, (now - last)/1000); last = now; frame++;
    var t = now/1000;
    var z = headingZone();
    zoneUv = [-1, -1, 2, 1 - topCut/H]; // the hero card below the header

    grow(dt);

    // spring-damped follower: the slime lags and swings behind the real cursor
    var px = blob.x, py = blob.y;
    if(inside){
      blob.vx += (target.x - blob.x)*170*dt; blob.vy += (target.y - blob.y)*170*dt;
      var damp = Math.exp(-15*dt); blob.vx *= damp; blob.vy *= damp;
      blob.x += blob.vx*dt; blob.y += blob.vy*dt;
      var dx = blob.x - px, dy = blob.y - py, dist = Math.hypot(dx, dy);
      var speed = Math.hypot(blob.vx, blob.vy);
      var fs = parseFloat(getComputedStyle(heading).fontSize) || 50;
      var rad = fs*(.34 + Math.min(.3, speed/2600));
      var dirx = speed > 1 ? blob.vx/speed : 1, diry = speed > 1 ? -blob.vy/speed : 0;
      var stretch = 1 + Math.min(3.5, speed/450);
      var steps = Math.max(1, Math.min(10, Math.ceil(dist/(rad*.35))));
      var k = vel.w/W; // px/s -> sim texels/s
      for(var i = 1; i <= steps; i++){
        var f = i/steps;
        splat(px + dx*f, py + dy*f, blob.vx*k*.38, -blob.vy*k*.38,
              (.035 + Math.min(.38, speed/2800))/steps, rad, stretch, dirx, diry);
      }
      // a slow trickle keeps a resting blob alive and lets it settle instead of vanishing
      splat(blob.x, blob.y, 0, 0, .55*dt, rad*.7, 1, 1, 0);
    }
    step(dt, t);
    render(t);

    if(!inside && now - lastInput > 4500 && !growing){
      running = false; return; // the last frame (with the headline) stays on screen
    }
    requestAnimationFrame(loop);
  }

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) wake(); }).observe(host);
  }
  if('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  window.addEventListener('resize', resize);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(resize);
  heading.addEventListener('animationend', resize);
  resize();
})();
