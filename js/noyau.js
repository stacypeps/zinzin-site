// Noyau partagé : données, utilitaires, stockage local, mascotte.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const MOUVEMENT_REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const S = { DATA: null, STYLES: {}, TYPES: {}, GROUPE: {}, PAR_ID: new Map(), ORDRE: [] };

export const COULEURS = {
  clean: '#e8e0d2', rockstar: '#ff5a5f', streetwear: '#ff7a1a', gorpcore: '#7ccf8a', oldmoney: '#d6b27a',
  y2k: '#ff7fd8', opium: '#a796ff', designer: '#f2c94c', archive: '#c9c2b8', sneakers: '#5cc2ff', hiver: '#9fd3ff', 'a-verifier': '#8c8178',
};
export const PLATEFORME = { taobao: 'Taobao', weidian: 'Weidian', '1688': '1688' };
const ORIGINE = { taobao: (id) => `https://item.taobao.com/item.htm?id=${id}`, weidian: (id) => `https://weidian.com/item.html?itemID=${id}`, '1688': (id) => `https://detail.1688.com/offer/${id}.html` };
export const origine = (a) => ORIGINE[a.plateforme]?.(a.pid) ?? '';
const SYMBOLE = { CNY: '¥', USD: '$', EUR: '€', GBP: '£' };

export const normal = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const nombre = (n) => Number(n).toLocaleString('fr-FR');
export const euros = (n) => (n < 10 ? String(Math.round(n * 2) / 2).replace('.', ',') : nombre(Math.round(n)));
export const titre = (a) => a.titreCourt ?? a.titre;
export const prixOrigine = (a) => (a.prix && a.prix.devise !== 'EUR' ? `${nombre(a.prix.v)} ${SYMBOLE[a.prix.devise] ?? a.prix.devise}` : '');
export const NOTE_PRIX = 'Estimation en euros, hors livraison et frais. Le vrai prix est sur la page LoveGoBuy.';

// Miniatures : les CDN savent redimensionner, ça divise le poids des images par 5.
export function mini(u, w = 400) {
  if (!u) return '';
  if (/alicdn\.com/.test(u) && !/_\d+x\d+/.test(u)) return `${u}_${w}x${w}q80.jpg`;
  if (/googleusercontent\.com\//.test(u)) return u.replace(/=w\d+$/, `=w${w}`);
  if (/geilicdn\.com/.test(u)) { try { const x = new URL(u); x.searchParams.set('w', w); x.searchParams.set('h', w); return x.href; } catch {} }
  return u;
}
// Charge une photo : miniature, puis original, puis « photo indisponible ».
export function photo(img, a, w, cadre) {
  const essais = [mini(a.img, w), a.img].filter((x, i, t) => x && t.indexOf(x) === i);
  img.referrerPolicy = 'no-referrer';
  const suivant = () => {
    const u = essais.shift();
    if (u) img.src = u;
    else { img.removeAttribute('src'); img.onerror = null; cadre?.classList.add('sans-photo', 'charge'); }
  };
  img.onload = () => cadre?.classList.add('charge');
  img.onerror = suivant;
  suivant();
}

export function melange(liste, graine = Number(new Date().toISOString().slice(0, 10).replaceAll('-', ''))) {
  let g = graine;
  const alea = () => { g |= 0; g = (g + 0x6d2b79f5) | 0; let t = Math.imul(g ^ (g >>> 15), 1 | g); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const auHasard = (l) => l[Math.floor(Math.random() * l.length)];

// ---------- Petits événements entre modules ----------
const ecoutes = {};
export const surEvt = (n, f) => (ecoutes[n] ??= []).push(f);
export const evt = (n, d) => (ecoutes[n] ?? []).forEach((f) => f(d));

// ---------- Toast & mascotte ----------
let toastT;
export function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('visible');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('visible'), 2200);
}
// La mascotte parle discrètement en bas de l'écran (pas de son, ça disparaît tout seul).
let lapinT;
export function lapinDit(texte, humeur = 'normal') {
  const b = $('#lapin-bulle');
  $('img', b).src = 'assets/logo-z.svg';
  $('p', b).textContent = texte;
  b.hidden = false; requestAnimationFrame(() => b.classList.add('visible'));
  clearTimeout(lapinT); lapinT = setTimeout(() => { b.classList.remove('visible'); setTimeout(() => (b.hidden = true), 300); }, 4200);
}

// ---------- Stockage local (ce navigateur seulement) ----------
export function lire(cle, defaut) { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; } }
export function ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch { return false; } }

const CLE_COLL = 'zinzin-collections-v1', CLE_VUS = 'zinzin-vus-v1';
export const C = {
  listes: lire(CLE_COLL, null) ?? [{ id: 'favoris', nom: 'Favoris', ids: lire('finds-favoris', []) }],
  sauver() { ecrire(CLE_COLL, this.listes); evt('collections'); },
  liste(id) { return this.listes.find((l) => l.id === id); },
  dans(articleId) { return this.listes.filter((l) => l.ids.includes(articleId)); },
  estFavori(articleId) { return this.liste('favoris').ids.includes(articleId); },
  basculer(listeId, articleId) {
    const l = this.liste(listeId); if (!l) return false;
    const i = l.ids.indexOf(articleId);
    if (i >= 0) l.ids.splice(i, 1); else l.ids.unshift(articleId);
    this.sauver(); return i < 0;
  },
  creer(nom, ids = []) {
    const l = { id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, nom: nom.trim().slice(0, 40) || 'Sans nom', ids: [...new Set(ids)] };
    this.listes.push(l); this.sauver(); return l;
  },
  renommer(id, nom) { const l = this.liste(id); if (l && nom.trim()) { l.nom = nom.trim().slice(0, 40); this.sauver(); } },
  supprimer(id) { if (id === 'favoris') return; this.listes = this.listes.filter((l) => l.id !== id); this.sauver(); },
  total() { return new Set(this.listes.flatMap((l) => l.ids)).size; },
};
if (!C.liste('favoris')) C.listes.unshift({ id: 'favoris', nom: 'Favoris', ids: [] });

export const VUS = {
  ids: lire(CLE_VUS, []),
  ajouter(id) { this.ids = [id, ...this.ids.filter((x) => x !== id)].slice(0, 30); ecrire(CLE_VUS, this.ids); evt('vus'); },
  vider() { this.ids = []; ecrire(CLE_VUS, []); evt('vus'); },
};

// ---------- Partage par lien (aucun serveur : la sélection est dans l'adresse) ----------
const CODE = { taobao: 't', weidian: 'w', '1688': 'a' }, DECODE = { t: 'taobao', w: 'weidian', a: '1688' };
export function lienPartage(nom, ids) {
  const court = ids.map((id) => { const [p, n] = id.split(':'); return CODE[p] + n; }).join('.');
  const u = new URL(location.href.split('?')[0].split('#')[0]);
  u.searchParams.set('selection', court); u.searchParams.set('nom', nom.slice(0, 40));
  return u.href;
}
export function lirePartage(p) {
  const s = p.get('selection'); if (!s) return null;
  const ids = s.split('.').map((x) => DECODE[x[0]] && /^\d{5,}$/.test(x.slice(1)) ? `${DECODE[x[0]]}:${x.slice(1)}` : null).filter(Boolean);
  return ids.length ? { nom: (p.get('nom') || 'Sélection partagée').slice(0, 40), ids } : null;
}
export async function copier(texte, ok = 'Lien copié') {
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ url: texte }); return; }
    await navigator.clipboard.writeText(texte); toast(ok);
  } catch (e) { if (e?.name !== 'AbortError') prompt('Copie ce lien :', texte); }
}
