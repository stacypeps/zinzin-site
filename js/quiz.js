// « Quel est ton style ? » : 5 manches de 4 photos, on garde celle qui plaît, et on révèle le style avec une tenue complète.
import { $, S, titre, locale, euros, auHasard, melange, toast, copier } from './noyau.js';
import { composer, ouvrirLook } from './look.js';
import { ouvrirFiche } from './fiche.js';
import { bip } from './menu.js';
import { partagerTenue } from './partage-image.js';

const STYLES = ['clean', 'rockstar', 'streetwear', 'gorpcore', 'oldmoney', 'y2k', 'opium'];
const KANJI = { clean: '清', rockstar: '狂', streetwear: '街', gorpcore: '山', oldmoney: '品', y2k: '光', opium: '闇' };
const MANCHES = 5;
const Q = { manche: 0, scores: {}, vus: new Set(), actions: {} };

// Photos du quiz : belles photos, une pièce seule, haut / bas / chaussures du style.
function pieceDe(style) {
  const ok = S.ORDRE.filter((a) => a.m && a.photoQ === 'bonne' && a.styles.includes(style) && !Q.vus.has(a.id)
    && ['haut', 'bas', 'chaussures'].includes(S.GROUPE[a.tv || a.type]));
  return ok.length ? auHasard(ok.slice(0, 400)) : null;
}

function manche() {
  const boite = $('#quiz-choix');
  $('#quiz-etape').textContent = `${Q.manche + 1} / ${MANCHES}`;
  $('#quiz-barre').style.setProperty('--p', `${(Q.manche / MANCHES) * 100}%`);
  const styles = melange(STYLES, Date.now() % 1e6).slice(0, 4);
  const choix = styles.map((s) => [s, pieceDe(s)]).filter(([, a]) => a);
  boite.replaceChildren(...choix.map(([s, a], i) => {
    Q.vus.add(a.id);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'quiz-carte'; b.style.setProperty('--i', i);
    b.setAttribute('aria-label', titre(a));
    const img = document.createElement('img'); img.alt = ''; img.src = locale(a); img.decoding = 'async';
    b.append(img);
    b.onclick = () => {
      if (boite.classList.contains('choisi')) return;
      boite.classList.add('choisi'); b.classList.add('elu'); bip('valide');
      navigator.vibrate?.(15);
      Q.scores[s] = (Q.scores[s] ?? 0) + 1;
      setTimeout(() => { boite.classList.remove('choisi'); Q.manche++; Q.manche < MANCHES ? manche() : resultat(); }, 520);
    };
    return b;
  }));
}

function resultat() {
  $('#quiz-barre').style.setProperty('--p', '100%');
  const max = Math.max(...Object.values(Q.scores));
  const style = auHasard(Object.keys(Q.scores).filter((s) => Q.scores[s] === max));
  const st = S.STYLES[style];
  $('#quiz-jeu').hidden = true;
  const r = $('#quiz-resultat'); r.hidden = false; r.classList.remove('revele'); void r.offsetWidth; r.classList.add('revele');
  $('#quiz-kanji').textContent = KANJI[style] ?? '型';
  $('#quiz-style').textContent = st?.nom ?? style;
  $('#quiz-desc').textContent = st?.desc ?? '';
  const t = composer({ style, budget: 150, accessoire: false, garder: false });
  const tenue = $('#quiz-tenue');
  if (t.ok) {
    const pieces = ['haut', 'bas', 'chaussures'].map((k) => t.pieces[k]);
    tenue.replaceChildren(...pieces.map((a, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'quiz-piece'; b.style.setProperty('--i', i);
      b.innerHTML = `<img alt=""><span>≈ ${euros(a.eur)} €</span>`; $('img', b).src = locale(a); b.setAttribute('aria-label', titre(a));
      b.onclick = () => ouvrirFiche(a, pieces);
      return b;
    }));
    $('#quiz-total').textContent = `Ta tenue : ≈ ${euros(pieces.reduce((s, a) => s + a.eur, 0))} € les trois pièces`;
    $('#quiz-image').hidden = false; $('#quiz-image').onclick = () => partagerTenue(pieces, style);
  } else { tenue.replaceChildren(); $('#quiz-total').textContent = ''; $('#quiz-image').hidden = true; }
  $('#quiz-voir').onclick = () => { $('#quiz').close(); Q.actions.voirStyle?.(style); };
  $('#quiz-look').onclick = () => { $('#quiz').close(); ouvrirLook({ style, budget: 150 }); };
  $('#quiz-partager').onclick = async () => {
    const texte = `Mon style sur Zinzin : ${st?.nom ?? style}. Et toi ?`;
    const url = location.origin + location.pathname;
    try { if (navigator.share) { await navigator.share({ title: 'Zinzin', text: texte, url }); return; } } catch { return; }
    copier(`${texte} ${url}`, 'Copié, colle-le à tes potes');
  };
  bip('garde'); navigator.vibrate?.([20, 40, 20]);
  confettis($('#quiz .quiz-boite'));
}

// Petits confettis aux couleurs du site.
export function confettis(dans) {
  if (!dans || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const couleurs = ['#ff7a1a', '#45e9ff', '#ff4fa3', '#ffd27a', '#ffffff'];
  for (let k = 0; k < 40; k++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.cssText = `--x:${(Math.random() * 2 - 1) * 180}px;--y:${-120 - Math.random() * 220}px;--r:${Math.random() * 720}deg;left:${40 + Math.random() * 20}%;background:${auHasard(couleurs)};animation-delay:${Math.random() * .15}s`;
    dans.append(c); setTimeout(() => c.remove(), 1600);
  }
}

export function ouvrirQuiz() {
  Q.manche = 0; Q.scores = {}; Q.vus = new Set();
  $('#quiz-jeu').hidden = false; $('#quiz-resultat').hidden = true;
  manche(); $('#quiz').showModal();
}

export function initQuiz(actions) {
  Q.actions = actions;
  $('#quiz-fermer').onclick = () => $('#quiz').close();
  $('#quiz-rejouer').onclick = ouvrirQuiz;
}
