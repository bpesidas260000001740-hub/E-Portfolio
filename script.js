const root = document.documentElement;

/* ---------- Light / dark toggle ---------- */
const themeBtn = document.getElementById('theme');
function setTheme(t){
  root.dataset.theme = t;
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('theme', t); } catch(e){}
}
setTheme(root.dataset.theme || 'dark');
themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

/* ---------- Mobile menu ---------- */
const menu = document.getElementById('menu'), nav = document.getElementById('nav');
menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); menu.setAttribute('aria-expanded', false);
}));

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Typewriter heading ("Hi, I'm Bernhard Pesidas") ---------- */
const h1 = document.querySelector('.hero h1');
if (h1 && !still){
  const letters = [];
  h1.setAttribute('aria-label', h1.textContent.trim());
  const wrap = node => {
    if (node.nodeType === 3){
      const frag = document.createDocumentFragment();
      [...node.textContent].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'tw'; s.textContent = ch;
        frag.appendChild(s); letters.push(s);
      });
      node.replaceWith(frag);
    } else {
      [...node.childNodes].forEach(wrap);
    }
  };
  [...h1.childNodes].forEach(wrap);

  // give each letter of the name its own color, fading from blue to cyan
  const nameEl = h1.querySelector('.name');
  if (nameEl){
    const nameLetters = letters.filter(s => nameEl.contains(s));
    nameLetters.forEach((s, k) => {
      const p = nameLetters.length > 1 ? 100 - (k / (nameLetters.length - 1)) * 100 : 100;
      s.style.color = 'color-mix(in srgb, var(--name) ' + p + '%, var(--glow))';
    });
  }
  h1.classList.add('typed');

  // the cursor: starts before the first letter, then follows each typed letter
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');
  letters[0].before(caret);

  let i = 0;
  (function next(){
    if (i < letters.length){
      letters[i].classList.add('on');
      letters[i].after(caret);
      i++;
      setTimeout(next, 85);          // typing speed: smaller = faster
    }
  })();
}

/* ---------- Starfield background ---------- */
(function(){
  const old = document.getElementById('bg');      // remove the old hero dots canvas if it is still there
  if (old) old.remove();

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');

  const PAL = {
    dark:  [[255,255,255],[190,215,255],[160,235,255]],   // star colors in dark mode
    light: [[0,162,255],[30,144,255],[0,190,255]]         // BRIGHT BLUE star colors in light mode
  };
  let W, H, stars = [], shoots = [], nextShoot = 2500;

  function resize(){
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.min(220, Math.round(W * H / 8500));   // number of stars: change 8500 (smaller = more stars)
    stars = Array.from({length: n}, () => {
      const r = Math.random() ** 2 * 1.6 + .35;
      return {
        x: Math.random() * W, y: Math.random() * H, r,
        a: Math.random() * .5 + .4,            // brightness
        sp: Math.random() * 1.6 + .5,          // twinkle speed
        ph: Math.random() * 6.283,
        depth: r * .08,                        // scroll drift
        c: Math.floor(Math.random() * 3)
      };
    });
  }

  function spawnShoot(){
    shoots.push({x: Math.random() * W * .8, y: Math.random() * H * .4,
                 vx: 7 + Math.random() * 3, vy: 3 + Math.random() * 2, life: 0, len: 120});
  }

  function frame(t){
    ctx.clearRect(0, 0, W, H);
    const mode = root.dataset.theme === 'light' ? 'light' : 'dark';
    const light = mode === 'light';
    const pal = PAL[mode], k = light ? 1.3 : 1;   // 1.3 = extra bright in light mode
    const sy = still ? 0 : scrollY;

    for (const s of stars){
      const tw = still ? 1 : .55 + .45 * Math.sin(t / 1000 * s.sp + s.ph);
      const a = s.a * tw * k;
      let y = (s.y - sy * s.depth) % H; if (y < 0) y += H;
      const [r, g, b] = pal[s.c];
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
      if (s.r > (light ? .7 : 1.3)){                    // in light mode, almost every star glows
        ctx.fillStyle = `rgba(${r},${g},${b},${a * (light ? .45 : .22)})`;
        ctx.beginPath(); ctx.arc(s.x, y, s.r * (light ? 3.8 : 3), 0, 6.283); ctx.fill();
      }
    }

    if (still) return;

    if (t > nextShoot){ spawnShoot(); nextShoot = t + 3500 + Math.random() * 4500; }  // a shooting star every 3.5 to 8 seconds
    const [r, g, b] = pal[1];
    shoots = shoots.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life++;
      const al = Math.max(0, 1 - s.life / 60) * k;
      const sp = Math.hypot(s.vx, s.vy);
      const tx = s.x - s.vx / sp * s.len, ty = s.y - s.vy / sp * s.len;
      const gr = ctx.createLinearGradient(s.x, s.y, tx, ty);
      gr.addColorStop(0, `rgba(${r},${g},${b},${al})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      return s.life < 60 && s.x < W + 150 && s.y < H + 150;
    });
    requestAnimationFrame(frame);
  }

  resize();
  if (still) frame(0); else requestAnimationFrame(frame);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (still) frame(0); }, 150); });
  if (still) themeBtn.addEventListener('click', () => setTimeout(() => frame(0), 0));
})();

/* ---------- Footer year ---------- */
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();

/* ---------- Scroll reveal + progress bar ---------- */
if (!still && 'IntersectionObserver' in window){
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .12});
  document.querySelectorAll('section:not(.hero) h2,.eyebrow,.facts li,.panel,.timeline li,.stat,.two > div:first-child p,.center > *').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    io.observe(el);
  });
}
const hdr = document.querySelector('header');
if (hdr){
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    hdr.style.setProperty('--p', max > 0 ? scrollY / max : 0);
  }, {passive: true});
}

/* ---------- Contact: click-to-copy cards ---------- */
document.querySelectorAll('.copy-card').forEach(card => {
  card.addEventListener('click', async () => {
    const text = card.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    const tip = card.querySelector('.tip');
    tip.textContent = 'Copied!';
    card.classList.add('copied');
    setTimeout(() => { tip.textContent = ''; card.classList.remove('copied'); }, 1600);
  });
});

/* ---------- Contact: message form (opens the visitor's email app) ---------- */
const form = document.getElementById('contact-form');
if (form){
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const body = f.get('message') + '\n\nFrom: ' + f.get('name') + ' (' + f.get('email') + ')';
    location.href = 'mailto:' + form.dataset.email +
      '?subject=' + encodeURIComponent(f.get('subject')) +
      '&body=' + encodeURIComponent(body);
  });
}