// Font-shaped tracing guide patch: keeps example glyphs as real NanumBarunGothic text
// and renders only the tracing guide from the actual font silhouette.
(() => {
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', {willReadFrequently:true});

  function glyphMask(char, w, h) {
    maskCanvas.width = Math.max(1, Math.round(w));
    maskCanvas.height = Math.max(1, Math.round(h));
    maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
    const size = Math.floor(Math.min(w,h) * (mode === 'syllable' ? 0.67 : 0.72));
    maskCtx.fillStyle = '#000';
    maskCtx.font = `700 ${size}px NBG`;
    maskCtx.textAlign = 'center';
    maskCtx.textBaseline = 'middle';
    // isolated jamo in NanumBarunGothic sits a little high; this visually centers it.
    const y = h * (mode === 'syllable' ? 0.51 : 0.515);
    maskCtx.fillText(char, w/2, y);
    return maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
  }

  function paintFontDots() {
    const r = guide.getBoundingClientRect();
    g.clearRect(0,0,r.width,r.height);
    if (!r.width || !r.height) return;

    const data = glyphMask(cur()[0], r.width, r.height);
    const W = maskCanvas.width, H = maskCanvas.height;
    const step = Math.max(12, Math.round(r.width * 0.034));
    const rad = Math.max(3.5, step * 0.30);

    g.fillStyle = '#d6d0c9';
    for (let y = Math.round(step/2); y < H; y += step) {
      for (let x = Math.round(step/2); x < W; x += step) {
        const a = data[(y*W+x)*4+3];
        if (a > 90) {
          g.beginPath();
          g.arc(x,y,rad,0,Math.PI*2);
          g.fill();
        }
      }
    }

    // Preserve the existing educational stroke-order cue, but do not use its
    // crude polyline as the visible letter shape.
    const ps = paths();
    ps.forEach((st,si) => {
      const active = si === currentStroke && !completed;
      const s = px(st[0], r);
      const bx = s.x + (s.x < r.width/2 ? 34 : -34);
      const by = s.y + (s.y < r.height/2 ? 34 : -34);

      g.fillStyle = active ? '#ffd54f' : '#eee8e2';
      g.strokeStyle = active ? '#d29a00' : '#ddd5cd';
      g.lineWidth = 2.5;
      g.beginPath(); g.arc(s.x,s.y,active?11:7,0,Math.PI*2); g.fill(); g.stroke();

      g.fillStyle = active ? '#ff805d' : '#d8d0c8';
      g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.arc(bx,by,active?18:14,0,Math.PI*2); g.fill(); g.stroke();
      g.fillStyle='#fff';
      g.font=`800 ${Math.max(17,r.width*.05)}px NBG`;
      g.textAlign='center'; g.textBaseline='middle';
      g.fillText(String(si+1),bx,by+1);

      if(active && st.length>1) arrow(px(st[0],r),px(st[1],r),r);
    });
  }

  function applyPatch() {
    // Override only the tracing-guide painter. Selector and large example text
    // remain untouched and therefore keep the exact NanumBarunGothic glyph.
    guidePaint = paintFontDots;
    guidePaint();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(applyPatch);
  } else {
    setTimeout(applyPatch, 100);
  }
})();
