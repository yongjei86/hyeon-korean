(() => {
  const style = document.createElement('style');
  style.textContent = `
    @font-face{font-family:"HyeonNanumBarun";src:url("./fonts/NanumBarunGothic.otf") format("opentype");font-weight:400;font-style:normal;font-display:block}
    .letterBtn{font-family:"HyeonNanumBarun",sans-serif!important;font-size:31px!important;font-weight:400!important;padding:0!important}
    .letterBtn svg{display:none!important}
    .big{font-family:"HyeonNanumBarun",sans-serif!important;font-size:100px!important;font-weight:400!important;height:auto!important;line-height:1.15!important}
    .big svg{display:none!important}
  `;
  document.head.appendChild(style);

  // 실제 나눔바른고딕 자모와 비슷한 중심선에 맞춘 따라쓰기 경로
  Object.assign(jamoPaths, {
    "ㄱ":[[[24,24],[76,24],[76,78]]],
    "ㄴ":[[[26,22],[26,78],[76,78]]],
    "ㄷ":[[[24,24],[76,24]],[[24,24],[24,78],[76,78]],[[76,24],[76,78]]],
    "ㄹ":[[[24,22],[76,22],[76,42],[40,42]],[[40,42],[40,60],[76,60],[76,78]],[[76,78],[24,78]]],
    "ㅁ":[[[24,24],[76,24]],[[24,24],[24,78],[76,78]],[[76,24],[76,78]]],
    "ㅂ":[[[28,22],[28,78]],[[72,22],[72,78]],[[28,26],[72,26]],[[28,50],[72,50]],[[28,76],[72,76]]],
    "ㅅ":[[[50,22],[28,78]],[[50,22],[72,78]]],
    "ㅇ":[[[50,22],[66,27],[76,41],[76,59],[66,73],[50,78],[34,73],[24,59],[24,41],[34,27],[50,22]]],
    "ㅈ":[[[28,26],[72,26]],[[50,26],[28,78]],[[50,26],[72,78]]],
    "ㅊ":[[[39,17],[61,17]],[[28,34],[72,34]],[[50,34],[28,80]],[[50,34],[72,80]]],
    "ㅋ":[[[28,22],[28,78]],[[28,30],[74,30]],[[28,54],[74,54]]],
    "ㅌ":[[[24,22],[76,22]],[[24,22],[24,78],[76,78]],[[76,22],[76,78]],[[24,50],[76,50]]],
    "ㅍ":[[[24,24],[76,24]],[[38,24],[38,78]],[[62,24],[62,78]],[[24,78],[76,78]]],
    "ㅎ":[[[38,17],[62,17]],[[28,34],[72,34]],[[50,47],[65,52],[72,64],[66,76],[50,81],[34,76],[28,64],[35,52],[50,47]]],
    "ㅏ":[[[44,16],[44,84]],[[44,50],[72,50]]],
    "ㅑ":[[[44,16],[44,84]],[[44,40],[72,40]],[[44,60],[72,60]]],
    "ㅓ":[[[56,16],[56,84]],[[28,50],[56,50]]],
    "ㅕ":[[[56,16],[56,84]],[[28,40],[56,40]],[[28,60],[56,60]]],
    "ㅗ":[[[20,62],[80,62]],[[50,22],[50,62]]],
    "ㅛ":[[[20,64],[80,64]],[[40,24],[40,64]],[[60,24],[60,64]]],
    "ㅜ":[[[20,38],[80,38]],[[50,38],[50,78]]],
    "ㅠ":[[[20,36],[80,36]],[[40,36],[40,76]],[[60,36],[60,76]]],
    "ㅡ":[[[18,50],[82,50]]],
    "ㅣ":[[[50,14],[50,86]]]
  });

  renderLetters = function(){
    lettersEl.innerHTML="";
    sets[mode].forEach((it,i)=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="letterBtn"+(i===idx?" active":"");
      b.textContent=it[0];
      b.setAttribute("aria-label",it[1]);
      b.addEventListener("click",()=>{ idx=i; update(); resetLetter(); });
      lettersEl.appendChild(b);
    });
  };

  update = function(){
    bigLetter.textContent=current()[0];
    soundText.textContent=current()[1];
    renderLetters();
    paintGuide();
    requestAnimationFrame(()=>{
      const a=lettersEl.querySelector(".active");
      if(a) a.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
    });
  };

  paintGuide = function(){
    const r=guide.getBoundingClientRect();
    g.clearRect(0,0,r.width,r.height);

    // 사용자가 준 나눔바른고딕 실제 자모를 연한 바탕 글자로 표시
    g.save();
    const ch=current()[0];
    const fontSize = mode === "syllable" ? r.width*0.58 : r.width*0.68;
    g.font=`400 ${Math.floor(fontSize)}px HyeonNanumBarun`;
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillStyle="#f0ede8";
    g.fillText(ch,r.width/2,r.height/2+r.height*0.025);
    g.restore();

    const all=currentPaths();
    all.forEach((stroke,si)=>{
      const active=(si===currentStroke && !completed);
      g.lineWidth=Math.max(10,r.width*0.027);
      g.strokeStyle=active ? "#aaa198" : "#e0dad3";
      g.lineCap="round";
      g.lineJoin="round";
      g.setLineDash(active ? [3,18] : [3,17]);
      g.beginPath();
      stroke.forEach((p,i)=>{
        const q=toPx(p,r);
        i ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y);
      });
      g.stroke();
      g.setLineDash([]);

      const start=toPx(stroke[0],r);
      g.fillStyle=active ? "#ffd54f" : "#f0ebe5";
      g.strokeStyle=active ? "#d29a00" : "#d8d1cb";
      g.lineWidth=3;
      g.beginPath(); g.arc(start.x,start.y,active?11:7,0,Math.PI*2); g.fill(); g.stroke();

      const offsetX=start.x<r.width/2?31:-31;
      const offsetY=start.y<r.height/2?31:-31;
      const bx=start.x+offsetX,by=start.y+offsetY;
      g.fillStyle=active?"#ff8a65":"#d9d2cb";
      g.strokeStyle="#fff"; g.lineWidth=4;
      g.beginPath(); g.arc(bx,by,active?17:14,0,Math.PI*2); g.fill(); g.stroke();
      g.font=`900 ${Math.max(17,Math.floor(r.width*0.048))}px sans-serif`;
      g.textAlign="center"; g.textBaseline="middle"; g.fillStyle="#fff";
      g.fillText(String(si+1),bx,by+1);
      if(active&&stroke.length>1){
        const p0=toPx(stroke[0],r),p1=toPx(stroke[1],r);
        drawArrow(p0,p1,"#ff6f47");
      }
    });
  };

  const apply = async () => {
    try { await document.fonts.load('40px HyeonNanumBarun'); } catch(e) {}
    update();
    resetLetter();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
})();