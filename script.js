// ════════════════════════ STATE ════════════════════════
console.log('%c[Go Network] script.js loaded ✓', 'color:#cf001e;font-weight:bold');

let steps = [
  {title:'', bullets:['','','']},
  {title:'', bullets:['','','']},
  {title:'', bullets:['','','']},
];

renderStepInputs();
console.log('[Go Network] Initial step inputs rendered, steps:', steps.length);

// ════════════════════════ STEP INPUTS ════════════════════════
function renderStepInputs() {
  const c = document.getElementById('steps-container');
  c.innerHTML = '';
  steps.forEach((s, si) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    const canRemove = steps.length > 3;
    card.innerHTML = `
      <div class="sc-row">
        <div class="sc-num">${String(si+1).padStart(2,'0')}</div>
        <input type="text" class="sc-title" placeholder="Step title (e.g. Stabilize)"
          value="${x(s.title)}" oninput="steps[${si}].title=this.value;live()">
        ${canRemove ? `<button class="btn-xs" onclick="removeStep(${si})">✕</button>` : ''}
      </div>
      <div id="bl-${si}">
        ${s.bullets.map((b,bi)=>brow(si,bi,b)).join('')}
      </div>
      <button class="btn-add-bullet" onclick="addBullet(${si})" ${s.bullets.length>=4?'disabled':''}>
        + Add bullet (max 4)
      </button>`;
    c.appendChild(card);
  });
  document.getElementById('btn-add-step').style.display = steps.length >= 5 ? 'none' : '';
}

function brow(si,bi,val){
  const canDel = steps[si].bullets.length > 2;
  return `<div class="brow">
    <div class="bdot"></div>
    <input type="text" class="binput" placeholder="Bullet point..."
      value="${x(val)}" oninput="steps[${si}].bullets[${bi}]=this.value;live()">
    ${canDel?`<button class="btn-xs" onclick="removeBullet(${si},${bi})">×</button>`:''}
  </div>`;
}

function addStep(){
  if(steps.length>=5) return;
  steps.push({title:'',bullets:['','','']});
  renderStepInputs();
}
function removeStep(si){
  if(steps.length<=3) return;
  steps.splice(si,1);
  renderStepInputs(); live();
}
function addBullet(si){
  if(steps[si].bullets.length>=4) return;
  steps[si].bullets.push('');
  renderStepInputs();
}
function removeBullet(si,bi){
  if(steps[si].bullets.length<=2) return;
  steps[si].bullets.splice(bi,1);
  renderStepInputs(); live();
}

// ════════════════════════ JSON PARSE ════════════════════════
function parseJSON(){
  const raw = document.getElementById('json-input').value.trim();
  const notice = document.getElementById('json-notice');
  if(!raw){ showN(notice,'Paste a JSON object first.','err'); return; }
  let d;
  try { d = JSON.parse(raw); }
  catch(e){ showN(notice,'Invalid JSON — check format and try again.','err'); return; }
  try {
    document.getElementById('f-name').value    = d.recruit?.full_name || d.recruit?.first_name || '';
    document.getElementById('f-title').value   = d.document?.cover_title || '';
    document.getElementById('f-subtitle').value= d.document?.cover_subtitle || '';
    if(Array.isArray(d.pathway_steps) && d.pathway_steps.length){
      steps = d.pathway_steps.map(s=>({
        title: s.title||'',
        bullets: (s.bullets||[]).filter(Boolean).slice(0,4)
      }));
      steps.forEach(s=>{ while(s.bullets.length<2) s.bullets.push(''); });
      while(steps.length<3) steps.push({title:'',bullets:['','','']});
      steps = steps.slice(0,5);
    }
    renderStepInputs();
    renderPages();
    showN(notice,`✓ Loaded ${steps.length} steps for ${d.recruit?.full_name||'recruit'}.`,'ok');
  } catch(e){ showN(notice,'Unexpected JSON structure — check field names.','err'); }
}

function showN(el,msg,type){
  el.textContent=msg;
  el.className='notice show '+(type==='ok'?'n-ok':'n-err');
}

// ════════════════════════ LIVE UPDATE ════════════════════════
let liveT;
function live(){ clearTimeout(liveT); liveT=setTimeout(renderPages,150); }

// ════════════════════════ NAME DISPLAY ════════════════════════
function formatNameForDisplay(name) {
  return x(name); // Always render on one line; font size is shrunk dynamically by adjustNameFontSize()
}

// ════════════════════════ RENDER ════════════════════════
function renderPages(){
  const name     = document.getElementById('f-name').value.trim();
  const title    = document.getElementById('f-title').value.trim();
  const subtitle = document.getElementById('f-subtitle').value.trim();
  const pgs      = document.getElementById('pages');

  console.log('[Go Network] renderPages() — name:', name || '(empty)', '| steps:', steps.length);

  if(!name && !title && steps.every(s=>!s.title)){
    pgs.innerHTML=`<div class="empty"><div class="empty-icon">📄</div><p>Fill in fields and click <strong>Generate Preview</strong>, or paste your GPT JSON to auto-fill.</p></div>`;
    return;
  }

  const n = steps.length; // 3, 4, or 5
  let html = page1(name,title,subtitle) + page2();

  html += page3(steps[0], steps[1], steps[2]);

  if(n===3)      html += page4a();
  else if(n===4) html += page4b(steps[3]);
  else           html += page4c(steps[3], steps[4]);

  pgs.innerHTML = html;
  
  // Apply dynamic positioning to bullet points and name wrapping
  setTimeout(() => {
    adjustBulletPositions();
    adjustNamePosition();
  }, 100);
}

// ── Individual page builders ──

function page1(name,title,subtitle){
  const formattedName = formatNameForDisplay(name);
  return `<div class="page">
    <img class="page-bg" src="Page Backgrounds/bg_page1.png" alt="Cover background">
    <div class="ov p1-name">${formattedName||'&nbsp;'}</div>
    <div class="ov p1-title">${x(title)||'&nbsp;'}</div>
    <div class="ov p1-subtitle">${x(subtitle)||'&nbsp;'}</div>
  </div>`;
}

function page2(){
  return `<div class="page"><img class="page-bg" src="Page Backgrounds/bg_page2.png" alt="Two circles page"></div>`;
}

function page3(s1,s2,s3){
  return `<div class="page">
    <img class="page-bg" src="Page Backgrounds/bg_page3.png" alt="Roadmap page">
    ${stepOvs(s1,'p3-s1t','p3-s1b','p3-title','p3-bullet')}
    ${stepOvs(s2,'p3-s2t','p3-s2b','p3-title','p3-bullet')}
    ${stepOvs(s3,'p3-s3t','p3-s3b','p3-title','p3-bullet')}
  </div>`;
}

function page4a(){
  return `<div class="page"><img class="page-bg" src="Page Backgrounds/bg_page4a.png" alt="People First page"></div>`;
}

function page4b(s4){
  return `<div class="page">
    <img class="page-bg" src="Page Backgrounds/bg_page4b.png" alt="Step 4 + People First">
    ${stepOvs(s4,'p4b-s4t','p4b-s4b','p4-title','p4-bullet')}
  </div>`;
}

function page4c(s4,s5){
  return `<div class="page">
    <img class="page-bg" src="Page Backgrounds/bg_page4c.png" alt="Steps 4-5 + People First">
    ${stepOvs(s4,'p4c-s4t','p4c-s4b','p4-title','p4-bullet')}
    ${stepOvs(s5||{title:'',bullets:[]},'p4c-s5t','p4c-s5b','p4-title','p4-bullet')}
  </div>`;
}

// Build title + bullet overlays for one step
function stepOvs(step, titleCls, bulletPrefix, titleBase, bulletBase){
  if(!step) return '';
  const bullets = (step.bullets||[]).filter(b=>b&&b.trim());
  let h = `<div class="ov ${titleBase} ${titleCls}">${x(step.title)}</div>`;
  
  bullets.slice(0,4).forEach((b,i)=>{
    h += `<div class="ov ${bulletBase} ${bulletPrefix}${i+1}" data-step="${titleCls}" data-bullet-idx="${i}">${x(b)}</div>`;
  });
  
  return h;
}

// Helper function to get starting top position for bullets based on title class
function getBulletStartTop(titleCls) {
  const positions = {
    'p3-s1t': 21.5,
    'p3-s2t': 47.5,
    'p3-s3t': 73.5,
    'p4b-s4t': 9.0,
    'p4c-s4t': 9.0,
    'p4c-s5t': 34.0
  };
  return positions[titleCls] || 21.5;
}

// Dynamically adjust bullet positions based on content height
function adjustBulletPositions() {
  const pages = document.querySelectorAll('.page');
  
  pages.forEach(page => {
    const bullets = page.querySelectorAll('.p3-bullet, .p4-bullet');
    const stepGroups = {};
    
    // Group bullets by their step
    bullets.forEach(bullet => {
      const stepClass = bullet.getAttribute('data-step');
      if (stepClass) {
        if (!stepGroups[stepClass]) {
          stepGroups[stepClass] = [];
        }
        stepGroups[stepClass].push(bullet);
      }
    });
    
    // Position bullets within each step group
    Object.keys(stepGroups).forEach(stepClass => {
      const stepBullets = stepGroups[stepClass].sort((a, b) => {
        const idxA = parseInt(a.getAttribute('data-bullet-idx'));
        const idxB = parseInt(b.getAttribute('data-bullet-idx'));
        return idxA - idxB;
      });
      
      let currentTop = getBulletStartTop(stepClass);
      
      stepBullets.forEach(bullet => {
        const bulletHeight = bullet.offsetHeight;
        const pageHeight = page.offsetHeight;
        const heightPercent = (bulletHeight / pageHeight) * 100;
        
        bullet.style.top = currentTop + '%';
        currentTop += Math.max(heightPercent + 0.4, 2.5); // Add 0.4% margin or use base 2.5%
      });
    });
  });
}

// Shrink the recruit name font size so it always fits on one line
function adjustNamePosition() {
  const nameEl = document.querySelector('.p1-name');
  if (!nameEl) return;

  const page = nameEl.closest('.page');
  if (!page) return;

  // Must use removeProperty + setProperty with 'important' because the CSS rule
  // uses font-size:55pt !important, which beats a plain inline style assignment.
  nameEl.style.removeProperty('font-size');

  const maxWidth = page.offsetWidth * 0.75; // matches max-width:75% in CSS
  const baseSize = parseFloat(window.getComputedStyle(nameEl).fontSize);

  console.log('[Go Network] adjustNamePosition — page width:', page.offsetWidth, '| maxWidth:', maxWidth.toFixed(1), '| nameEl scrollWidth:', nameEl.scrollWidth, '| baseSize:', baseSize);

  // If text already fits, nothing to do
  if (nameEl.scrollWidth <= maxWidth) {
    console.log('[Go Network] Name fits at base size, no resize needed.');
    return;
  }

  // Shrink in 0.5px steps until it fits — override !important via setProperty
  let size = baseSize;
  while (nameEl.scrollWidth > maxWidth && size > 10) {
    size -= 0.5;
    nameEl.style.setProperty('font-size', size + 'px', 'important');
  }
  console.log('[Go Network] Name resized to:', size.toFixed(1), 'px');
}

// ════════════════════════ UTIL ════════════════════════
function x(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
