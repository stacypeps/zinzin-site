// Zinzin Swipe : une pièce à la fois. Glisser à droite = favori, à gauche = suivante, vers le haut = LoveGoBuy.
import { $, S, C, PLATEFORME, euros, titre, photo, toast, lapinDit, melange } from './noyau.js';
import { ouvrirFiche } from './fiche.js';
import { bip } from './menu.js';

const W = { style: '', file: [], i: 0, gardes: 0, vus: new Set() };

function remplir() {
  const ok = (a) => a.img && a.eur > 0 && ['haut', 'bas', 'chaussures', 'accessoire', 'ensemble'].includes(S.GROUPE[a.type]) && (!W.style || a.styles.includes(W.style)) && !W.vus.has(a.id);
  W.file = melange(S.ORDRE.filter(ok), Date.now() % 1e6).slice(0, 200); W.i = 0;
}

function boitier(a, dessus) {
  const el = document.createElement('article');
  el.className = `swipe-carte${dessus ? ' dessus' : ''}`;
  el.innerHTML = `<div class="boitier"><span class="boitier-bande"><b>${(PLATEFORME[a.plateforme] ?? '').toUpperCase()}</b><i>2003</i></span>
    <div class="boitier-cover"><img alt=""></div></div>
    <div class="swipe-infos"><p class="swipe-marque"></p><h3></h3><p class="swipe-prix"></p></div>
    <span class="tampon tampon-oui">GARDÉ</span><span class="tampon tampon-non">SUIVANT</span>`;
  const img = $('img', el); img.alt = titre(a); photo(img, a, 800, $('.boitier-cover', el));
  $('.swipe-marque', el).textContent = [a.marque, S.TYPES[a.type]?.nom].filter(Boolean).join(' · ');
  $('h3', el).textContent = titre(a);
  $('.swipe-prix', el).textContent = `≈ ${euros(a.eur)} €`;
  return el;
}

function dessiner() {
  const pile = $('#swipe-pile');
  if (W.i >= W.file.length) remplir();
  const a = W.file[W.i], b = W.file[W.i + 1];
  if (!a) { pile.replaceChildren(Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: 'Plus rien à swiper dans ce style. Change de style !' })); return; }
  pile.replaceChildren(...[b && boitier(b, false), boitier(a, true)].filter(Boolean));
  brancher($('.swipe-carte.dessus', pile), a);
  $('#swipe-compteur').textContent = W.gardes ? `♥ ${W.gardes} pièce${W.gardes > 1 ? 's' : ''} gardée${W.gardes > 1 ? 's' : ''} dans tes favoris` : 'Garde ce qui te plaît, ça va dans tes favoris.';
}

function decider(sens) {
  const a = W.file[W.i]; if (!a) return;
  const carte = $('.swipe-carte.dessus');
  W.vus.add(a.id);
  if (sens === 'oui') { if (!C.estFavori(a.id)) C.basculer('favoris', a.id); W.gardes++; bip('garde'); if (W.gardes % 5 === 0) lapinDit(`${W.gardes} pièces gardées, t'as l'œil !`, 'content'); }
  else if (sens === 'haut') { bip('valide'); window.open(a.lien, '_blank', 'noopener'); }
  else bip('retour');
  carte?.classList.add(`part-${sens}`);
  setTimeout(() => { W.i++; dessiner(); }, sens === 'haut' ? 120 : 260);
}

function brancher(el, a) {
  let x0 = 0, y0 = 0, dx = 0, dy = 0, actif = false, bouge = false;
  el.addEventListener('pointerdown', (e) => { actif = true; bouge = false; x0 = e.clientX; y0 = e.clientY; el.setPointerCapture(e.pointerId); el.classList.add('tenue'); });
  el.addEventListener('pointermove', (e) => {
    if (!actif) return;
    dx = e.clientX - x0; dy = e.clientY - y0; if (Math.abs(dx) + Math.abs(dy) > 6) bouge = true;
    el.style.transform = `translate(${dx}px, ${Math.min(0, dy) * .6}px) rotate(${dx / 18}deg)`;
    el.style.setProperty('--oui', Math.max(0, Math.min(1, dx / 120))); el.style.setProperty('--non', Math.max(0, Math.min(1, -dx / 120)));
  });
  el.addEventListener('pointerup', () => {
    if (!actif) return; actif = false; el.classList.remove('tenue');
    if (!bouge) { ouvrirFiche(a, W.file.slice(W.i)); return; }
    if (dx > 110) decider('oui'); else if (dx < -110) decider('non'); else if (dy < -130) decider('haut');
    else { el.style.transform = ''; el.style.setProperty('--oui', 0); el.style.setProperty('--non', 0); }
    dx = dy = 0;
  });
}

export function ouvrirSwipe(style) {
  if (style !== undefined) W.style = style;
  $('#swipe-style').value = W.style;
  if (!W.file.length) remplir();
  dessiner(); $('#swipe').showModal();
}

export function initSwipe() {
  const sel = $('#swipe-style');
  sel.replaceChildren(new Option('Tous styles', ''), ...S.DATA.meta.styles.filter((s) => s.n && !['a-verifier', 'archive'].includes(s.id)).map((s) => new Option(s.nom, s.id)));
  sel.onchange = () => { W.style = sel.value; remplir(); dessiner(); };
  $('#swipe-non').onclick = () => decider('non');
  $('#swipe-oui').onclick = () => decider('oui');
  $('#swipe-lgb').onclick = () => decider('haut');
  $('#swipe-fermer').onclick = () => $('#swipe').close();
  $('#swipe').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') decider('oui'); if (e.key === 'ArrowLeft') decider('non'); if (e.key === 'ArrowUp') { e.preventDefault(); decider('haut'); } });
}
