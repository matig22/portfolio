(function(){
  var NS='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,
      hasG=!!(window.gsap&&window.ScrollTrigger),$=function(s){return document.querySelector(s)};
  function mk(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);parent.appendChild(e);return e}

  /* ---------- Idioma (es / en) ---------- */
  var lang='es',els=[].slice.call(document.querySelectorAll('[data-en]')),words=[],prog=0,rv=$('.rv');
  els.forEach(function(e){e.dataset.es=e.innerHTML});
  var T={es:{hora:'Ahora son las {t} en Córdoba',away:'¿Se cortó la conexión? Volvé',back:'Reconectado',title:'Matías Marco Galli, desarrollador full stack',btn:'EN'},
         en:{hora:'It is {t} in Córdoba, Argentina',away:'Connection lost? Come back',back:'Reconnected',title:'Matías Marco Galli, full stack developer',btn:'ES'}};
  var networkDemo=$('#offline-diagram'),networkToggle=$('#network-toggle'),networkStatus=$('#network-status'),localQueue=$('.local-queue'),phoneNode=$('.phone-node'),cloudNode=$('.cloud-node'),
      networkState='online',networkTimer,offlineTicker,pendingNodes=0,inFlight=0,syncStarted=false,
      copyBtn=$('#copy-email'),copyStatus=$('#copy-status'),copyTimer;
  function renderOfflineState(){
    if(!networkDemo)return;
    var labels={
      es:{online:'Cortá internet',offline:'Reconectar',sync:'Sincronizando…',ready:'Con internet: los datos se sincronizan normalmente.',stopped:'Sin internet: la app sigue guardando en el celular.',stored:'Sin internet: {n} cambios guardados localmente.',syncing:'Reconectando: pasando {n} cambios a la base de datos…',done:'Listo: los cambios ya están en la base de datos.'},
      en:{online:'Disconnect internet',offline:'Reconnect',sync:'Syncing…',ready:'Online: data syncs as usual.',stopped:'Offline: the app keeps saving on the phone.',stored:'Offline: {n} changes saved locally.',syncing:'Reconnecting: sending {n} changes to the database…',done:'Done: the changes are in the database.'}
    }[lang];
    networkToggle.textContent=labels[networkState==='offline'?'offline':networkState==='sync'?'sync':'online'];networkToggle.disabled=networkState==='sync';
    networkDemo.setAttribute('aria-label',lang==='es'?'Celular, almacenamiento local y base de datos en la nube':'Phone, local storage and cloud database');
    networkDemo.classList.toggle('is-offline',networkState==='offline');networkDemo.classList.toggle('is-syncing',networkState==='sync');
    networkStatus.textContent=networkState==='offline'?(pendingNodes?labels.stored.replace('{n}',pendingNodes):labels.stopped):networkState==='sync'?labels.syncing.replace('{n}',pendingNodes+inFlight):networkState==='done'?labels.done:labels.ready;
  }
  function flyNode(from,to,toCloud,delay,done){
    if(reduce){done();return}
    var dot=document.createElement('i'),start=null,duration=800;dot.className='travel-node'+(toCloud?' to-cloud':'');
    function center(el){var r=el.getBoundingClientRect?el.getBoundingClientRect():el,base=networkDemo.getBoundingClientRect();return{x:r.left+r.width/2-base.left,y:r.top+r.height/2-base.top}}
    function frame(now){if(start===null)start=now;var t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t),a=center(from),b=center(to),fade=toCloud?Math.max(0,Math.min(1,(t-.72)/.28)):0;dot.style.left=(a.x+(b.x-a.x)*ease)+'px';dot.style.top=(a.y+(b.y-a.y)*ease)+'px';if(toCloud){dot.style.opacity=String(1-fade);dot.style.transform='translate(-50%,-50%) scale('+(1-.5*fade)+')'}if(t<1)requestAnimationFrame(frame);else{dot.remove();done()}}
    var origin=center(from);dot.style.left=origin.x+'px';dot.style.top=origin.y+'px';networkDemo.appendChild(dot);
    setTimeout(function(){requestAnimationFrame(frame)},delay||0);
  }
  function nextLocalSlot(){var i=pendingNodes;return{getBoundingClientRect:function(){var r=localQueue.getBoundingClientRect();return{left:r.left+(i%4)*11,top:r.top+Math.floor(i/4)*11,width:7,height:7}}}}
  function saveOfflineNode(){
    if(networkState!=='offline'||pendingNodes+inFlight>=8)return;
    inFlight++;var target=nextLocalSlot();
    flyNode(phoneNode,target,false,0,function(){inFlight--;if(pendingNodes<8){var dot=document.createElement('i');dot.className='queued-dot';dot.setAttribute('aria-hidden','true');localQueue.appendChild(dot);pendingNodes++}renderOfflineState();if(networkState==='sync'&&inFlight===0)syncQueuedNodes()});
  }
  function finishSync(){cloudNode.classList.remove('is-receiving');networkState='done';renderOfflineState();networkTimer=setTimeout(function(){networkState='online';renderOfflineState()},2200)}
  function syncQueuedNodes(){
    if(networkState!=='sync'||inFlight||syncStarted)return;syncStarted=true;var queued=[].slice.call(localQueue.querySelectorAll('.queued-dot'));
    if(!queued.length){finishSync();return}cloudNode.classList.add('is-receiving');var left=queued.length;
    queued.forEach(function(dot,i){flyNode(dot,cloudNode,true,i*90,function(){dot.remove();pendingNodes--;left--;renderOfflineState();if(!left)finishSync()})});
  }
  function startOffline(){clearTimeout(networkTimer);clearInterval(offlineTicker);networkState='offline';syncStarted=false;renderOfflineState();saveOfflineNode();offlineTicker=setInterval(saveOfflineNode,1050)}
  function startSync(){clearInterval(offlineTicker);networkState='sync';renderOfflineState();if(!inFlight)syncQueuedNodes()}
  networkToggle.addEventListener('click',function(){if(networkState==='offline')startSync();else if(networkState==='online'||networkState==='done')startOffline()});
  function copyResult(ok){clearTimeout(copyTimer);copyStatus.textContent=lang==='es'?(ok?'Copiado':'No se pudo copiar'):(ok?'Copied':'Could not copy');copyTimer=setTimeout(function(){copyStatus.textContent=''},1800)}
  function fallbackCopy(){var field=document.createElement('textarea');field.value='matiasgalli20@gmail.com';field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}field.remove();copyResult(ok)}
  copyBtn.addEventListener('click',function(){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText('matiasgalli20@gmail.com').then(function(){copyResult(true)},fallbackCopy);else fallbackCopy()});
  var finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  /* Galería apilada de capturas reales de Grace */
  var projects={grace:[
    {src:'imgs/grace/01-inicio.webp',es:'Inicio: lo que hay que resolver hoy',en:'Home: what needs attention today',alt:'Pantalla de inicio de Grace con los pendientes del día',altEn:'Grace home screen with today’s pending tasks'},
    {src:'imgs/grace/02-compras.webp',es:'Compras: cargar prendas con foto, precio y moneda',en:'Purchases: add items with photo, price and currency',alt:'Pantalla de compras de Grace',altEn:'Grace purchases screen'},
    {src:'imgs/grace/03-stock.webp',es:'Stock: búsqueda, filtros y talles',en:'Stock: search, filters and sizes',alt:'Pantalla de stock de Grace con filtros',altEn:'Grace stock screen with filters'},
    {src:'imgs/grace/04-ventas.webp',es:'Ventas: condicionales y clientas con deuda',en:'Sales: pending sales and customers with debt',alt:'Pantalla de ventas de Grace',altEn:'Grace sales screen'},
    {src:'imgs/grace/05-balance.webp',es:'Balance: ganancias, deudas e inversión (con PIN)',en:'Balance: profit, debts and investment (PIN-protected)',alt:'Pantalla de balance de Grace',altEn:'Grace balance screen'},
    {src:'imgs/grace/06-mas.webp',es:'Más: Excel, copias de seguridad y catálogos',en:'More: Excel export, backups and catalogs',alt:'Pantalla de opciones de Grace',altEn:'Grace options screen'}
  ]};
  var stacks=[];
  function mountStack(el,items){
    var n=items.length;if(!n)return;var cur=0,timer=0,drag=null,moved=false,autoOk=!reduce,hovered=false,focused=false,manualPause=false,resumeTimer=0,cards=[],dots=[];
    var stage=document.createElement('div'),cap=document.createElement('p'),ui=document.createElement('div'),dw=document.createElement('div');
    stage.className='cs-stage';stage.tabIndex=0;stage.setAttribute('role','group');cap.className='cs-cap';cap.setAttribute('aria-live','polite');ui.className='cs-ui';dw.className='cs-dots';
    function button(direction){var b=document.createElement('button'),svg=document.createElementNS(NS,'svg'),path=document.createElementNS(NS,'path');b.type='button';b.className='cs-btn';svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d',direction==='left'?'M14.5 5.5 8 12l6.5 6.5':'m9.5 5.5 6.5 6.5-6.5 6.5');svg.appendChild(path);b.appendChild(svg);return b}
    var prev=button('left'),next=button('right');
    items.forEach(function(it,i){var c=document.createElement('div'),im=new Image();c.className='cs-card';im.src=it.src;im.alt='';im.draggable=false;if(i)im.loading='lazy';c.appendChild(im);c.addEventListener('click',function(){if(moved){moved=false;return}if(i!==cur)go(i,true)});stage.appendChild(c);cards.push(c);var d=document.createElement('button');d.type='button';d.className='cs-dot';d.addEventListener('click',function(){go(i,true)});dw.appendChild(d);dots.push(d)});
    ui.appendChild(prev);ui.appendChild(dw);ui.appendChild(next);el.appendChild(stage);el.appendChild(ui);el.appendChild(cap);
    function render(){var en=lang==='en';cards.forEach(function(c,i){var d=i-cur;if(d>n/2)d-=n;if(d<-n/2)d+=n;var ad=Math.abs(d),show=ad<=2;c.style.setProperty('--d',d);c.style.setProperty('--ad',ad);c.style.zIndex=10-ad;c.style.opacity=show?1:0;c.style.pointerEvents=show?'auto':'none';c.classList.toggle('on',d===0);c.setAttribute('aria-hidden',d===0?'false':'true');c.firstChild.alt=en?items[i].altEn:items[i].alt;dots[i].classList.toggle('on',i===cur);dots[i].setAttribute('aria-current',i===cur?'true':'false');dots[i].setAttribute('aria-label',(en?'Screenshot ':'Captura ')+(i+1)+(en?' of ':' de ')+n)});cap.textContent=en?items[cur].en:items[cur].es;prev.setAttribute('aria-label',en?'Previous screenshot':'Captura anterior');next.setAttribute('aria-label',en?'Next screenshot':'Captura siguiente');stage.setAttribute('aria-label',en?'Screenshot gallery':'Galería de capturas')}
    function resumeAuto(){autoOk=!reduce&&!hovered&&!focused&&!manualPause;cap.setAttribute('aria-live',autoOk&&timer?'off':'polite')}
    function go(i,user){cur=(i%n+n)%n;render();if(user){cap.setAttribute('aria-live','polite');manualPause=true;autoOk=false;clearTimeout(resumeTimer);resumeTimer=setTimeout(function(){manualPause=false;resumeAuto()},9000)}}
    function play(){if(reduce||timer)return;if(!focused)cap.setAttribute('aria-live','off');timer=setInterval(function(){if(autoOk&&!drag)go(cur+1,false)},3600)}function stop(){clearInterval(timer);timer=0}
    prev.addEventListener('click',function(){go(cur-1,true)});next.addEventListener('click',function(){go(cur+1,true)});
    stage.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){go(cur+1,true);e.preventDefault()}else if(e.key==='ArrowLeft'){go(cur-1,true);e.preventDefault()}});
    stage.addEventListener('pointerdown',function(e){drag={x:e.clientX,id:e.pointerId};moved=false});stage.addEventListener('pointermove',function(e){if(drag&&Math.abs(e.clientX-drag.x)>10){moved=true;try{stage.setPointerCapture(drag.id)}catch(x){}}});stage.addEventListener('pointerup',function(e){if(!drag)return;var dx=e.clientX-drag.x;if(Math.abs(dx)>45)go(cur+(dx<0?1:-1),true);drag=null;setTimeout(function(){moved=false},0)});stage.addEventListener('pointercancel',function(){drag=null});
    el.addEventListener('mouseenter',function(){hovered=true;autoOk=false});el.addEventListener('mouseleave',function(){hovered=false;resumeAuto()});el.addEventListener('focusin',function(){focused=true;autoOk=false;cap.setAttribute('aria-live','polite')});el.addEventListener('focusout',function(e){if(!el.contains(e.relatedTarget)){focused=false;resumeAuto()}});new IntersectionObserver(function(e){if(e[e.length-1].isIntersecting)play();else stop()},{threshold:.35}).observe(el);render();stacks.push(render);
  }
  [].slice.call(document.querySelectorAll('[data-stack]')).forEach(function(el){mountStack(el,projects[el.getAttribute('data-stack')]||[])});
  function splitRv(){
    if(!rv||reduce||!hasG)return;
    rv.innerHTML=rv.textContent.split(' ').map(function(w){return '<span>'+w+'</span>'}).join(' ');
    words=[].slice.call(rv.querySelectorAll('span'));paint();
  }
  function paint(){var n=prog*(words.length+3);words.forEach(function(w,i){w.style.opacity=Math.max(.2,Math.min(1,n-i))})}
  function setLang(l){
    lang=l;document.documentElement.lang=l;
    els.forEach(function(e){e.innerHTML=l==='en'?e.dataset.en:e.dataset.es});
    $('#lang').textContent=T[l].btn;updateThemeButton();renderOfflineState();document.title=T[l].title;tick();splitRv();stacks.forEach(function(r){r()});
    if(hasG)ScrollTrigger.refresh();
    try{localStorage.setItem('lang',l)}catch(e){}
  }
  $('#lang').addEventListener('click',function(){setLang(lang==='es'?'en':'es')});

  /* ---------- Tema claro / oscuro ---------- */
  var themeBtn=$('#theme-toggle');
  function updateThemeButton(){
    var dark=document.documentElement.dataset.theme==='dark';
    themeBtn.setAttribute('aria-pressed',String(dark));
    themeBtn.setAttribute('aria-label',lang==='es'?(dark?'Activar modo claro':'Activar modo oscuro'):(dark?'Enable light mode':'Enable dark mode'));
    themeBtn.querySelector('.theme-icon').innerHTML=dark
      ?'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
      :'<svg viewBox="0 0 24 24"><path d="M20.9 13.1A8.9 8.9 0 0 1 10.9 3.1 8.9 8.9 0 1 0 20.9 13.1Z"/></svg>';
  }
  function setTheme(theme,save){
    document.documentElement.dataset.theme=theme==='dark'?'dark':'light';
    document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#101522':'#1a3bd1';
    updateThemeButton();
    if(save){try{localStorage.setItem('portfolio-theme',document.documentElement.dataset.theme)}catch(e){}}
  }
  themeBtn.addEventListener('click',function(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true)});
  setTheme(document.documentElement.dataset.theme||'light',false);
  renderOfflineState();

  /* ---------- Cables de la portada (orden T568B; los rayados llevan un hilo blanco) ---------- */
  var svg=$('.wires'),cols=['#ff8f1c','#ff8f1c','#3ed36b','#8fd0ff','#8fd0ff','#3ed36b','#b97a3c','#b97a3c'],
      stripe=[1,0,1,0,1,0,1,0],bases=[],mx=.5,my=.5,energy=0,last=0,pk=[];
  cols.forEach(function(c,i){
    var p=mk('path',{pathLength:1,class:'w',stroke:c},svg);p.style.setProperty('--i',i);bases.push(p);
    if(stripe[i])p._q=mk('path',{pathLength:1,class:'s'},svg);
  });
  // Datos que viajan por los cables: dos puntos de luz por cable; aceleran con el mouse
  bases.forEach(function(p,i){
    [0,.5].forEach(function(off){
      p&&pk.push({p:p,u:(off+i*.13)%1,v:.045+(i%3)*.012,h:mk('circle',{r:19,fill:'#f6f8ff',opacity:0},svg),c:mk('circle',{r:7,fill:'#f6f8ff',opacity:0},svg)});
    });
  });
  function draw(t){
    var dt=Math.min(.05,(t-last)/1000||0);last=t;energy*=.94;
    bases.forEach(function(p,i){
      var y0=90+i*62,ye=300+i*17,o=Math.sin(t*.0006+i*.8)*46,pull=(my-.5)*240*(i%2?-1:1),
          d='M-40 '+y0+' C 520 '+(y0+o+pull)+' 1040 '+(ye-o-pull)+' 1640 '+ye;
      p.setAttribute('d',d);if(p._q)p._q.setAttribute('d',d);
    });
    if(reduce||t<2700)return;
    pk.forEach(function(k){
      k.u=(k.u+k.v*dt*(1+energy*5))%1;
      var len=k.p.getTotalLength(),pt=k.p.getPointAtLength(k.u*len),fade=Math.min(1,k.u*8,(1-k.u)*8);
      k.h.setAttribute('cx',pt.x);k.h.setAttribute('cy',pt.y);k.c.setAttribute('cx',pt.x);k.c.setAttribute('cy',pt.y);
      k.h.setAttribute('opacity',.22*fade);k.c.setAttribute('opacity',.95*fade);
    });
  }
  draw(0);
  if(!reduce){
    var hero=$('.hero'),on=true,fine=finePointer.matches,px=-999,py=-999,pin=false,trailAlpha=0,trailPoints=[],canvas=null,ctx=null;
    if(fine){
      canvas=document.createElement('canvas');ctx=canvas.getContext('2d');canvas.className='trail';canvas.setAttribute('aria-hidden','true');svg.parentNode.insertBefore(canvas,svg.nextSibling);
      for(var q=0;q<22;q++)trailPoints.push({x:-99,y:-99});
      function resizeTrail(){var r=hero.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
      resizeTrail();addEventListener('resize',resizeTrail);
    }
    function drawTrail(){
      if(!fine||!ctx)return;
      var r=hero.getBoundingClientRect();trailAlpha+=((pin?1:0)-trailAlpha)*.08;ctx.clearRect(0,0,r.width,r.height);if(trailAlpha<.02)return;
      var x=px-r.left,y=py-r.top;trailPoints[0].x+=(x-trailPoints[0].x)*.45;trailPoints[0].y+=(y-trailPoints[0].y)*.45;
      for(var i=1;i<trailPoints.length;i++){trailPoints[i].x+=(trailPoints[i-1].x-trailPoints[i].x)*.38;trailPoints[i].y+=(trailPoints[i-1].y-trailPoints[i].y)*.38}
      ctx.lineCap='round';for(var j=trailPoints.length-1;j>0;j--){var k=1-j/trailPoints.length;ctx.beginPath();ctx.moveTo(trailPoints[j].x,trailPoints[j].y);ctx.lineTo(trailPoints[j-1].x,trailPoints[j-1].y);ctx.lineWidth=1+7*k;ctx.strokeStyle='rgba(255,143,28,'+(trailAlpha*k*.9)+')';ctx.stroke()}
    }
    function frame(t){if(!on)return;draw(t);drawTrail();requestAnimationFrame(frame)}
    requestAnimationFrame(frame);
    new IntersectionObserver(function(e){var was=on;on=e[0].isIntersecting;if(on&&!was)requestAnimationFrame(frame)}).observe(hero);
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height;energy=Math.min(1,energy+Math.abs(nx-mx)*6+Math.abs(ny-my)*6);mx=nx;my=ny;px=e.clientX;py=e.clientY;pin=fine;if(fine&&trailPoints[0].x<0)trailPoints.forEach(function(p){p.x=e.clientX-r.left;p.y=e.clientY-r.top})});
    hero.addEventListener('pointerleave',function(){pin=false});
  }

  /* ---------- Conector RJ45 del final ---------- */
  var cab=$('#cab'),led=$('#led'),rj=$('#rj');
  cols.forEach(function(c,i){
    var d='M -300 '+(40+i*20)+' C 100 '+(40+i*20)+' 400 '+(98+i*6)+' 700 '+(98+i*6);
    mk('path',{d:d,fill:'none',stroke:c,'stroke-width':9,'stroke-linecap':'round'},cab);
    if(stripe[i])mk('path',{d:d,fill:'none',stroke:'#f6f8ff','stroke-width':3,'stroke-dasharray':'7 11','stroke-linecap':'round'},cab);
  });
  led.classList.add('on'); // sin animación el cable queda enchufado
  /* ---------- Scroll suave y animaciones atadas al scroll ---------- */
  if(!reduce&&hasG){
    gsap.registerPlugin(ScrollTrigger);
    if(window.Lenis){
      var lenis=new Lenis({lerp:.1,anchors:true});
      lenis.on('scroll',ScrollTrigger.update);
      gsap.ticker.add(function(t){lenis.raf(t*1000)});gsap.ticker.lagSmoothing(0);
    }
    // El texto de "Quién soy" se va iluminando palabra por palabra
    ScrollTrigger.create({trigger:rv,start:'top 85%',end:'bottom 55%',onUpdate:function(s){prog=s.progress;paint()}});
    // Los años pasan de contorno a relleno
    gsap.utils.toArray('.yr').forEach(function(y){
      gsap.fromTo(y,{color:'rgba(246,248,255,0)'},{color:'#f6f8ff',ease:'none',scrollTrigger:{trigger:y,start:'top 85%',end:'top 45%',scrub:true}});
    });
    gsap.fromTo('.timeline-progress',{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'.timeline',start:'top 75%',end:'bottom 60%',scrub:true}});
    // El conector se enchufa a medida que bajás; al llegar prende el LED
    gsap.set(rj,{x:-250,y:0});led.classList.remove('on');
    gsap.to(rj,{x:88,y:0,ease:'none',scrollTrigger:{trigger:'.plug',start:'top 88%',end:'top 48%',scrub:.35,
      onUpdate:function(s){window.__plugProgress=s.progress;led.classList.toggle('on',s.progress>.985)}}});
  }

  /* ---------- Pre-rendered RJ45 frames synchronized with the scroll ---------- */
  (function(){
    var fig=$('.plug');if(!fig||!('IntersectionObserver' in window))return;
    var mob=matchMedia('(max-width:820px)').matches,N=mob?36:48,pre=mob?'m':'d',base='imgs/conector/',
        imgs=[],off=new Image(),cv=document.createElement('canvas'),cx=cv.getContext('2d'),ready=false,vis=false,cur=null;
    cv.setAttribute('aria-hidden','true');
    function name(i){return base+pre+'-'+(i<10?'0':'')+i+'.webp'}
    function want(){var p=window.__plugProgress;if(p==null)p=1;return Math.max(0,Math.min(N-1,Math.round(p*(N-1))))}
    function paint(force){
      if(!ready)return;
      var i=want(),useOff=(i===N-1&&!led.classList.contains('on')),key=useOff?'off':i;
      if(!force&&key===cur)return;cur=key;
      var im=useOff?off:imgs[i],w=cv.clientWidth,dp=Math.min(2,window.devicePixelRatio||1),pw=Math.round(w*dp);
      if(!pw)return;
      if(cv.width!==pw){cv.width=pw;cv.height=Math.round(pw*im.naturalHeight/im.naturalWidth)}
      cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);
    }
    function loop(){if(!vis)return;paint();requestAnimationFrame(loop)}
    function start(){
      var left=N+1,failed=false;
      function done(){if(failed||--left)return;
        fig.appendChild(cv);fig.classList.add('pre');ready=true;paint(true);
        new MutationObserver(function(){paint()}).observe(led,{attributes:true,attributeFilter:['class']});
        addEventListener('resize',function(){paint(true)});
        new IntersectionObserver(function(e){var v=e[e.length-1].isIntersecting;if(v&&!vis){vis=true;requestAnimationFrame(loop)}else if(!v)vis=false},{rootMargin:'100px'}).observe(fig);
      }
      function bad(){failed=true}
      for(var i=N-1;i>=0;i--){var im=new Image();im.onload=done;im.onerror=bad;im.src=name(i);imgs[i]=im}
      off.onload=done;off.onerror=bad;off.src=base+pre+'-off.webp';
    }
    var io=new IntersectionObserver(function(e){if(e[e.length-1].isIntersecting){io.disconnect();start()}},{rootMargin:'900px 0px'});
    io.observe(fig);
  })();

  /* ---------- Hora en Córdoba, título de la pestaña y cable de scroll ---------- */
  var fmt=new Intl.DateTimeFormat('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Argentina/Cordoba'});
  function tick(){$('#hora').textContent=T[lang].hora.replace('{t}',fmt.format(new Date()))}
  setInterval(tick,30000);
  var back;document.addEventListener('visibilitychange',function(){
    clearTimeout(back);
    if(document.hidden){document.title=T[lang].away}
    else{document.title=T[lang].back;back=setTimeout(function(){document.title=T[lang].title},1800)}
  });
  var bar=$('#run i');
  function sc(){var m=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleY('+(m>0?scrollY/m:0)+')'}
  addEventListener('scroll',sc,{passive:true});sc();

  var saved=null;try{saved=localStorage.getItem('lang')}catch(e){}
  setLang(saved||((navigator.language||'es').slice(0,2)==='es'?'es':'en'));
})();
