// Point d'entrée : charge les données, l'accueil, les univers, les sélections et le catalogue filtrable.
import { $, $$, S, C, VUS, COULEURS, MOUVEMENT_REDUIT, normal, nombre, euros, titre, photo, melange, lapinDit, lirePartage, surEvt, lire, ecrire } from './noyau.js';
import { carte, ouvrirFiche, initFiche } from './fiche.js';
import { initLook, ouvrirLook, composer } from './look.js';
import { initCollections, ouvrirCollections, afficherPartage, ouvrirSurprise } from './collections.js';
import { initEffets, motsTournants } from './effets.js';
import { initMenu, charger } from './menu.js';
import { initSwipe, ouvrirSwipe } from './swipe.js';

const PAR_LOT = 30;
const etat = { q: '', style: '', type: '', marque: '', min: '', max: '', tri: '' };
let liste = [], affiches = 0;

// Recherche en français ou en anglais : chaque mot peut correspondre à ses équivalents.
const SYNONYMES = {
  pantalon: ['pant', 'trouser', 'jean'], pantalons: ['pant'], jean: ['jean', 'denim'], veste: ['jacket', 'coat', 'veste'], manteau: ['coat', 'parka', 'jacket'],
  pull: ['sweater', 'knit', 'pull', 'jumper'], sweat: ['sweat', 'hoodie', 'crewneck'], chemise: ['shirt', 'chemise', 'button'], chaussure: ['shoe', 'sneaker', 'boot'], chaussures: ['shoe', 'sneaker', 'boot'],
  basket: ['sneaker', 'basket', 'trainer'], baskets: ['sneaker', 'trainer'], botte: ['boot'], bottes: ['boot'], bonnet: ['beanie', 'bonnet', 'knit hat'], casquette: ['cap', 'casquette'],
  sac: ['bag', 'sac'], ceinture: ['belt'], bague: ['ring'], collier: ['necklace', 'chain'], cuir: ['leather', 'cuir'], doudoune: ['puffer', 'down jacket'], survetement: ['tracksuit', 'track'],
  noir: ['black', 'noir'], blanc: ['white', 'blanc'], gris: ['grey', 'gray'], bleu: ['blue'], rouge: ['red'], vert: ['green'], marron: ['brown'], beige: ['beige', 'cream'],
  short: ['short', 'jorts'], lunettes: ['glasses', 'sunglasses'], maillot: ['jersey', 'maillot'],
};
const variantes = (m) => [m, ...(SYNONYMES[m] ?? [])];

function lireURL() { const p = new URLSearchParams(location.search); for (const k of Object.keys(etat)) etat[k] = p.get(k) ?? ''; }
function ecrireURL() {
  const u = new URL(location.href);
  for (const k of Object.keys(etat)) etat[k] ? u.searchParams.set(k, etat[k]) : u.searchParams.delete(k);
  history.replaceState(history.state, '', u);
}

function correspond(a, sauf) {
  const mots = normal(etat.q).split(/\s+/).filter(Boolean);
  return (sauf === 'style' || !etat.style || a.styles.includes(etat.style)) &&
    (sauf === 'type' || !etat.type || a.type === etat.type) &&
    (sauf === 'marque' || !etat.marque || a.marque === etat.marque) &&
    (etat.min === '' || (a.eur ?? -1) >= Number(etat.min)) &&
    (etat.max === '' || (a.eur !== null && a.eur <= Number(etat.max))) &&
    mots.every((m) => variantes(m).some((v) => a._cherche.includes(v)));
}

function filtrer() {
  liste = S.ORDRE.filter((a) => correspond(a));
  const q = normal(etat.q).trim();
  if (etat.tri === 'prix-asc') liste.sort((a, b) => (a.eur ?? 1e9) - (b.eur ?? 1e9));
  else if (etat.tri === 'prix-desc') liste.sort((a, b) => (b.eur ?? -1) - (a.eur ?? -1));
  else if (etat.tri === 'recent') liste.sort((a, b) => (b.ajoute ?? '').localeCompare(a.ajoute ?? ''));
  else if (q) liste.sort((a, b) => score(b, q) - score(a, q)); // pertinence : marque ou début du titre d'abord
}
const score = (a, q) => (normal(a.marque).includes(q) ? 2 : 0) + (normal(titre(a)).startsWith(q) ? 1 : 0) + (a.img ? .5 : 0);

// ---------- Rendu du catalogue (par lots, pour ne pas mettre 5 000 cartes dans la page) ----------
function afficherSuite() {
  const frag = document.createDocumentFragment();
  liste.slice(affiches, affiches + PAR_LOT).forEach((a, i) => frag.append(carte(a, { i, liste })));
  affiches += PAR_LOT;
  $('#grille').append(frag);
  $('#plus').hidden = affiches >= liste.length;
}

function rendre({ defile = false } = {}) {
  filtrer(); ecrireURL();
  $('#grille').replaceChildren(); affiches = 0; afficherSuite();
  $('#resultat').innerHTML = `<b>${nombre(liste.length)}</b> pièce${liste.length > 1 ? 's' : ''}`;
  $('#nb-panneau').textContent = nombre(liste.length);
  pastilles(); majPanneau(); majTypesRapides(); vide();
  $('#q').value = etat.q; $('#q-accueil').value = etat.q; $('#tri').value = etat.tri;
  if (defile) $('#catalogue').scrollIntoView({ behavior: MOUVEMENT_REDUIT ? 'auto' : 'smooth' });
}
const changer = (k, v, opt) => { etat[k] = v; rendre(opt); };

// Filtres actifs en pastilles supprimables.
function pastilles() {
  const p = [];
  if (etat.q) p.push(['q', `« ${etat.q} »`]);
  if (etat.style) p.push(['style', S.STYLES[etat.style]?.nom ?? etat.style]);
  if (etat.type) p.push(['type', S.TYPES[etat.type]?.nom ?? etat.type]);
  if (etat.marque) p.push(['marque', etat.marque]);
  if (etat.min || etat.max) p.push(['budget', etat.min && etat.max ? `${etat.min} à ${etat.max} €` : etat.min ? `dès ${etat.min} €` : `jusqu’à ${etat.max} €`]);
  const box = $('#pastilles');
  box.replaceChildren(...p.map(([k, t]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pastille'; b.innerHTML = '<span></span><span aria-hidden="true">✕</span>';
    b.firstChild.textContent = t; b.setAttribute('aria-label', `Enlever le filtre ${t}`);
    b.onclick = () => { if (k === 'budget') { etat.min = ''; etat.max = ''; } else etat[k] = ''; rendre(); };
    return b;
  }));
  if (p.length) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pastille effacer'; b.textContent = 'Tout effacer'; b.onclick = toutEffacer; box.append(b); }
  box.hidden = !p.length;
  const n = p.filter(([k]) => k !== 'q').length;
  $('#nb-filtres').textContent = n; $('#nb-filtres').hidden = !n;
}
function toutEffacer() { for (const k of Object.keys(etat)) etat[k] = ''; rendre(); }

// Résultat vide : le lapin propose quoi enlever (le filtre qui libère le plus de pièces).
function vide() {
  const v = $('#vide'); v.hidden = liste.length > 0;
  if (liste.length) return;
  const sugg = $('#vide-suggestions'); sugg.replaceChildren();
  const essais = ['marque', 'type', 'style', 'budget', 'q'].filter((k) => k === 'budget' ? etat.min || etat.max : etat[k]).map((k) => {
    const sauve = { ...etat }; if (k === 'budget') { etat.min = ''; etat.max = ''; } else etat[k] = '';
    const n = S.ORDRE.filter((a) => correspond(a)).length; Object.assign(etat, sauve);
    return { k, n };
  }).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const nom = { marque: 'la marque', type: 'le type', style: 'le style', budget: 'le budget', q: 'la recherche' };
  for (const { k, n } of essais.slice(0, 3)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-fantome btn-petit';
    b.textContent = `Sans ${nom[k]} : ${nombre(n)} pièce${n > 1 ? 's' : ''}`;
    b.onclick = () => { if (k === 'budget') { etat.min = ''; etat.max = ''; } else etat[k] = ''; rendre(); };
    sugg.append(b);
  }
  $('#vide-texte').textContent = essais.length ? 'Rien avec tous ces filtres à la fois. Enlève-en un :' : 'Essaie un autre mot, en anglais ça marche souvent mieux (jacket, pants, hoodie…).';
}

// ---------- Panneau de filtres ----------
function majPanneau() {
  const compte = (k, val) => S.ORDRE.filter((a) => correspond(a, k) && (k === 'style' ? a.styles.includes(val) : k === 'type' ? a.type === val : a.marque === val)).length;
  const puces = (box, k, items) => box.replaceChildren(...items.map(({ id, nom }) => {
    const n = id ? compte(k, id) : null;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'puce'; b.setAttribute('aria-pressed', String(etat[k] === id));
    b.textContent = nom; if (n !== null) { const s = document.createElement('small'); s.textContent = nombre(n); b.append(s); }
    b.disabled = n === 0 && etat[k] !== id;
    b.onclick = () => changer(k, etat[k] === id ? '' : id);
    return b;
  }));
  if (!$('#panneau').open) return;
  puces($('#f-style'), 'style', [{ id: '', nom: 'Tous' }, ...S.DATA.meta.styles.filter((s) => s.n)]);
  puces($('#f-type'), 'type', [{ id: '', nom: 'Tous' }, ...S.DATA.meta.types.filter((t) => t.n)]);
  const filtre = normal($('#f-marque-q').value);
  const marques = S.DATA.meta.marques.filter((m) => !filtre || normal(m.nom).includes(filtre)).slice(0, filtre ? 40 : 24);
  if (etat.marque && !marques.some((m) => m.nom === etat.marque)) marques.unshift({ nom: etat.marque });
  puces($('#f-marque'), 'marque', marques.map((m) => ({ id: m.nom, nom: m.nom })));
  $('#f-min').value = etat.min; $('#f-max').value = etat.max;
}
function majTypesRapides() {
  const n = {}; for (const a of S.ORDRE) if (correspond(a, 'type')) n[a.type] = (n[a.type] ?? 0) + 1;
  for (const b of $$('#types-rapides .puce')) {
    b.setAttribute('aria-pressed', String(b.dataset.type === etat.type));
    const v = b.dataset.type ? n[b.dataset.type] ?? 0 : Object.values(n).reduce((x, y) => x + y, 0);
    $('small', b).textContent = nombre(v);
    b.hidden = !!b.dataset.type && !v && etat.type !== b.dataset.type;
  }
}

// ---------- Accueil ----------
function accueil() {
  const m = S.DATA.meta;
  $('#stat-total').textContent = nombre(S.DATA.articles.length);
  $('#stat-marques').textContent = nombre(m.marques.length);
  // Suggestions de recherche : les marques les plus présentes + quelques pièces types.
  const sugg = [...m.marques.slice(0, 4).map((x) => x.nom), 'jorts', 'cargo', 'leather jacket'];
  $('#sugg').replaceChildren(...sugg.map((t) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'puce'; b.textContent = t; b.onclick = () => changer('q', t, { defile: true }); return b; }));
  // Pièces détourées autour du lapin (au clic : la fiche).
  fetch('data/vitrine.json').then((r) => r.json()).then((vitrine) => {
    const nb = matchMedia('(max-width: 759px)').matches ? 4 : 8;
    const pool = melange(vitrine.filter((v) => S.PAR_ID.has(v.id)), Date.now() % 100000);
    let lot = 0;
    const poser = () => {
    const items = Array.from({ length: Math.min(nb, pool.length) }, (_, k) => pool[(lot * nb + k) % pool.length]);
    $('#orbite').replaceChildren(...items.map((v, i) => {
      const ang = -Math.PI / 2 + (i + .5) * (2 * Math.PI / items.length), w = i % 2 ? 18 : 23;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'vole'; const a = S.PAR_ID.get(v.id);
      b.setAttribute('aria-label', `Voir la fiche : ${titre(a)}`);
      b.style.cssText = `left:${50 + 45 * Math.cos(ang) - w / 2}%;top:${47 + 43 * Math.sin(ang) - w / 2}%;--w:${w}%;--r:${Math.round(Math.sin(i * 2.3) * 10)}deg;--d:${120 + i * 70}ms;--t:${5 + (i % 3)}s`;
      const img = document.createElement('img'); img.src = v.img; img.alt = ''; b.append(img); b.onclick = () => ouvrirFiche(a, items.map((x) => S.PAR_ID.get(x.id)));
      return b;
    }));
    };
    poser();
    if (!MOUVEMENT_REDUIT && pool.length > nb) setInterval(() => {
      if (document.hidden || $('#haut').classList.contains('pause')) return;
      $('#orbite').classList.add('change');
      setTimeout(() => { lot++; poser(); $('#orbite').classList.remove('change'); }, 450);
    }, 5000);
  }).catch(() => {});
  // Les animations de l'accueil s'arrêtent dès qu'il n'est plus à l'écran.
  new IntersectionObserver(([e]) => $('#haut').classList.toggle('pause', !e.isIntersecting)).observe($('#haut'));
  $('#lapin').onclick = () => { $('#lapin').classList.remove('boing'); void $('#lapin').offsetWidth; $('#lapin').classList.add('boing'); ouvrirSurprise({}); };
}

// ---------- Univers (couvertures) ----------
function univers(couv) {
  const ids = S.DATA.meta.styles.filter((s) => s.n && s.id !== 'a-verifier').map((s) => s.id);
  $('#univers-grille').replaceChildren(...ids.map((id) => {
    const s = S.STYLES[id], pieces = couv[id] ?? [];
    const b = document.createElement('button'); b.type = 'button'; b.className = `couv couv-${pieces.length}`; b.dataset.style = id; b.dataset.revele = ''; b.style.setProperty('--delai', `${(ids.indexOf(id) % 5) * 70}ms`);
    if (id === 'sneakers') b.classList.add('couv-paires');
    b.style.setProperty('--c', COULEURS[id]);
    b.innerHTML = `<span class="couv-pieces" aria-hidden="true">${pieces.map((p, i) => `<img class="p${i + 1} ${p.case}" src="${p.img}" alt="" loading="lazy">`).join('')}</span>
      <span class="couv-texte"><span class="couv-n">${nombre(s.n)} pièces</span><span class="couv-nom"></span><span class="couv-desc"></span></span>`;
    $('.couv-nom', b).textContent = s.nom; $('.couv-desc', b).textContent = s.desc;
    b.onclick = () => { etat.style = id; rendre({ defile: true }); };
    return b;
  }));
}

// ---------- Sélections éditoriales (calculées sur les vraies données) ----------
function rail(titreRail, phrase, articles, { voir, extra } = {}) {
  if (!articles.length) return null;
  const sec = document.createElement('section'); sec.className = 'rail';
  sec.innerHTML = `<header class="rail-tete"><img class="avatar" alt="" width="40" height="40"><div><h3></h3><p></p></div></header><div class="rail-piste"></div>`;
  $('.avatar', sec).src = S.DATA.meta.image;
  $('h3', sec).textContent = titreRail; $('p', sec).textContent = phrase;
  $('.rail-piste', sec).append(...articles.map((a, i) => carte(a, { i, liste: articles, petite: true })));
  if (voir) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-fantome btn-petit rail-voir'; b.textContent = voir.texte; b.onclick = voir.action; $('.rail-tete', sec).append(b); }
  if (extra) $('.rail-tete', sec).after(extra);
  return sec;
}
function selections() {
  const avecPhoto = S.ORDRE.filter((a) => a.img && a.eur > 0);
  const voirFiltre = (f) => () => { for (const k of Object.keys(etat)) etat[k] = ''; Object.assign(etat, f); rendre({ defile: true }); };
  const rails = [];
  const clean = avecPhoto.filter((a) => a.styles.includes('clean'));
  rails.push(rail('Basiques sans gros logo', `Les ${clean.length} pièces de la catégorie Clean, rien d’autre.`, clean.slice(0, 12), { voir: { texte: 'Tout voir', action: voirFiltre({ style: 'clean' }) } }));
  const look = composer({ style: 'streetwear', budget: 80, accessoire: false, garder: false });
  if (look.ok) {
    const pieces = Object.values(look.pieces), t = pieces.reduce((s, a) => s + a.eur, 0);
    rails.push(rail('Une tenue complète à moins de 80 €', `Haut, bas et chaussures Streetwear tirés au hasard : ≈ ${euros(t)} € au total, hors frais.`, pieces, { voir: { texte: 'Composer la mienne', action: () => ouvrirLook({ style: 'streetwear', budget: 80 }) } }));
  }
  const paires = avecPhoto.filter((a) => a.styles.includes('sneakers') && a.eur < 50);
  rails.push(rail('Sneakers à moins de 50 €', `${paires.length} paires dans le catalogue sous ce prix.`, paires.slice(0, 12), { voir: { texte: 'Tout voir', action: voirFiltre({ style: 'sneakers', max: '50' }) } }));
  const hiver = avecPhoto.filter((a) => a.styles.includes('hiver') && ['haut', 'bas', 'chaussures', 'accessoire'].includes(S.GROUPE[a.type]));
  const rHiver = rail('Spécial hiver ❄', `${nombre(hiver.length)} pièces pour passer l’hiver au chaud : doudounes, maille, bonnets, polaires.`, hiver.slice(0, 14), { voir: { texte: 'Tout voir', action: voirFiltre({ style: 'hiver' }) } });
  if (rHiver) { rHiver.classList.add('rail-hiver'); rHiver.prepend(Object.assign(document.createElement('canvas'), { className: 'neige', ariaHidden: 'true' })); }
  rails.push(rHiver);
  const cuir = avecPhoto.filter((a) => a.styles.includes('rockstar') && a.type === 'vestes');
  rails.push(rail('Vestes Rockstar', 'Cuir, clous, bombers usés : les vestes classées Rockstar / Grunge.', cuir.slice(0, 12), { voir: { texte: 'Tout voir', action: voirFiltre({ style: 'rockstar', type: 'vestes' }) } }));
  $('#rails').replaceChildren(...rails.filter(Boolean));
  majVus();
}
function majVus() {
  const vus = VUS.ids.map((id) => S.PAR_ID.get(id)).filter(Boolean).slice(0, 12);
  const r = rail('Vu récemment', 'Les dernières fiches que tu as ouvertes (gardées dans ce navigateur).', vus);
  $('#rail-vus').replaceChildren(...(r ? [r] : []));
}

// ---------- Démarrage ----------
const p0 = new URLSearchParams(location.search);
function construire(d, couv) {
  S.DATA = d;
  const m = d.meta;
  S.STYLES = Object.fromEntries(m.styles.map((s) => [s.id, { ...s, court: s.nom.split(' / ')[0] }]));
  S.TYPES = Object.fromEntries(m.types.map((t) => [t.id, t]));
  S.GROUPE = Object.fromEntries(m.types.map((t) => [t.id, t.groupe]));
  for (const a of d.articles) {
    a.eur ??= null; S.PAR_ID.set(a.id, a);
    a._cherche = ` ${normal([a.titre, a.marque, a.categorieSource, S.TYPES[a.type]?.nom, ...a.styles.map((s) => S.STYLES[s]?.nom)].join(' '))} `;
  }
  // Mélange du jour, pièces avec photo d'abord.
  const mel = melange(d.articles);
  // Vêtements et chaussures avec photo d'abord ; high-tech, objets et pièces sans photo à la fin.
  const rang = (a) => (a.img ? 0 : 2) + (['tech', 'autres'].includes(a.type) ? 1 : 0);
  S.ORDRE = [0, 1, 2, 3].flatMap((r) => mel.filter((a) => rang(a) === r));

  for (const el of $$('[data-perso]')) el.textContent = m.perso;
  for (const el of $$('[data-perso-img]')) el.src = m.image;
  document.title = `Les finds de ${m.perso}`;
  for (const id of ['#lien-lgb', '#lien-lgb-barre']) { const l = $(id); if (m.inscription) l.href = m.inscription; else l.hidden = true; }
  if (m.discord) { const l = $('#lien-discord'); l.href = m.discord; l.hidden = false; }
  $('#code-parrain').textContent = m.code ?? '';
  if (m.couponMontant && m.inscription) {
    $('#lgb').hidden = false; $('#lgb-coupon').textContent = m.coupon; $('#lgb-inscription').href = m.inscription;
    const c = $('[data-compte]'); c.dataset.compte = m.couponMontant; c.dataset.suffixe = ' ' + m.couponDevise;
  }
  for (const el of $$('[data-img]')) el.src = m[el.dataset.img] || m.image;
  if (m.credits?.length) { const p = $('#credits'); p.hidden = false; p.textContent = `Merci aux finders dont on a repris les articles : ${m.credits.map((c) => c.nom).join(', ')}.`; }

  initFiche(); initLook(); initCollections();
  accueil(); univers(couv); selections();

  $('#types-rapides').replaceChildren(...[{ id: '', nom: 'Tout' }, ...m.types.filter((t) => t.n)].map((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'puce'; b.dataset.type = t.id; b.append(t.nom, document.createElement('small'));
    b.onclick = () => changer('type', t.id && etat.type !== t.id ? t.id : ''); return b;
  }));

  // Recherche (accueil + barre collante, synchronisées).
  let tq;
  const surRecherche = (e) => { clearTimeout(tq); tq = setTimeout(() => { etat.q = e.target.value.trim(); rendre(); }, 150); };
  $('#q').addEventListener('input', surRecherche);
  $('#q-accueil').addEventListener('input', surRecherche);
  $('#form-accueil').onsubmit = (e) => { e.preventDefault(); etat.q = $('#q-accueil').value.trim(); rendre({ defile: true }); };
  $('#form-barre').onsubmit = (e) => { e.preventDefault(); $('#q').blur(); };
  $('#tri').onchange = (e) => changer('tri', e.target.value);
  $('#ouvrir-filtres').onclick = () => { $('#panneau').showModal(); majPanneau(); };
  $('#panneau-fermer').onclick = () => $('#panneau').close();
  $('#panneau-voir').onclick = () => { $('#panneau').close(); $('#catalogue').scrollIntoView({ behavior: MOUVEMENT_REDUIT ? 'auto' : 'smooth' }); };
  $('#panneau-effacer').onclick = toutEffacer;
  $('#panneau').addEventListener('click', (e) => { if (e.target === $('#panneau')) $('#panneau').close(); });
  $('#f-marque-q').addEventListener('input', majPanneau);
  const budget = () => { const a = $('#f-min').value, b = $('#f-max').value; etat.min = a === '' ? '' : String(Math.max(0, Number(a))); etat.max = b === '' ? '' : String(Math.max(0, Number(b))); rendre(); };
  $('#f-min').onchange = budget; $('#f-max').onchange = budget;
  for (const b of $$('#f-budgets .puce')) b.onclick = () => { etat.min = b.dataset.min; etat.max = b.dataset.max; rendre(); };
  $('#vide-effacer').onclick = toutEffacer;
  $('#plus').onclick = afficherSuite;
  new IntersectionObserver((e) => { if (e[0].isIntersecting && affiches < liste.length) afficherSuite(); }, { rootMargin: '1200px' }).observe($('#suite'));

  $('#ouvrir-look').onclick = () => ouvrirLook();
  $('#ouvrir-look-2').onclick = () => ouvrirLook();
  $('#ouvrir-look-3').onclick = () => ouvrirLook();
  $('#ouvrir-surprise').onclick = () => ouvrirSurprise({});
  $('#ouvrir-collections').onclick = () => ouvrirCollections();
  const majNb = () => { const n = C.total(); $('#nb-coll').textContent = n; $('#nb-coll').hidden = !n; };
  surEvt('collections', majNb); majNb();
  surEvt('vus', majVus);

  rendre();
  initEffets();
  initSwipe();
  const aller = (sel) => charger(() => $(sel).scrollIntoView({ behavior: 'auto' }));
  initMenu({
    catalogue: () => aller('#catalogue'),
    univers: () => aller('#univers'),
    look: () => charger(() => ouvrirLook()),
    swipe: () => charger(() => ouvrirSwipe()),
    coupons: () => aller(m.couponMontant ? '#lgb' : '#catalogue'),
    favoris: () => ouvrirCollections(),
  });
  if (m.couponMontant) $('#menu-coupon').textContent = `${m.couponMontant} ${m.couponDevise} de coupons`;
  // Intro : le lapin surgit et le nom s'assemble (une fois par visite, coupée si on réduit les animations).
  let vue = false; try { vue = sessionStorage.getItem('zinzin-intro') === '1'; sessionStorage.setItem('zinzin-intro', '1'); } catch {}
  if (!vue && !MOUVEMENT_REDUIT && !p0.get('article') && !p0.get('selection')) {
    const intro = $('#intro'); intro.hidden = false;
    $('#intro-nom').textContent = m.perso;
    setTimeout(() => intro.classList.add('fin'), 1300); setTimeout(() => (intro.hidden = true), 1900);
  }
  motsTournants($('#mot-tournant'), m.styles.filter((s) => s.n && !['a-verifier', 'designer', 'archive'].includes(s.id)).map((s) => s.nom.split(' / ')[0].toLowerCase()));
  // Liens partagés : ?article=…, ?selection=…, ou des filtres (?style=…) → on va direct au bon endroit.
  const p = new URLSearchParams(location.search);
  const art = p.get('article') && S.PAR_ID.get(p.get('article'));
  const partage = lirePartage(p);
  if (art) ouvrirFiche(art, liste);
  else if (partage) afficherPartage(partage);
  else if (Object.values(etat).some(Boolean)) requestAnimationFrame(() => $('#catalogue').scrollIntoView());
  // Petit mot du lapin à la toute première visite seulement.
  if (!lire('zinzin-salue', false)) { ecrire('zinzin-salue', true); setTimeout(() => lapinDit(`Salut ! ${nombre(d.articles.length)} pièces à fouiller. Commence par un univers ou tape ce que tu cherches.`), 1200); }
}

// Accès en lecture pour les tests automatiques (aucun effet sur le site).
window.zinzin = { etat, S, C, get liste() { return liste; }, rendre };

lireURL();
Promise.all([fetch('data/articles.json').then((r) => r.json()), fetch('data/couvertures.json').then((r) => r.json()).catch(() => ({}))])
  .then(([d, couv]) => construire(d, couv))
  .catch((e) => { console.error(e); $('#resultat').textContent = 'Impossible de charger les articles. Recharge la page.'; });
