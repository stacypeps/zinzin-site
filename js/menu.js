// Écran titre façon jeu : menu navigable (souris, toucher, clavier), « appuie sur start », écran de chargement, sons.
import { $, $$, MOUVEMENT_REDUIT, lire, ecrire } from './noyau.js';

// ---------- Sons (coupés par défaut, synthétisés : aucun fichier à charger) ----------
let audio = null, sonActif = lire('zinzin-son', false);
export function bip(type = 'deplace') {
  if (!sonActif) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
    const notes = { deplace: [880, .05], valide: [1320, .09], retour: [440, .08], garde: [1560, .12] };
    const [f, d] = notes[type] ?? notes.deplace;
    o.type = 'square'; o.frequency.setValueAtTime(f, t); if (type === 'valide' || type === 'garde') o.frequency.exponentialRampToValueAtTime(f * 1.5, t + d);
    g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + d);
  } catch {}
}
function majBoutonSon() {
  const b = $('#btn-son'); if (!b) return;
  b.setAttribute('aria-pressed', String(sonActif)); b.setAttribute('aria-label', sonActif ? 'Couper les sons' : 'Activer les sons');
  b.classList.toggle('actif', sonActif);
}

// ---------- Écran de chargement entre deux « écrans » ----------
export function charger(action) {
  const c = $('#chargement');
  if (MOUVEMENT_REDUIT || !c) { action(); return; }
  c.hidden = false; c.classList.remove('fin');
  setTimeout(() => { action(); c.classList.add('fin'); }, 380);
  setTimeout(() => { c.hidden = true; }, 700);
}

export function initMenu(actions) {
  const menu = $('#menu-jeu'), boutons = $$('button', menu);
  let i = 0;
  const choisir = (k, focus = true) => { i = (k + boutons.length) % boutons.length; boutons.forEach((b, j) => b.classList.toggle('choisi', j === i)); if (focus) boutons[i].focus({ preventScroll: true }); };
  boutons.forEach((b, k) => {
    b.addEventListener('pointerenter', () => { if (i !== k) { choisir(k, false); bip('deplace'); } });
    b.addEventListener('focus', () => { if (i !== k) { choisir(k, false); bip('deplace'); } });
    b.addEventListener('click', () => { bip('valide'); b.classList.add('valide'); setTimeout(() => b.classList.remove('valide'), 400); actions[b.dataset.action]?.(); });
  });
  choisir(0, false);
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); choisir(i + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); choisir(i - 1); }
  });
  // « Appuie sur start » : Entrée / Espace / Start de la manette, ou un toucher sur l'écran titre.
  const start = () => { $('#haut').classList.add('demarre'); bip('valide'); choisir(i); };
  addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    const surTitre = $('#haut').getBoundingClientRect().bottom > innerHeight * .5;
    if (surTitre && (e.key === 'Enter' || e.key === ' ') && !e.target.closest('input, button, a, select, textarea')) { e.preventDefault(); start(); }
  });
  $('#start')?.addEventListener('click', start);
  // Manette (si branchée) : haut/bas/croix.
  let derniere = 0;
  const manette = () => {
    const pad = navigator.getGamepads?.().find(Boolean);
    if (pad && performance.now() - derniere > 180 && !document.querySelector('dialog[open]')) {
      const b = pad.buttons;
      if (b[12]?.pressed) { choisir(i - 1); derniere = performance.now(); }
      else if (b[13]?.pressed) { choisir(i + 1); derniere = performance.now(); }
      else if (b[0]?.pressed || b[9]?.pressed) { boutons[i].click(); derniere = performance.now() + 300; }
    }
    requestAnimationFrame(manette);
  };
  addEventListener('gamepadconnected', () => requestAnimationFrame(manette), { once: true });

  $('#btn-son')?.addEventListener('click', () => { sonActif = !sonActif; ecrire('zinzin-son', sonActif); majBoutonSon(); bip('valide'); });
  majBoutonSon();
}
