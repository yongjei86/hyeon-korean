// v18: calibrate tracing centerlines to the actual NanumBarunGothic glyph
// and compact the PWA UI so Galaxy tablets show the whole app on one screen.
(() => {
  const originalPaths = paths;
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', {willReadFrequently:true});
  const cache = new Map();

  const style = document.createElement('style');
  style.textContent = `
    html,body{height:100%;overflow:hidden!important}
    .app{height:100dvh!important;width:min(100%,900px)!important;padding:max(6px,env(safe-area-inset-top)) 10px max(6px,env(safe-area-inset-bottom))!important;display:grid!important;grid-template-rows:auto auto auto minmax(0,1fr)!important;gap:5px!important}
    .top{min-height:34px!important}.top h1{font-size:clamp(19px,4vw,29px)!important;margin:0!important;line-height:1.05!important}.stars{font-size:16px!important;padding:4px 8px!important}
    .tabs{margin:0!important;gap:6px!important}.tab{padding:7px 5px!important;font-size:15px!important;border-radius:12px!important}
    .letters{padding:1px 2px 4px!important;gap:5px!important}.letterBtn{min-width:47px!important;height:44px!important;font-size:27px!important;border-radius:13px!important}
    .card{min-height:0!important;padding:7px 9px!important;border-radius:21px!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto auto!important;gap:4px!important}
    .prompt{min-height:50px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}.big{font-size:clamp(50px,9vh,82px)!important;line-height:1!important}.sub{font-size:15px!important;margin:0!important}
    .canvasWrap{min-height:0!important;height:100%!important;width:min(100%,560px)!important;max-height:none!important;aspect-ratio:auto!important;justify-self:center!important;border-width:3px!important;border-radius:18px!important}
    .status{min-height:21px!important;padding-top:1px!important;font-size:14px!important}.controls{grid-template-columns:repeat(4,1fr)!important;gap:6px!important;margin-top:0!important}.action{padding:8px 5px!important;font-size:14px!important;border-radius:13px!important}.tip{display:none!important}
    @media(max-width:600px){.app{padding-left:7px!important;padding-right:7px!important}.letterBtn{min-width:42px!important;height:40px!important;font-size:24px!important}.controls{grid-template-columns:repeat(2,1fr)!important}.prompt{min-height:44px!important}.big{font-size:46px!important}.action{padding:7px 5px!important;font-size:13px!important}}
    @media(max-height:760px){.top h1{font-size:19px!important}.stars{font-size:13px!important}.tab{padding:5px!important}.letterBtn{height:37px!important;min-width:40px!important;font-size:23px!important}.prompt{min-height:40px!important}.big{font-size:43px!important}.sub{font-size:13px!important}.status{font-size:12px!important}.action{padding:6px 4px!important;font-size:12px!important}}
    @media(orientation:landscape) and (min-width:700px){.app{grid-template-columns:160px minmax(0,1fr)!important;grid-template-rows:auto auto minmax(0,1fr)!important;max-width:1200px!important}.top{grid-column:1/3!important}.tabs{grid-column:1/2!important;flex-direction:column!important}.letters{grid-column:1/2!important;grid-row:3/4!important;flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.letterBtn{width:100%!important}.card{grid-column:2/3!important;grid-row:2/4!important}.canvasWrap{width:min(100%,650px)!important}}
  `;
  document.head.appendChild(style);

  function alpha(data,W,x,y){
    x=Math.round(x); y=Math.round(y);
    if(x<0||y<0||x>=W||y>=maskCanvas.height) return 0;
    return data[(y*W+x)*4+3];
  }

  function glyphMetrics(char,w,h){
    maskCanvas.width=Math.max(1,Math.round(w));
    maskCanvas.height=Math.max(1,Math.round(h));
    const W=maskCanvas.width,H=maskCanvas.height;
    maskCtx.clearRect(0,0,W,H);
    const size=Math.floor(Math.min(w,h)*(mode==='syllable'?0.67:0.72));
    maskCtx.fillStyle='#000';
    maskCtx.font=`700 ${size}px NBG`;
    maskCtx.textAlign='center';
    maskCtx.textBaseline='middle';
    const baseline=H*(mode==='syllable'?0.51:0.515);
    maskCtx.fillText(char,W/2,baseline);
    const data=maskCtx.getImageData(0,0,W,H).data;
    let minX=W,minY=H,maxX=-1,maxY=-1;
    const runs=[];
    for(let y=0;y<H;y++){
      let run=0;
      for(let x=0;x<W;x++){
        if(alpha(data,W,x,y)>35){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);run++;}
        else if(run){if(run<Math.max(W,H)*.30)runs.push(run);run=0;}
      }
      if(run&&run<Math.max(W,H)*.30)runs.push(run);
    }
    for(let x=0;x<W;x++){
      let run=0;
      for(let y=0;y<H;y++){
        if(alpha(data,W,x,y)>35)run++;
        else if(run){if(run<Math.max(W,H)*.30)runs.push(run);run=0;}
      }
      if(run&&run<Math.max(W,H)*.30)runs.push(run);
    }
    if(maxX<0)return{minX:W*.2,maxX:W*.8,minY:H*.2,maxY:H*.8,t:Math.min(W,H)*.08,size,baseline};
    runs.sort((a,b)=>a-b);
    let t=runs.length?runs[Math.floor(runs.length*.5)]:Math.min(maxX-minX,maxY-minY)*.12;
    t=Math.max(Math.min(W,H)*.035,Math.min(t,Math.min(W,H)*.14));
    return{minX,maxX,minY,maxY,t,size,baseline};
  }

  function fittedPaths(){
    const r=guide.getBoundingClientRect();
    const raw=originalPaths();
    if(!r.width||!r.height||!raw||!raw.length)return raw;
    const key=`${mode}|${cur()[0]}|${Math.round(r.width)}x${Math.round(r.height)}`;
    if(cache.has(key))return cache.get(key);
    const m=glyphMetrics(cur()[0],r.width,r.height);
    const pts=raw.flat();
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    const rx0=Math.min(...xs),rx1=Math.max(...xs),ry0=Math.min(...ys),ry1=Math.max(...ys);
    const insetX=m.t*.52,insetY=m.t*.52;
    const tx0=m.minX+insetX,tx1=m.maxX-insetX,ty0=m.minY+insetY,ty1=m.maxY-insetY;
    const fitted=raw.map(st=>st.map(([x,y])=>[
      ((tx0+(x-rx0)/(rx1-rx0||1)*(tx1-tx0))/r.width)*100,
      ((ty0+(y-ry0)/(ry1-ry0||1)*(ty1-ty0))/r.height)*100
    ]));
    cache.set(key,fitted);
    return fitted;
  }

  // Every existing tracing subsystem (guide, hit testing, completion sampling and snapping)
  // calls paths(), so replacing it here makes all of them use the same font-calibrated route.
  paths = fittedPaths;

  function paintCalibratedGuide(){
    const r=guide.getBoundingClientRect();
    g.clearRect(0,0,r.width,r.height);
    if(!r.width||!r.height)return;

    // Very faint real glyph underneath. This makes visual alignment obvious without
    // changing the actual tracing route.
    const m=glyphMetrics(cur()[0],r.width,r.height);
    g.save();
    g.globalAlpha=.055;
    g.fillStyle='#8f857c';
    g.font=`700 ${m.size}px NBG`;
    g.textAlign='center';g.textBaseline='middle';
    g.fillText(cur()[0],r.width/2,m.baseline);
    g.restore();

    const ps=paths();
    ps.forEach((st,si)=>{
      const active=si===currentStroke&&!completed;
      g.strokeStyle=active?'#9f958b':'#ddd5cd';
      g.lineWidth=Math.max(9,r.width*.027);
      g.lineCap='round';g.lineJoin='round';g.setLineDash([2,15]);
      g.beginPath();
      st.forEach((p,i)=>{const q=px(p,r);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y)});
      g.stroke();g.setLineDash([]);
      const s=px(st[0],r);
      g.fillStyle=active?'#ffd54f':'#ece6df';g.strokeStyle=active?'#d29a00':'#d8d0c8';g.lineWidth=2;
      g.beginPath();g.arc(s.x,s.y,active?9:6,0,Math.PI*2);g.fill();g.stroke();
      const bx=s.x+(s.x<r.width/2?24:-24),by=s.y+(s.y<r.height/2?24:-24);
      g.fillStyle=active?'#ff805d':'#d7cfc7';g.strokeStyle='#fff';g.lineWidth=3;
      g.beginPath();g.arc(bx,by,active?15:12,0,Math.PI*2);g.fill();g.stroke();
      g.fillStyle='#fff';g.font=`800 ${Math.max(14,r.width*.041)}px NBG`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(si+1),bx,by+1);
      if(active&&st.length>1)arrow(px(st[0],r),px(st[1],r),r);
    });
  }

  function apply(){
    guidePaint=paintCalibratedGuide;
    cache.clear();
    setTimeout(()=>{try{resize();}catch(e){try{guidePaint();}catch(_){}}},30);
  }
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(apply);else setTimeout(apply,120);
  window.addEventListener('resize',()=>cache.clear());
})();
