
(function(){
  /*** State ***/
  const itemsEl = document.getElementById('items');
  const fieldCountEl = document.getElementById('fieldCount');
  const applyCountBtn = document.getElementById('applyCount');
  const addItemBtn = document.getElementById('addItem');
  const clearAllBtn = document.getElementById('clearAll');

  const fontSelect = document.getElementById('fontSelect');
  const fontFile = document.getElementById('fontFile');

  const spinSoundInput = document.getElementById('spinSound');
  const winSoundInput  = document.getElementById('winSound');
  const spinVol = document.getElementById('spinVol');
  const winVol  = document.getElementById('winVol');
  const spinVolLbl = document.getElementById('spinVolLbl');
  const winVolLbl  = document.getElementById('winVolLbl');

  const confettiCanvas = document.getElementById('confettiCanvas');
  const mkCanvas = document.getElementById('mkCanvas');
  const overlay = document.getElementById('overlay');
  const winnerTitle = document.getElementById('winnerTitle');
  const winnerText = document.getElementById('winnerText');
  const winnerImage = document.getElementById('winnerImage');

  const bigSpin = document.getElementById('bigSpin');
  const spinBtn = document.getElementById('spinBtn');
  const toggleMute = document.getElementById('toggleMute');

  const cfx = confettiCanvas.getContext('2d');
  const mkx = mkCanvas.getContext('2d');

  let prizes = []; // { type: 'text'|'image', text?:string, img?:Image, imgURL?:string }
  let spinAudio = null;
  let winAudio = null;

  /*** Helpers ***/
  function resizeCanvases(){
    const rect = mkCanvas.parentElement.getBoundingClientRect();
    confettiCanvas.width = rect.width;
    confettiCanvas.height = rect.height;
    mkCanvas.width = rect.width;
    mkCanvas.height = rect.height;
  }
  window.addEventListener('resize', resizeCanvases);

  function createDefaultPrizes(n){
    prizes = [];
    itemsEl.innerHTML = '';
    for (let i=0; i<n; i++){
      addPrizeRow({type:'text', text:`Gewinn ${i+1}`});
    }
  }

  function addPrizeRow(initial){
    const idx = prizes.length;
    const row = document.createElement('div');
    row.className = 'item';
    row.dataset.index = idx;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.textContent = 'Kein Bild';
    row.appendChild(thumb);

    const middle = document.createElement('div');
    const typeSel = document.createElement('select');
    typeSel.innerHTML = `<option value="text">Text</option><option value="image">Bild</option>`;
    typeSel.value = initial?.type || 'text';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Gewinn-Text';
    textInput.value = initial?.text || '';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = (typeSel.value==='image')?'block':'none';

    const small = document.createElement('div');
    small.className='small';
    small.textContent = 'Tipp: Bei Bildern wird der Text ignoriert.';

    middle.appendChild(typeSel);
    middle.appendChild(textInput);
    middle.appendChild(fileInput);
    middle.appendChild(small);

    const right = document.createElement('div');
    right.style.display='flex';
    right.style.flexDirection='column';
    right.style.gap='8px';
    const delBtn = document.createElement('button');
    delBtn.className='btn danger';
    delBtn.textContent='Entfernen';
    right.appendChild(delBtn);

    row.appendChild(middle);
    row.appendChild(right);
    itemsEl.appendChild(row);

    const prize = {type:typeSel.value, text:textInput.value||`Gewinn ${idx+1}`};
    prizes.push(prize);

    function refreshThumb(){
      if (prize.type==='image' && prize.img){
        thumb.innerHTML='';
        const im = document.createElement('img');
        im.src = prize.img.src;
        thumb.appendChild(im);
      } else {
        thumb.textContent = 'Kein Bild';
      }
    }

    typeSel.addEventListener('change', ()=>{
      prize.type = typeSel.value;
      fileInput.style.display = (prize.type==='image')?'block':'none';
      refreshThumb();
    });

    textInput.addEventListener('input', ()=>{
      prize.text = textInput.value;
    });

    fileInput.addEventListener('change', ()=>{
      const f = fileInput.files?.[0];
      if (!f) { prize.img = null; prize.imgURL = null; refreshThumb(); return; }
      const url = URL.createObjectURL(f);
      const image = new Image();
      image.onload = ()=>{ prize.img=image; prize.imgURL=url; refreshThumb(); };
      image.onerror = ()=>{ URL.revokeObjectURL(url); alert('Bild konnte nicht geladen werden.'); };
      image.src = url;
      prize.text = '';
      textInput.value = '';
    });

    delBtn.addEventListener('click', ()=>{
      const i = [...itemsEl.children].indexOf(row);
      if (i>=0){
        itemsEl.removeChild(row);
        prizes.splice(i,1);
      }
    });
  }

  /*** Font handling ***/
  fontFile.addEventListener('change', async ()=>{
    const f = fontFile.files?.[0];
    if (!f) return;
    try{
      const data = await f.arrayBuffer();
      const font = new FontFace('CustomLuckyFont', data);
      await font.load();
      document.fonts.add(font);
      fontSelect.value = "'CustomLuckyFont', sans-serif";
    }catch(e){
      alert('Schrift konnte nicht geladen werden.');
    }
  });

  /*** Sound handling ***/
  function loadAudioFromFile(input){
    const f = input.files?.[0];
    if (!f) return null;
    const url = URL.createObjectURL(f);
    const a = new Audio(url);
    a.preload = 'auto';
    return a;
  }
  spinSoundInput.addEventListener('change', ()=>{
    spinAudio = loadAudioFromFile(spinSoundInput);
    if (spinAudio){ spinAudio.loop = true; spinAudio.volume = parseFloat(spinVol.value); }
  });
  winSoundInput.addEventListener('change', ()=>{
    winAudio = loadAudioFromFile(winSoundInput);
    if (winAudio){ winAudio.volume = parseFloat(winVol.value); }
  });
  spinVol.addEventListener('input', ()=>{ document.getElementById('spinVolLbl').textContent = Math.round(parseFloat(spinVol.value)*100)+'%'; if (spinAudio) spinAudio.volume = parseFloat(spinVol.value); });
  winVol.addEventListener('input', ()=>{ document.getElementById('winVolLbl').textContent = Math.round(parseFloat(winVol.value)*100)+'%'; if (winAudio) winAudio.volume = parseFloat(winVol.value); });

  toggleMute.addEventListener('click', ()=>{
    const newMuted = !(spinAudio?.muted || winAudio?.muted || false);
    const setMuted = (a)=>{ if(a){ a.muted = newMuted; } };
    setMuted(spinAudio); setMuted(winAudio);
    toggleMute.textContent = newMuted ? '🔇 Ton AUS' : '🔈 Ton an/aus';
  });

  /*** Confetti ***/
  const confetti = {parts:[], active:false};
  function makeConfetti(){
    confetti.parts = [];
    const W = confettiCanvas.width, H = confettiCanvas.height;
    for (let i=0;i<160;i++){
      confetti.parts.push({
        x: Math.random()*W,
        y: -20 - Math.random()*H*0.5,
        r: 4+Math.random()*7,
        vx: -1+Math.random()*2,
        vy: 2+Math.random()*3.5,
        rot: Math.random()*Math.PI,
        vr: -0.2+Math.random()*0.4,
        c: `hsl(${120+Math.random()*80}deg 70% ${60+Math.random()*20}%)`
      });
    }
    confetti.active = true;
  }
  function tickConfetti(){
    if (!confetti.active) return;
    const W = confettiCanvas.width, H = confettiCanvas.height;
    cfx.clearRect(0,0,W,H);
    for (const p of confetti.parts){
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.02;
      cfx.save();
      cfx.translate(p.x,p.y);
      cfx.rotate(p.rot);
      cfx.fillStyle = p.c;
      cfx.fillRect(-p.r,-p.r,p.r*2,p.r*2);
      cfx.restore();
    }
    confetti.parts = confetti.parts.filter(p=>p.y < H+30);
    if (confetti.parts.length===0) confetti.active=false;
    requestAnimationFrame(tickConfetti);
  }

  /*** Mario Kart item-box style spin effect (with clear white question mark) ***/
  const mk = {active:false, start:0, duration:3000, angle:0, hue:0};
  function drawMK(now){
    const W = mkCanvas.width, H = mkCanvas.height;
    mkx.clearRect(0,0,W,H);
    if (!mk.active) return;

    const t = Math.min(1, (now - mk.start)/mk.duration);
    mk.hue = (now/10) % 360;
    const wob = Math.sin(now/120)*0.08;
    const scale = 0.95 + Math.sin(now/140)*0.05;
    mk.angle += 0.06 + (1-t)*0.12; // decaying rotation

    const size = Math.min(W,H)*0.26;
    const cx = W/2, cy = H*0.5;
    mkx.save();
    mkx.translate(cx,cy);
    mkx.rotate(mk.angle+wob);
    mkx.scale(scale, scale);

    // glowing square (item box)
    const grd = mkx.createLinearGradient(-size,-size,size,size);
    grd.addColorStop(0, `hsl(${(mk.hue+40)%360} 85% 65%)`);
    grd.addColorStop(1, `hsl(${(mk.hue+320)%360} 85% 55%)`);
    mkx.fillStyle = grd;
    mkx.strokeStyle = 'rgba(255,255,255,.9)';
    mkx.lineWidth = 8;
    roundRect(mkx, -size, -size, size*2, size*2, 26);
    mkx.fill();
    mkx.stroke();

    // inner glowing border
    mkx.lineWidth = 4;
    mkx.strokeStyle = 'rgba(255,255,255,.6)';
    roundRect(mkx, -size*0.88, -size*0.88, size*1.76, size*1.76, 20);
    mkx.stroke();

    // white question mark using text glyph (clear Mario-like look)
    mkx.rotate(-mk.angle*0.6);
    mkx.textAlign = 'center';
    mkx.textBaseline = 'middle';
    // Use selected font but bold; fallback to Impact-like for chunky look
    const fontFamily = fontSelect.value || "Impact, 'Arial Black', system-ui, sans-serif";
    mkx.font = `900 ${Math.floor(size*1.15)}px ${fontFamily}`;
    // Outer glow/outline
    mkx.lineWidth = Math.max(8, size*0.06);
    mkx.strokeStyle = 'rgba(0,0,0,0.35)';
    mkx.strokeText('?', 0, -size*0.06);
    // Bright white fill
    mkx.fillStyle = '#ffffff';
    mkx.fillText('?', 0, -size*0.06);

    // sparkles around
    for (let i=0;i<10;i++){
      const a = (now/200 + i)*Math.PI/5;
      const r = size*0.95;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      mkx.save();
      mkx.translate(x,y);
      mkx.rotate(a);
      mkx.fillStyle = `hsl(${(mk.hue+i*30)%360} 90% 70%)`;
      mkx.fillRect(-7,-7,14,14);
      mkx.restore();
    }

    mkx.restore();

    if (t<1) { requestAnimationFrame(drawMK); }
    else { mk.active = false; mkx.clearRect(0,0,W,H); }
  }

  function roundRect(ctx, x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  /*** Spin mechanics (random selection, no wheel) ***/
  let spinning = false;
  function spin(){
    if (spinning) return;
    if (prizes.length<1){ alert('Bitte mindestens 1 Feld anlegen.'); return; }

    spinning = true;
    const duration = 3200 + Math.random()*800;
    const start = performance.now();

    // Start animation box
    mk.active = true;
    mk.start = start;
    mk.duration = duration * 0.9;
    mk.angle = 0;
    requestAnimationFrame(drawMK);

    if (spinAudio){
      try{ spinAudio.currentTime = 0; spinAudio.play().catch(()=>{}); }catch{}
    }

    // finish -> pick winner
    setTimeout(()=>{
      if (spinAudio){ try{ spinAudio.pause(); }catch{} }
      showWinner();
      spinning = false;
    }, duration);
  }

  function showWinner(){
    const idx = Math.floor(Math.random()*prizes.length);
    const winner = prizes[idx];

    // Overlay content
    winnerTitle.textContent = 'Gewinn!';
    winnerText.style.display = 'block';
    winnerImage.style.display = 'none';
    if (winner.type==='image' && winner.img){
      winnerText.textContent = '';
      winnerImage.src = winner.img.src;
      winnerImage.style.display = 'block';
    } else {
      winnerText.textContent = (winner.text || 'Unbenannt');
    }

    if (winAudio){ try{ winAudio.currentTime = 0; winAudio.play().catch(()=>{}); }catch{} }
    makeConfetti(); tickConfetti();
    overlay.style.display = 'flex';

    // hide again after a while
    setTimeout(()=>{
      overlay.style.display = 'none';
      // nothing to clear (no wheel), just show bigSpin again
      bigSpin.style.display = 'flex';
    }, 3000);
  }

  /*** Events ***/
  applyCountBtn.addEventListener('click', ()=>{
    const n = Math.max(1, Math.min(32, parseInt(fieldCountEl.value||'8',10)));
    createDefaultPrizes(n);
  });
  addItemBtn.addEventListener('click', ()=> addPrizeRow({type:'text', text:`Gewinn ${prizes.length+1}`}) );
  clearAllBtn.addEventListener('click', ()=>{
    prizes = [];
    itemsEl.innerHTML='';
  });

  spinBtn.addEventListener('click', ()=>{
    bigSpin.style.display = 'none';
    spin();
  });

  /*** Init ***/
  createDefaultPrizes(parseInt(fieldCountEl.value,10));
  resizeCanvases();
  bigSpin.style.display = 'flex';
  overlay.style.display = 'none';
})();
