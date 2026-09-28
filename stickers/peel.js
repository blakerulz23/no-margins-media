/* A cylindrical fold: the printed surface and reverse are rendered in strips.
   Each strip follows the same continuous fold, rather than overlaying a flap. */
(() => {
  const stage = document.querySelector('#stage');
  const thumbs = [...document.querySelectorAll('.thumb')];
  const names = thumbs.map(b => b.getAttribute('aria-label'));
  const hint = document.querySelector('#hint');
  document.querySelector('#stickerWrap').hidden = true;
  document.querySelector('.shadow').hidden = true;
  hint.textContent = 'Pull an edge across the sticker to peel · release early to stick it back';
  Object.assign(hint.style, {fontSize:'12px', letterSpacing:'.02em', whiteSpace:'normal', width:'90%', textAlign:'center'});
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Peelable sticker. Drag an edge inward, or use the design buttons.');
  Object.assign(canvas.style,{width:'100%',height:'100%',position:'absolute',inset:'0',touchAction:'none',cursor:'grab'});
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const N = 800, R = N/2, STRIP = 2;
  const texture = () => { const c=document.createElement('canvas'); c.width=c.height=N; return c; };
  const oriented = texture(), reverse = texture();
  const textures = [];
  let index=0, next=1, angle=-Math.PI/4, depth=0, target=0;
  let phase='idle', pointer=null, width=0,height=0, size=0, cx=0,cy=0;
  let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reduced=paused, deadline=Infinity, raf=0, last=0, ready=false;
  const play=document.querySelector('#play'), icon=document.querySelector('#playIcon');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function ui() {
    document.querySelector('#title').textContent=names[index];
    document.querySelector('#counter').textContent=`${String(index+1).padStart(2,'0')} / 06 · Peelable vinyl`;
    thumbs.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',String(i===index));});
    play.setAttribute('aria-pressed',String(paused));
    play.setAttribute('aria-label',paused?'Play automatic peeling':'Pause automatic peeling');
    icon.setAttribute('d',paused?'M7 4.5v15L19.5 12z':'M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z');
  }
  function prepare() {
    const p=oriented.getContext('2d');p.clearRect(0,0,N,N);
    p.save();p.translate(R,R);p.rotate(-angle);p.drawImage(textures[index],-R,-R);p.restore();
    const b=reverse.getContext('2d');b.clearRect(0,0,N,N);
    b.save();b.beginPath();b.arc(R,R,R-1,0,Math.PI*2);b.clip();
    b.fillStyle='#eeeae0';b.fillRect(0,0,N,N);
    b.translate(R,R);b.rotate(-angle);
    b.fillStyle='rgba(80,76,70,.16)';b.font='bold 17px sans-serif';b.textAlign='center';
    for(let y=-400;y<450;y+=85) for(let x=-440;x<450;x+=230) b.fillText('NO MARGINS MEDIA',x+(Math.round(y/85)%2)*70,y);
    b.restore();
  }
  // Orthographic projection of a cylindrical bend. A slight height offset
  // makes its lift visible while keeping the artwork on the curled sheet.
  function fold(u, line, radius) {
    const s=Math.max(0,u-line), t=Math.min(Math.PI,s/radius);
    if(u<=line)return {x:u,z:0,cos:1};
    return {x:line+radius*Math.sin(t)-Math.max(0,s-Math.PI*radius),z:radius*(1-Math.cos(t)),cos:Math.cos(t)};
  }
  function render() {
    ctx.clearRect(0,0,width,height);
    if(!ready)return;
    const scale=size/N;
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
    ctx.shadowColor='rgba(30,20,45,.20)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
    ctx.drawImage(textures[next],-R,-R);ctx.shadowColor='transparent';
    ctx.rotate(angle);
    const line=R-depth, radius=clamp(depth*.08,7,25);
    // Still-adhered part, clipped at the moving fold line.
    ctx.save();ctx.beginPath();ctx.rect(-R,-R,clamp(line+R,0,N),N);ctx.clip();
    ctx.drawImage(oriented,-R,-R);ctx.restore();
    const strips=[];
    for(let u=Math.max(-R,line);u<R;u+=STRIP) {
      const end=Math.min(R,u+STRIP), mid=(u+end)/2;
      const a=fold(u,line,radius),b=fold(end,line,radius),m=fold(mid,line,radius);
      strips.push({u,end,a,b,m});
    }
    // Painter ordering: higher pieces cover lower ones. Backside strips
    // move back over the remaining print as the fold passes 90 degrees.
    strips.sort((a,b)=>a.m.z-b.m.z || a.u-b.u);
    for(const {u,end,a,b,m} of strips) {
      const dx=Math.min(a.x,b.x), dw=Math.max(.12,Math.abs(b.x-a.x));
      const half=Math.sqrt(Math.max(0,R*R-((u+end)/2)**2));
      if(!half)continue;
      const yy=-m.z*.18;
      // Narrow contact shadow underneath the raised film.
      if(m.z>2) {
        ctx.fillStyle=`rgba(20,15,25,${.06*Math.min(1,m.z/25)})`;
        ctx.fillRect(dx+3,-half+3,dw+2,half*2);
      }
      ctx.drawImage(m.cos<0?reverse:oriented,u+R,0,end-u,N,dx,yy-R,dw+.6,N);
      const shade=.27*(1-Math.abs(m.cos));
      ctx.fillStyle=`rgba(32,28,38,${shade})`;
      ctx.fillRect(dx,yy-half,dw+.6,half*2);
      if(m.cos>0 && m.cos<.9) {
        ctx.fillStyle=`rgba(255,255,255,${.27*Math.sin(Math.acos(m.cos)*2)})`;
        ctx.fillRect(dx,yy-half,dw+.6,half*2);
      }
    }
    ctx.restore();
  }
  function wake(){if(!raf)raf=requestAnimationFrame(tick);}
  function tick(t) {
    raf=0;const dt=Math.min(50,t-(last||t));last=t;
    if(pointer) {
      // Resist outward motion; resealing follows the hand more firmly.
      depth+=(target-depth)*(1-Math.exp(-dt/(target>depth?55:30)));
    } else if(phase!=='idle') {
      if(phase==='out') {
        // Adhesive releases progressively, rather than jumping ahead on release.
        const speed=.48+1.8*Math.pow(clamp(depth/N,0,1),3);
        depth+=Math.min(speed*dt,(target-depth)*(1-Math.exp(-dt/80)));
      } else depth+=(target-depth)*(1-Math.exp(-dt/65));
      if(Math.abs(target-depth)<.7) {
        depth=target;
        if(phase==='out') {index=next;next=(index+1)%6;depth=target=0;prepare();ui();}
        phase='idle';deadline=t+4200;
      }
    }
    if(!paused && !pointer && phase==='idle' && t>deadline) peelTo((index+1)%6);
    render();
    if(!paused||phase!=='idle'||pointer)wake();
  }
  function peelTo(i) {
    if(!ready||i===index||phase==='out')return;
    next=i;
    if(reduced){index=i;next=(i+1)%6;depth=target=0;phase='idle';prepare();ui();render();deadline=performance.now()+4200;return;}
    if(!pointer && depth<1){angle=-Math.PI/4;prepare();}
    phase='out';target=N+180;wake();
  }
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    size=Math.min(width*.83,height*.61,620);cx=width/2;cy=height*.46;render();
  }
  const point=e=>{const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left-cx)*N/size,y:(e.clientY-b.top-cy)*N/size};};
  canvas.addEventListener('pointerdown',e=>{
    if(!ready||phase==='out'||(e.button!==0&&e.pointerType==='mouse'))return;
    const p=point(e), distance=Math.hypot(p.x,p.y);
    if(distance>R+35||distance<R*.64)return;
    angle=Math.atan2(p.y,p.x);prepare();
    pointer={id:e.pointerId,start:p.x*Math.cos(angle)+p.y*Math.sin(angle)};
    depth=target=0;phase='drag';canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';wake();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointer||pointer.id!==e.pointerId)return;
    const p=point(e), along=p.x*Math.cos(angle)+p.y*Math.sin(angle);
    // Small movements remain attached. Larger pulls travel less than the hand.
    target=clamp(Math.max(0,pointer.start-along-22)*.48,0,N+100);wake();
  });
  function release(e,cancelled=false){
    if(!pointer||pointer.id!==e.pointerId)return;
    pointer=null;canvas.style.cursor='grab';
    if(!cancelled&&depth>N*.40)peelTo((index+1)%6);
    else {phase='return';target=0;wake();}
  }
  canvas.addEventListener('pointerup',e=>release(e));
  canvas.addEventListener('pointercancel',e=>release(e,true));
  thumbs.forEach((b,i)=>b.addEventListener('click',()=>peelTo(i)));
  play.addEventListener('click',()=>{paused=!paused;ui();deadline=performance.now()+4200;wake();});
  addEventListener('keydown',e=>{
    if(e.key==='ArrowRight')peelTo((index+1)%6);
    if(e.key==='ArrowLeft')peelTo((index+5)%6);
    if(e.key===' '&&e.target===document.body){e.preventDefault();play.click();}
  });
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;deadline=performance.now()+4200;wake();}});
  resize();ui();
  Promise.all(thumbs.map(b=>new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      const c=texture(),p=c.getContext('2d');p.beginPath();p.arc(R,R,R-1,0,Math.PI*2);p.clip();
      // Original JPEGs have a circle diameter ~98.7% of image width.
      const diameter=img.naturalWidth*.987;
      p.drawImage(img,(img.naturalWidth-diameter)/2,(img.naturalHeight-diameter)/2,diameter,diameter,0,0,N,N);resolve(c);
    };img.onerror=reject;img.src=b.querySelector('img').getAttribute('src');
  }))).then(images=>{textures.push(...images);ready=true;prepare();deadline=performance.now()+2500;render();wake();}).catch(()=>{hint.textContent='Artwork could not load. Please refresh the page.';});
})();
