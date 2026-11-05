// Effets : curseur, révélations au scroll, cartes 3D, boutons aimantés, mots qui tournent, compteurs, parallaxe.
// Tout est coupé si « réduire les animations » est activé ; curseur et 3D seulement avec une souris.
import { $, $$, MOUVEMENT_REDUIT } from './noyau.js';

const SOURIS = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Révélation au scroll : [data-revele] apparaît quand il entre à l'écran (une seule fois).
export function revelations(racine = document) {
  const els = $$('[data-revele]:not(.vu)', racine);
  if (MOUVEMENT_REDUIT || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('vu')); return; }
  const io = new IntersectionObserver((entrees) => entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

// Compteur qui monte (ex. « 400 $ ») quand il devient visible.
export function compteurs() {
  for (const el of $$('[data-compte]')) {
    const fin = Number(el.dataset.compte), suffixe = el.dataset.suffixe ?? '';
    if (MOUVEMENT_REDUIT) { el.textContent = fin + suffixe; continue; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const pas = (t) => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(fin * (1 - (1 - k) ** 4)) + suffixe; if (k < 1) requestAnimationFrame(pas); };
      requestAnimationFrame(pas);
    }, { threshold: .5 });
    io.observe(el);
  }
}

// Mots qui défilent dans le titre (streetwear → rockstar → …).
export function motsTournants(el, mots) {
  if (!el || !mots.length) return;
  el.textContent = mots[0];
  if (MOUVEMENT_REDUIT) return;
  let i = 0;
  setInterval(() => {
    if (document.hidden || $('#haut').classList.contains('pause')) return;
    el.classList.add('sort');
    setTimeout(() => { i = (i + 1) % mots.length; el.textContent = mots[i]; el.classList.remove('sort'); el.classList.add('entre'); setTimeout(() => el.classList.remove('entre'), 400); }, 280);
  }, 2400);
}

// Curseur perso : un point orange + un anneau qui grossit sur ce qui est cliquable.
function curseur() {
  const point = document.createElement('div'), anneau = document.createElement('div');
  point.className = 'curseur-point'; anneau.className = 'curseur-anneau';
  document.body.append(point, anneau); document.documentElement.classList.add('curseur-perso');
  let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; point.style.transform = `translate(${x}px, ${y}px)`; }, { passive: true });
  addEventListener('pointerover', (e) => anneau.classList.toggle('actif', !!e.target.closest('a, button, select, input, label, [role=button]')));
  document.addEventListener('pointerleave', () => { point.style.opacity = anneau.style.opacity = 0; });
  document.addEventListener('pointerenter', () => { point.style.opacity = anneau.style.opacity = 1; });
  // La boucle ne tourne que pendant que la souris bouge (pas de calcul permanent).
  let enCours = false;
  const boucle = () => { ax += (x - ax) * .2; ay += (y - ay) * .2; anneau.style.transform = `translate(${ax}px, ${ay}px)`; if (Math.abs(x - ax) + Math.abs(y - ay) > .5) requestAnimationFrame(boucle); else enCours = false; };
  addEventListener('pointermove', () => { if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }, { passive: true });
}

// Inclinaison 3D qui suit la souris (cartes, couvertures).
export function inclinaison(selecteur, force = 8) {
  if (!SOURIS || MOUVEMENT_REDUIT) return;
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.(selecteur);
    if (!el) return;
    const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty('--rx', `${(-py * force).toFixed(2)}deg`); el.style.setProperty('--ry', `${(px * force).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${((px + .5) * 100).toFixed(1)}%`); el.style.setProperty('--my', `${((py + .5) * 100).toFixed(1)}%`);
    el.classList.add('incline');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => { const el = e.target.closest?.(selecteur); if (el && !el.contains(e.relatedTarget)) { el.classList.remove('incline'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } });
}

// Boutons aimantés : ils suivent un peu la souris.
function aimants() {
  if (!SOURIS || MOUVEMENT_REDUIT) return;
  for (const b of $$('[data-aimant]')) {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .22}px ${(e.clientY - r.top - r.height / 2) * .3}px`; });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  }
}

// Parallaxe de l'accueil : le lapin et les pièces bougent à des profondeurs différentes.
function parallaxe() {
  if (!SOURIS || MOUVEMENT_REDUIT) return;
  const scene = $('.scene'); if (!scene) return;
  let raf;
  addEventListener('pointermove', (e) => {
    if ($('#haut').classList.contains('pause')) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      scene.style.setProperty('--px', nx.toFixed(3)); scene.style.setProperty('--py', ny.toFixed(3));
    });
  }, { passive: true });
}

function neige() {
  for (const cv of $$('canvas.neige')) {
    if (MOUVEMENT_REDUIT) continue;
    const cx = cv.getContext('2d'); let flocons = [], visible = false;
    const taille = () => { cv.width = cv.offsetWidth * devicePixelRatio; cv.height = cv.offsetHeight * devicePixelRatio; flocons = Array.from({ length: Math.round(cv.offsetWidth / 9) }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, r: (Math.random() * 2 + .6) * devicePixelRatio, v: (Math.random() * .6 + .3) * devicePixelRatio, d: Math.random() * 6.28 })); };
    taille(); addEventListener('resize', taille);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(pas); }).observe(cv);
    function pas() {
      if (!visible) return;
      cx.clearRect(0, 0, cv.width, cv.height); cx.fillStyle = 'rgba(235, 245, 255, .85)';
      for (const f of flocons) { f.y += f.v; f.d += .01; f.x += Math.sin(f.d) * .4; if (f.y > cv.height) { f.y = -4; f.x = Math.random() * cv.width; } cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.28); cx.fill(); }
      requestAnimationFrame(pas);
    }
  }
}

export function initEffets() {
  neige();
  if (SOURIS && !MOUVEMENT_REDUIT) curseur();
  aimants(); parallaxe(); compteurs(); revelations();
  inclinaison('.couv', 10); inclinaison('.carte', 6); inclinaison('.ticket', 6);
}
