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
      copyBtn=$('#copy-email'),copyStatus=$('#copy-status'),copyTimer,phoneCards=[].slice.call(document.querySelectorAll('.phone-card'));
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
    var a=from.getBoundingClientRect(),b=to.getBoundingClientRect?to.getBoundingClientRect():to,dot=document.createElement('i');dot.className='travel-node'+(toCloud?' to-cloud':'');
    dot.style.left=(a.left+a.width/2)+'px';dot.style.top=(a.top+a.height/2)+'px';dot.style.transitionDelay=(delay||0)+'ms';document.body.appendChild(dot);
    requestAnimationFrame(function(){dot.style.left=(b.left+b.width/2)+'px';dot.style.top=(b.top+b.height/2)+'px'});
    setTimeout(function(){dot.remove();done()},800+(delay||0));
  }
  function nextLocalSlot(){var r=localQueue.getBoundingClientRect(),i=pendingNodes;return{left:r.left+(i%4)*11,top:r.top+Math.floor(i/4)*11,width:7,height:7}}
  function saveOfflineNode(){
    if(networkState!=='offline'||pendingNodes+inFlight>=8)return;
    inFlight++;var target=nextLocalSlot();
    flyNode(phoneNode,target,false,0,function(){inFlight--;if(pendingNodes<8){var dot=document.createElement('i');dot.className='queued-dot';dot.setAttribute('aria-hidden','true');localQueue.appendChild(dot);pendingNodes++}renderOfflineState();if(networkState==='sync'&&inFlight===0)syncQueuedNodes()});
  }
  function finishSync(){cloudNode.classList.remove('is-receiving');networkState='done';renderOfflineState();networkTimer=setTimeout(function(){networkState='online';renderOfflineState()},2200)}
  function syncQueuedNodes(){
    if(networkState!=='sync'||inFlight||syncStarted)return;syncStarted=true;var queued=[].slice.call(localQueue.querySelectorAll('.queued-dot'));
    if(!queued.length){finishSync();return}cloudNode.classList.add('is-receiving');var left=queued.length;
    queued.forEach(function(dot,i){flyNode(dot,cloudNode,true,i*45,function(){dot.remove();pendingNodes--;left--;renderOfflineState();if(!left)finishSync()})});
  }
  function startOffline(){clearTimeout(networkTimer);clearInterval(offlineTicker);networkState='offline';syncStarted=false;renderOfflineState();saveOfflineNode();offlineTicker=setInterval(saveOfflineNode,1050)}
  function startSync(){clearInterval(offlineTicker);networkState='sync';renderOfflineState();if(!inFlight)syncQueuedNodes()}
  networkToggle.addEventListener('click',function(){if(networkState==='offline')startSync();else if(networkState==='online'||networkState==='done')startOffline()});
  function copyResult(ok){clearTimeout(copyTimer);copyStatus.textContent=lang==='es'?(ok?'Copiado':'No se pudo copiar'):(ok?'Copied':'Could not copy');if(ok)pulseLed();copyTimer=setTimeout(function(){copyStatus.textContent=''},1800)}
  function fallbackCopy(){var field=document.createElement('textarea');field.value='matiasgalli20@gmail.com';field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}field.remove();copyResult(ok)}
  copyBtn.addEventListener('click',function(){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText('matiasgalli20@gmail.com').then(function(){copyResult(true)},fallbackCopy);else fallbackCopy()});
  var finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  var phoneZone=$('.phones'),phoneTimer;
  function tiltPhones(e){phoneCards.forEach(function(card){var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.setProperty('--rx',((.5-y)*12).toFixed(1)+'deg');card.style.setProperty('--ry',((x-.5)*14).toFixed(1)+'deg');card.style.setProperty('--shine-x',(x*100).toFixed(1)+'%');card.style.setProperty('--shine-y',(y*100).toFixed(1)+'%');card.style.setProperty('--glare','.8')})}
  function resetPhones(){phoneCards.forEach(function(card){card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');card.style.setProperty('--glare','0')})}
  phoneZone.addEventListener('pointermove',function(e){if(e.pointerType!=='touch')tiltPhones(e)});phoneZone.addEventListener('pointerleave',resetPhones);
  phoneZone.addEventListener('pointerdown',function(e){if(e.pointerType!=='touch')return;clearTimeout(phoneTimer);tiltPhones(e);phoneTimer=setTimeout(resetPhones,850)});
  function splitRv(){
    if(!rv||reduce||!hasG)return;
    rv.innerHTML=rv.textContent.split(' ').map(function(w){return '<span>'+w+'</span>'}).join(' ');
    words=[].slice.call(rv.querySelectorAll('span'));paint();
  }
  function paint(){var n=prog*(words.length+3);words.forEach(function(w,i){w.style.opacity=Math.max(.2,Math.min(1,n-i))})}
  function setLang(l){
    lang=l;document.documentElement.lang=l;
    els.forEach(function(e){e.textContent=l==='en'?e.dataset.en:e.dataset.es});
    $('#lang').textContent=T[l].btn;updateThemeButton();renderOfflineState();document.title=T[l].title;tick();splitRv();
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
  var cab=$('#cab'),led=$('#led'),rj=$('#rj'),ledTimer;
  function pulseLed(){clearTimeout(ledTimer);led.classList.remove('on');ledTimer=setTimeout(function(){led.classList.add('on')},130)}
  cols.forEach(function(c,i){
    var d='M -300 '+(40+i*20)+' C 100 '+(40+i*20)+' 400 '+(98+i*6)+' 700 '+(98+i*6);
    mk('path',{d:d,fill:'none',stroke:c,'stroke-width':9,'stroke-linecap':'round'},cab);
    if(stripe[i])mk('path',{d:d,fill:'none',stroke:'#f6f8ff','stroke-width':3,'stroke-dasharray':'7 11','stroke-linecap':'round'},cab);
  });
  led.classList.add('on'); // sin animación el cable queda enchufado
  document.querySelector('#mail').addEventListener('pointerenter',pulseLed);

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
      onUpdate:function(s){led.classList.toggle('on',s.progress>.985)}}});
  }

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
