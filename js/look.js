// « Compose ton look » : haut + bas + chaussures (+ accessoire facultatif) tirés du vrai catalogue, dans un style et un budget.
import { $, $$, S, C, euros, titre, photo, toast, lapinDit, lire, ecrire, copier, lienPartage, NOTE_PRIX, auHasard, evt } from './noyau.js';
import { ouvrirFiche, prixEl } from './fiche.js';

export const CASES = [
  { id: 'haut', nom: 'Haut', groupes: ['haut'] },
  { id: 'bas', nom: 'Bas', groupes: ['bas'] },
  { id: 'chaussures', nom: 'Chaussures', groupes: ['chaussures'] },
  { id: 'accessoire', nom: 'Accessoire', groupes: ['accessoire'], facultatif: true },
];
const CLE_LOOKS = 'zinzin-looks-v1';
export const LOOKS = { liste: lire(CLE_LOOKS, []), sauver() { ecrire(CLE_LOOKS, this.liste); evt('looks'); } };

const L = { style: '', budget: 120, accessoire: false, pieces: {}, verrous: new Set(), horsStyle: new Set() };

// Claquettes, sandales, sous-vêtements : pas pour une tenue.
const PAS_TENUE = /slides?|claquettes?|sandal|flip[- ]?flop|slippers?|mules?|tongs?|pool|fluffy|furry|shower/i;
const SOUS_VET = /boxers?|underwear|cale[cç]on|briefs?|socks?|chaussettes?/i;
const BOTTES = /boots?|bottes?|bottines?|ramones|rick owens geobasket|combat/i;
// Pas de shorts quand le style est chaud, sombre ou chic.
const SANS_SHORT = new Set(['hiver', 'opium', 'oldmoney', 'gorpcore']);
function candidats(c, style) {
  let base = S.ORDRE.filter((a) => a.eur > 0 && a.img && a.photoQ !== 'mauvaise' && c.groupes.includes(S.GROUPE[a.type]) && (!a.tv || c.groupes.includes(S.GROUPE[a.tv]))
    && !(c.id === 'chaussures' && PAS_TENUE.test(a.titre || ''))
    && !(c.id === 'bas' && (SOUS_VET.test(a.titre || '') || (SANS_SHORT.has(style) && a.type === 'shorts'))));
  const tri = (l) => { const belles = l.filter((a) => a.photoQ === 'bonne'); return belles.length >= 8 ? belles : l; };
  if (!style) return { liste: tri(base), hors: false };
  let dans = base.filter((a) => a.styles.includes(style));
  // Old Money / Clean : jamais de pièce à gros visuel, délavée ou colorée, même si elle est mal rangée.
  if (style === 'oldmoney' && c.id === 'haut') dans = dans.filter((a) => (a.tv || a.type) !== 'vestes' || /blazer|trench|coat|manteau|overshirt|harrington|caban/i.test(a.titre || ''));
  if (['oldmoney', 'clean'].includes(style)) dans = dans.filter((a) => !a.motif || (['uni', 'petit-logo', 'raye', 'carreaux'].includes(a.motif) && NEUTRES.has(a.coul) && a.coul !== 'denim-clair'));
  return dans.length ? { liste: tri(dans), hors: false } : { liste: tri(base.filter((a) => !a.styles.includes('a-verifier'))), hors: true };
}
// ----- Ce qui fait une belle tenue (couleurs et motifs lus sur les photos par vision.mjs) -----
const NEUTRES = new Set(['noir', 'blanc', 'creme', 'gris', 'beige', 'marron', 'marine', 'denim-clair', 'denim-fonce', 'kaki', 'argent']);
const SOMBRES = new Set(['noir', 'gris', 'marron', 'bordeaux', 'denim-fonce', 'marine', 'kaki', 'argent']);
const TERRE = new Set(['kaki', 'noir', 'gris', 'beige', 'marron', 'vert', 'creme']);
const BRUYANTS = new Set(['graphique', 'imprime', 'camouflage', 'carreaux']);
const couleursDe = (a) => [a.coul, ...(a.coul2 || [])].filter(Boolean);
export function noteTenue(p, style, budget) {
  const l = Object.values(p).filter(Boolean); if (!l.length) return 0;
  let n = 0;
  for (const a of l) n += a.photoQ === 'bonne' ? 1 : a.photoQ === 'moyenne' ? -0.6 : a.photoQ ? -4 : 0;
  const vus = l.filter((a) => a.coul);
  if (vus.length >= 2) {
    // Une seule couleur vive, de préférence rappelée par une autre pièce.
    const vives = vus.filter((a) => !NEUTRES.has(a.coul));
    const coulVives = new Set(vives.map((a) => a.coul));
    if (!vives.length) n += 2;
    else if (coulVives.size === 1) n += vus.some((b) => !vives.includes(b) && couleursDe(b).includes(vives[0].coul)) ? 3 : 1;
    else n -= 3 * (coulVives.size - 1);
    // Une seule pièce « forte » (gros visuel, imprimé, camo…).
    const forts = vus.filter((a) => BRUYANTS.has(a.motif)).length;
    n += forts === 0 ? 1 : forts === 1 ? 2 : -3 * (forts - 1);
    // Haut et bas : contraste, ou total noir assumé ; jamais deux fois la même couleur claire.
    const h = p.haut, b = p.bas;
    if (h?.coul && b?.coul) {
      if (h.coul === b.coul) n += h.coul === 'noir' ? (['opium', 'rockstar'].includes(style) ? 1.5 : -0.5) : -2;
      if (h.coul.startsWith('denim') && b.coul.startsWith('denim')) n -= 2;
    }
    // Hors Opium / Rockstar : une tenue a besoin de contraste (pas tout noir).
    if (!['opium', 'rockstar'].includes(style)) { const dist = new Set(vus.map((a) => a.coul)).size; n += dist >= 3 ? 2 : dist === 2 ? 1 : -1; }
    // Short avec des bottes : non.
    if (b?.type === 'shorts' && p.chaussures && BOTTES.test(p.chaussures.titre || '')) n -= 4;
    // Chaussures qui rappellent une couleur du haut ou du bas.
    const ch = p.chaussures;
    if (ch?.coul && [h, b].some((x) => x && couleursDe(x).includes(ch.coul))) n += 1;
    // Selon le style.
    if (['clean', 'oldmoney'].includes(style)) { n -= 2 * vives.length; n -= 2 * forts; }
    if (style === 'opium') n += vus.reduce((t, a) => t + (SOMBRES.has(a.coul) ? 0.5 : -2), 0);
    if (style === 'rockstar') n += vus.reduce((t, a) => t + (SOMBRES.has(a.coul) ? 0.4 : -0.6), 0);
    if (style === 'gorpcore') n += vus.reduce((t, a) => t + (TERRE.has(a.coul) ? 0.5 : -0.3), 0);
  }
  const t = l.reduce((s, a) => s + a.eur, 0);
  return n + Math.min(1, t / budget) * 1.5;
}
const parmiLesMeilleures = (liste, k = 3) => liste.sort((x, y) => y.n - x.n)[Math.floor(Math.random() * Math.min(k, liste.length))];

const casesActives = () => CASES.filter((c) => !c.facultatif || L.accessoire);
const total = () => casesActives().reduce((t, c) => t + (L.pieces[c.id]?.eur ?? 0), 0);

// Tire une tenue complète (les pièces verrouillées restent) sous le budget.
export function composer({ style = L.style, budget = L.budget, accessoire = L.accessoire, garder = true } = {}) {
  const actives = CASES.filter((c) => !c.facultatif || accessoire);
  const fixes = {}; let fixe = 0;
  if (garder) for (const c of actives) if (L.verrous.has(c.id) && L.pieces[c.id]) { fixes[c.id] = L.pieces[c.id]; fixe += L.pieces[c.id].eur; }
  const libres = actives.filter((c) => !fixes[c.id]);
  const pools = Object.fromEntries(libres.map((c) => [c.id, candidats(c, style)]));
  const mins = Object.fromEntries(libres.map((c) => [c.id, Math.min(...pools[c.id].liste.map((a) => a.eur), Infinity)]));
  const min = libres.reduce((t, c) => t + Math.min(...pools[c.id].liste.map((a) => a.eur), Infinity), 0) + fixe;
  if (!isFinite(min) || min > budget) return { ok: false, min, fixe };
  // Tirages au hasard : on garde une tenue qui utilise une bonne partie du budget sans le dépasser.
  const tirages = [];
  for (let essai = 0; essai < 900; essai++) {
    const p = { ...fixes }; let t = fixe;
    for (const c of melangeCases(libres)) {
      const reste = budget - t - libres.filter((x) => !p[x.id] && x !== c).reduce((s, x) => s + mins[x.id], 0);
      const ok = pools[c.id].liste.filter((a) => a.eur <= reste);
      if (!ok.length) { t = Infinity; break; }
      p[c.id] = auHasard(ok); t += p[c.id].eur;
    }
    if (t <= budget) tirages.push({ p, t, n: noteTenue(p, style, budget) });
  }
  if (!tirages.length) return { ok: false, min, fixe };
  const meilleure = parmiLesMeilleures(tirages, 8);
  return { ok: true, pieces: meilleure.p, horsStyle: new Set(libres.filter((c) => pools[c.id].hors).map((c) => c.id)) };
}
const melangeCases = (l) => [...l].sort(() => Math.random() - .5);

function changerUne(caseId) {
  const c = CASES.find((x) => x.id === caseId);
  const autres = casesActives().filter((x) => x.id !== caseId).reduce((t, x) => t + (L.pieces[x.id]?.eur ?? 0), 0);
  const { liste, hors } = candidats(c, L.style);
  const ok = liste.filter((a) => a !== L.pieces[caseId] && a.eur <= L.budget - autres);
  if (!ok.length) { message(`Pas d’autre ${c.nom.toLowerCase()} qui rentre dans le budget avec le reste de la tenue. Monte un peu le budget ou déverrouille une pièce.`, true); return; }
  const essais = Array.from({ length: Math.min(160, ok.length) }, () => auHasard(ok)).map((a) => ({ a, n: noteTenue({ ...L.pieces, [caseId]: a }, L.style, L.budget) }));
  L.pieces[caseId] = parmiLesMeilleures(essais, 4).a;
  hors ? L.horsStyle.add(caseId) : L.horsStyle.delete(caseId);
  dessiner();
}

function proposer() {
  const r = composer();
  if (!r.ok) {
    L.pieces = Object.fromEntries(Object.entries(L.pieces).filter(([k]) => L.verrous.has(k)));
    dessiner();
    const nomStyle = L.style ? S.STYLES[L.style].nom : 'tous styles';
    message(isFinite(r.min)
      ? `Aucune tenue complète ne rentre dans ${euros(L.budget)} € en ${nomStyle}${L.verrous.size ? ' avec tes pièces verrouillées' : ''}. Le minimum possible est d’environ ${euros(r.min)} €.`
      : `Pas assez de pièces avec un prix connu pour composer une tenue en ${nomStyle}.`, true);
    return;
  }
  L.pieces = r.pieces; L.horsStyle = r.horsStyle;
  dessiner();
  lapinDit(`Tenue prête : environ ${euros(total())} € pour ${euros(L.budget)} € de budget.`, 'content');
}

function message(t, alerte = false) { const m = $('#look-message'); m.textContent = t; m.hidden = !t; m.classList.toggle('alerte', alerte); }

function dessiner() {
  message('');
  const box = $('#look-cases'); box.replaceChildren();
  for (const c of casesActives()) {
    const a = L.pieces[c.id];
    const el = document.createElement('div'); el.className = 'look-case'; el.dataset.case = c.id;
    if (!a) {
      el.classList.add('vide');
      el.innerHTML = `<p class="look-case-nom">${c.nom}</p><p class="look-vide">Clique sur « Proposer une tenue »</p>`;
      box.append(el); continue;
    }
    const verrou = L.verrous.has(c.id);
    el.innerHTML = `
      <p class="look-case-nom">${c.nom}${L.horsStyle.has(c.id) ? ' <span class="hors">hors style</span>' : ''}</p>
      <button class="look-photo" type="button"><img alt=""></button>
      <p class="look-titre"></p>
      <div class="look-actions">
        <button class="btn btn-petit btn-fantome look-verrou" type="button" aria-pressed="${verrou}">${verrou ? '🔒 Gardée' : '🔓 Garder'}</button>
        <button class="btn btn-petit btn-fantome look-changer" type="button">↻ Changer</button>
        <a class="btn btn-petit btn-orange" target="_blank" rel="noopener sponsored">LoveGoBuy</a>
      </div>`;
    const ph = $('.look-photo', el); ph.setAttribute('aria-label', `Voir la fiche : ${titre(a)}`);
    photo($('img', ph), a, 500, ph); ph.onclick = () => ouvrirFiche(a);
    $('.look-titre', el).textContent = titre(a);
    $('.look-titre', el).after(prixEl(a));
    $('.look-verrou', el).onclick = () => { verrou ? L.verrous.delete(c.id) : L.verrous.add(c.id); dessiner(); };
    $('.look-changer', el).onclick = () => changerUne(c.id);
    $('.look-changer', el).disabled = verrou;
    $('a', el).href = a.lien;
    box.append(el);
  }
  const complet = casesActives().every((c) => L.pieces[c.id]);
  const t = total();
  $('#look-total').innerHTML = complet ? `Total <strong>≈ ${euros(t)} €</strong> <span>/ budget ${euros(L.budget)} €</span>` : 'Total : —';
  $('#look-total').classList.toggle('depasse', complet && t > L.budget);
  $('#look-enregistrer').disabled = !complet;
  if ([...L.horsStyle].some((k) => casesActives().some((c) => c.id === k))) message(`Il n’y a pas assez de pièces de ce type classées ${S.STYLES[L.style]?.nom} : les cases « hors style » viennent du reste du catalogue.`);
}

function dessinerSauvees() {
  const box = $('#look-sauvees');
  $('#look-sauvees-bloc').hidden = !LOOKS.liste.length;
  box.replaceChildren(...LOOKS.liste.map((lk, i) => {
    const pieces = Object.values(lk.pieces).map((id) => S.PAR_ID.get(id)).filter(Boolean);
    const el = document.createElement('div'); el.className = 'look-sauvee';
    el.innerHTML = '<div class="look-sauvee-photos"></div><p class="look-sauvee-nom"></p><div class="look-actions"></div>';
    const ph = $('.look-sauvee-photos', el);
    for (const a of pieces) { const b = document.createElement('button'); b.type = 'button'; b.className = 'mini-photo'; b.setAttribute('aria-label', titre(a)); const im = document.createElement('img'); im.alt = ''; photo(im, a, 200, b); b.append(im); b.onclick = () => ouvrirFiche(a, pieces); ph.append(b); }
    const t = pieces.reduce((s, a) => s + (a.eur ?? 0), 0);
    $('.look-sauvee-nom', el).textContent = `${lk.nom} · ≈ ${euros(t)} €`;
    const act = $('.look-actions', el);
    const bouton = (txt, f, cls = 'btn-fantome') => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn btn-petit ${cls}`; b.textContent = txt; b.onclick = f; act.append(b); };
    bouton('Reprendre', () => { L.style = lk.style; L.budget = lk.budget; L.accessoire = !!lk.pieces.accessoire; L.pieces = Object.fromEntries(Object.entries(lk.pieces).map(([k, id]) => [k, S.PAR_ID.get(id)]).filter(([, a]) => a)); L.verrous = new Set(Object.keys(L.pieces)); L.horsStyle = new Set(); majControles(); dessiner(); $('#look .look-boite').scrollTop = 0; });
    bouton('Partager', () => copier(lienPartage(lk.nom, Object.values(lk.pieces)), 'Lien de la tenue copié'));
    bouton('Supprimer', () => { LOOKS.liste.splice(i, 1); LOOKS.sauver(); dessinerSauvees(); });
    return el;
  }));
}

function majControles() {
  $$('#look-styles .puce').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === L.style)));
  $('#look-budget').value = L.budget; $('#look-budget-val').textContent = `${euros(L.budget)} €`;
  $('#look-accessoire').checked = L.accessoire;
}

export function ouvrirLook({ style, budget } = {}) {
  if (style !== undefined) L.style = style;
  if (budget) L.budget = budget;
  majControles();
  if (!casesActives().some((c) => L.pieces[c.id])) proposer(); else dessiner();
  dessinerSauvees();
  $('#look').showModal();
}

export function initLook() {
  const styles = S.DATA.meta.styles.filter((s) => s.n && !['a-verifier', 'archive', 'sneakers', 'designer'].includes(s.id));
  $('#look-styles').replaceChildren(...[{ id: '', nom: 'Tous styles' }, ...styles].map((s) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'puce'; b.dataset.style = s.id; b.textContent = s.nom.split(' / ')[0];
    b.onclick = () => { L.style = s.id; L.verrous.clear(); majControles(); proposer(); };
    return b;
  }));
  $('#look-budget').oninput = (e) => { L.budget = Number(e.target.value); $('#look-budget-val').textContent = `${euros(L.budget)} €`; };
  $('#look-budget').onchange = () => proposer();
  $('#look-accessoire').onchange = (e) => { L.accessoire = e.target.checked; proposer(); };
  $('#look-proposer').onclick = proposer;
  $('#look-enregistrer').onclick = () => {
    const nom = (prompt('Nom de la tenue :', `${L.style ? S.STYLES[L.style].court : 'Tenue'} à ${euros(total())} €`) ?? '').trim();
    if (!nom) return;
    LOOKS.liste.unshift({ nom: nom.slice(0, 40), style: L.style, budget: L.budget, pieces: Object.fromEntries(casesActives().map((c) => [c.id, L.pieces[c.id].id])), date: Date.now() });
    LOOKS.sauver(); dessinerSauvees(); toast('Tenue enregistrée dans ce navigateur');
  };
  $('#look-fermer').onclick = () => $('#look').close();
  $('#look').addEventListener('click', (e) => { if (e.target === $('#look')) $('#look').close(); });
  $('#look-note').textContent = `Zinzin associe les pièces d’après leur type, leur style et leur prix, tels qu’on les déduit des titres. Les couleurs, les tailles et les stocks ne sont pas vérifiés : regarde chaque fiche avant de commander. ${NOTE_PRIX}`;
}
