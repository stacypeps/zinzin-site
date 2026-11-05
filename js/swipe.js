// Zinzin Swipe : une pièce à la fois. Glisser à droite = favori, à gauche = suivante, vers le haut = LoveGoBuy.
// Fluide : 3 cartes seulement dans la page (on recycle au lieu de tout reconstruire) et photos préchargées.
import { $, S, C, PLATEFORME, euros, titre, mini, toast, lapinDit, melange } from './noyau.js';
import { ouvrirFiche } from './fiche.js';
import { bip } from './menu.js';

const W = { style: '', file: [], i: 0, gardes: 0, vus: new Set(), occupe: false };
const TAILLE = innerWidth < 760 ? 500 : 700;
const prechargees = new Map();
function precharger(a) {
  if (!a || prechargees.has(a.id)) return;
  const im = new Image(); im.decoding = 'async'; im.referrerPolicy = 'no-referrer'; im.src = mini(a.img, TAILLE);
  prechargees.set(a.id, im);
  if (prechargees.size > 30) prechargees.delete(prechargees.keys().next().value);
}

function remplir() {
  const ok = (a) => a.img && a.eur > 0 && ['haut', 'bas', 'chaussures', 'accessoire', 'ensemble'].includes(S.GROUPE[a.type]) && (!W.style || a.styles.includes(W.style)) && !W.vus.has(a.id);
  W.file = melange(S.ORDRE.filter(ok), Date.now() % 1e6).slice(0, 200); W.i = 0;
}

function carteSwipe(a) {
  const el = document.createElement('article');
  el.className = 'swipe-carte';
  el.innerHTML = `<div class="boitier"><div class="boitier-tranche"><img src="assets/logo-z.svg" alt=""><span>ZINZIN</span></div>
      <div class="boitier-cover"><img alt="" draggable="false"></div></div>
    <div class="swipe-infos"><p class="swipe-marque"></p><h3></h3><p class="swipe-prix"></p></div>
    <span class="tampon tampon-oui" lang="ja">好き</span><span class="tampon tampon-non" lang="ja">次</span>`;
  const img = $('.boitier-cover img', el);
  img.alt = titre(a); img.referrerPolicy = 'no-referrer'; img.decoding = 'async';
  img.src = mini(a.img, TAILLE);
  img.onerror = () => { if (img.src !== a.img) img.src = a.img; };
  $('.swipe-marque', el).textContent = [a.marque, S.TYPES[a.type]?.nom].filter(Boolean).join(' · ');
  $('h3', el).textContent = titre(a);
  $('.swipe-prix', el).textContent = `≈ ${euros(a.eur)} €`;
  el.dataset.id = a.id;
  return el;
}

// Pile : 3 cartes max (dessus, suivante, d'après). On ajoute une carte au fond quand celle du dessus part.
function construirePile() {
  const pile = $('#swipe-pile');
  if (W.i >= W.file.length) remplir();
  pile.replaceChildren();
  if (!W.file[W.i]) { pile.append(Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: 'Plus rien à swiper dans ce style. Change de style !' })); return; }
  for (let k = 2; k >= 0; k--) { const a = W.file[W.i + k]; if (a) pile.append(carteSwipe(a)); }
  majPile();
}
function majPile() {
  const cartes = [...$('#swipe-pile').querySelectorAll('.swipe-carte')].reverse(); // [dessus, suivante, d'après]
  cartes.forEach((c, k) => { c.dataset.rang = k; c.style.transform = ''; });
  if (cartes[0]) brancher(cartes[0], W.file[W.i]);
  for (let k = 3; k < 7; k++) precharger(W.file[W.i + k]);
  $('#swipe-compteur').textContent = W.gardes ? `♥ ${W.gardes} pièce${W.gardes > 1 ? 's' : ''} gardée${W.gardes > 1 ? 's' : ''}` : 'Garde ce qui te plaît, ça va dans tes favoris.';
}

function decider(sens) {
  const a = W.file[W.i], carte = $('#swipe-pile .swipe-carte[data-rang="0"]');
  if (!a || !carte || W.occupe) return;
  W.occupe = true; W.vus.add(a.id);
  if (sens === 'oui') { if (!C.estFavori(a.id)) C.basculer('favoris', a.id); W.gardes++; bip('garde'); if (W.gardes % 5 === 0) lapinDit(`${W.gardes} pièces gardées, t'as l'œil !`, 'content'); }
  else if (sens === 'haut') { bip('valide'); window.open(a.lien, '_blank', 'noopener'); }
  else bip('retour');
  carte.classList.add(`part-${sens}`);
  // On fait monter les autres cartes tout de suite, sans attendre la fin de l'animation.
  W.i++;
  const suivante = W.file[W.i + 2];
  const pile = $('#swipe-pile');
  if (suivante) pile.prepend(carteSwipe(suivante));
  [...pile.querySelectorAll('.swipe-carte:not(.part-oui):not(.part-non):not(.part-haut)')].reverse().forEach((c, k) => { c.dataset.rang = k; c.style.transform = ''; });
  setTimeout(() => { carte.remove(); W.occupe = false; if (W.i >= W.file.length) construirePile(); else majPile(); }, 280);
}

function brancher(el, a) {
  let x0 = 0, y0 = 0, dx = 0, dy = 0, actif = false, bouge = false, raf = 0;
  const appliquer = () => { raf = 0; el.style.transform = `translate3d(${dx}px, ${Math.min(0, dy) * .6}px, 0) rotate(${dx / 16}deg)`; el.style.setProperty('--oui', Math.max(0, Math.min(1, dx / 110))); el.style.setProperty('--non', Math.max(0, Math.min(1, -dx / 110))); };
  el.onpointerdown = (e) => { if (W.occupe) return; actif = true; bouge = false; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; el.setPointerCapture(e.pointerId); el.classList.add('tenue'); };
  el.onpointermove = (e) => { if (!actif) return; dx = e.clientX - x0; dy = e.clientY - y0; if (Math.abs(dx) + Math.abs(dy) > 6) bouge = true; if (!raf) raf = requestAnimationFrame(appliquer); };
  el.onpointerup = el.onpointercancel = () => {
    if (!actif) return; actif = false; el.classList.remove('tenue');
    if (!bouge) { ouvrirFiche(a, W.file.slice(W.i)); return; }
    if (dx > 100) decider('oui'); else if (dx < -100) decider('non'); else if (dy < -120) decider('haut');
    else { el.style.transform = ''; el.style.setProperty('--oui', 0); el.style.setProperty('--non', 0); }
  };
}

export function ouvrirSwipe(style) {
  if (style !== undefined && style !== W.style) { W.style = style; W.file = []; }
  $('#swipe-style').value = W.style;
  if (!W.file.length) remplir();
  construirePile(); $('#swipe').showModal();
}

export function initSwipe() {
  const sel = $('#swipe-style');
  sel.replaceChildren(new Option('Tous styles', ''), ...S.DATA.meta.styles.filter((s) => s.n && !['a-verifier', 'archive'].includes(s.id)).map((s) => new Option(s.nom, s.id)));
  sel.onchange = () => { W.style = sel.value; remplir(); construirePile(); };
  $('#swipe-non').onclick = () => decider('non');
  $('#swipe-oui').onclick = () => decider('oui');
  $('#swipe-lgb').onclick = () => decider('haut');
  $('#swipe-fermer').onclick = () => $('#swipe').close();
  $('#swipe').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') decider('oui'); if (e.key === 'ArrowLeft') decider('non'); if (e.key === 'ArrowUp') { e.preventDefault(); decider('haut'); } });
}
