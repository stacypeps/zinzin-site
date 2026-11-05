// Collections nommées, vus récemment, tenues sauvegardées, sélection partagée et « Surprends-moi ».
import { $, $$, S, C, VUS, euros, titre, toast, lapinDit, copier, lienPartage, surEvt, auHasard } from './noyau.js';
import { carte, ouvrirFiche } from './fiche.js';
import { LOOKS, ouvrirLook } from './look.js';

let ouverte = 'favoris';

function grille(ids, { retirer } = {}) {
  const articles = ids.map((id) => S.PAR_ID.get(id)).filter(Boolean);
  const g = document.createElement('div'); g.className = 'grille grille-petite';
  articles.forEach((a, i) => {
    const c = carte(a, { i, liste: articles, petite: true });
    if (retirer) { const b = document.createElement('button'); b.type = 'button'; b.className = 'retirer'; b.textContent = 'Retirer'; b.setAttribute('aria-label', `Retirer ${titre(a)}`); b.onclick = () => retirer(a.id); $('.carte-corps', c).append(b); }
    g.append(c);
  });
  return { g, n: articles.length, manquants: ids.length - articles.length };
}

export function dessinerCollections() {
  if (!$('#collections').open) return;
  const nav = $('#coll-liste');
  nav.replaceChildren(...C.listes.map((l) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'puce'; b.setAttribute('aria-pressed', String(l.id === ouverte));
    b.textContent = `${l.id === 'favoris' ? '♥ ' : ''}${l.nom}`; const s = document.createElement('small'); s.textContent = l.ids.length; b.append(s);
    b.onclick = () => { ouverte = l.id; dessinerCollections(); };
    return b;
  }), Object.assign(document.createElement('button'), { type: 'button', className: 'puce puce-ajout', textContent: '+ Nouvelle', onclick: () => { const nom = prompt('Nom de la collection (ex. « hiver », « prochaine commande ») :'); if (nom?.trim()) { ouverte = C.creer(nom).id; } } }));
  const l = C.liste(ouverte) ?? C.liste('favoris'); ouverte = l.id;
  $('#coll-titre').textContent = l.nom;
  const { g, n, manquants } = grille(l.ids, { retirer: (id) => C.basculer(l.id, id) });
  $('#coll-contenu').replaceChildren(n ? g : Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: l.id === 'favoris' ? 'Pas encore de favoris. Touche le ♥ d’une pièce pour la garder ici.' : 'Collection vide. Ajoute des pièces depuis leur fiche (« Ajouter à une collection »).' }));
  if (manquants) $('#coll-contenu').append(Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: `${manquants} pièce(s) ne sont plus dans le catalogue.` }));
  const t = l.ids.map((id) => S.PAR_ID.get(id)?.eur ?? 0).reduce((a, b) => a + b, 0);
  $('#coll-total').textContent = n ? `${n} pièce${n > 1 ? 's' : ''} · ≈ ${euros(t)} € au total (estimation hors frais)` : '';
  $('#coll-renommer').hidden = $('#coll-supprimer').hidden = l.id === 'favoris';
  $('#coll-partager').disabled = !n;
  // Vus récemment + tenues
  const vus = grille(VUS.ids.slice(0, 12));
  $('#coll-vus').replaceChildren(vus.n ? vus.g : Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: 'Rien pour l’instant.' }));
  $('#coll-looks').replaceChildren(...(LOOKS.liste.length ? LOOKS.liste.map((lk) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-fantome btn-petit';
    b.textContent = lk.nom; b.onclick = () => { $('#collections').close(); ouvrirLook({ style: lk.style, budget: lk.budget }); };
    return b;
  }) : [Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: 'Aucune tenue enregistrée. Essaie « Compose ton look ».' })]));
}
surEvt('collections', dessinerCollections);
surEvt('vus', dessinerCollections);
surEvt('looks', dessinerCollections);

export function ouvrirCollections(id) { if (id) ouverte = id; $('#collections').showModal(); dessinerCollections(); }

// Sélection reçue par lien : on l'affiche et on propose de l'enregistrer.
export function afficherPartage(p) {
  const d = $('#partage');
  $('#partage-titre').textContent = p.nom;
  const { g, n, manquants } = grille(p.ids);
  $('#partage-contenu').replaceChildren(g);
  $('#partage-info').textContent = `${n} pièce${n > 1 ? 's' : ''}${manquants ? ` (${manquants} plus disponible${manquants > 1 ? 's' : ''})` : ''}. Rien n’est enregistré tant que tu ne cliques pas sur « Garder ».`;
  $('#partage-garder').onclick = () => { const l = C.creer(p.nom, p.ids.filter((id) => S.PAR_ID.has(id))); d.close(); toast(`Collection « ${l.nom} » ajoutée`); };
  d.showModal();
}

// ---------- Surprends-moi ----------
const SUR = { style: '', max: 60 };
function tirer() {
  const pool = S.ORDRE.filter((a) => a.img && a.eur > 0 && a.eur <= SUR.max && (!SUR.style || a.styles.includes(SUR.style)) && S.GROUPE[a.type] !== 'autre');
  const box = $('#surprise-contenu');
  if (!pool.length) { box.replaceChildren(Object.assign(document.createElement('p'), { className: 'vide-petit', textContent: 'Rien sous ce budget dans ce style. Monte un peu le budget.' })); lapinDit('Rien trouvé sous ce budget… monte un peu ?', 'confus'); return; }
  // Une pièce par type autant que possible, pour varier.
  const parType = {}; for (const a of [...pool].sort(() => Math.random() - .5)) (parType[a.type] ??= []).push(a);
  const choix = []; const types = Object.keys(parType).sort(() => Math.random() - .5);
  for (let i = 0; choix.length < 6 && i < 6; i++) for (const t of types) if (parType[t][i] && choix.length < 6) choix.push(parType[t][i]);
  box.replaceChildren(...choix.map((a, i) => carte(a, { i, liste: choix, petite: true })));
  $('#surprise-intro').textContent = `${choix.length} pièce${choix.length > 1 ? 's' : ''}${SUR.style ? ` ${S.STYLES[SUR.style].court}` : ''} à moins de ${euros(SUR.max)} €, tirées au hasard dans ${pool.length.toLocaleString('fr-FR')} possibles.`;
}
export function ouvrirSurprise({ style, max } = {}) {
  if (style !== undefined) SUR.style = style; if (max) SUR.max = max;
  $('#surprise-style').value = SUR.style; $('#surprise-max').value = SUR.max;
  tirer(); $('#surprise').showModal();
}

export function initCollections() {
  const d = $('#collections');
  $('#coll-fermer').onclick = () => d.close();
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  $('#coll-renommer').onclick = () => { const l = C.liste(ouverte); const nom = prompt('Nouveau nom :', l.nom); if (nom) C.renommer(l.id, nom); };
  $('#coll-supprimer').onclick = () => { const l = C.liste(ouverte); if (confirm(`Supprimer la collection « ${l.nom} » ? Les pièces restent dans le catalogue.`)) { C.supprimer(l.id); ouverte = 'favoris'; dessinerCollections(); } };
  $('#coll-partager').onclick = () => { const l = C.liste(ouverte); copier(lienPartage(l.nom, l.ids.slice(0, 80)), 'Lien de la collection copié'); };
  $('#coll-vider-vus').onclick = () => VUS.vider();
  for (const id of ['#partage', '#surprise']) { const x = $(id); x.addEventListener('click', (e) => { if (e.target === x) x.close(); }); $('.fermer', x).onclick = () => x.close(); }
  const sel = $('#surprise-style');
  sel.replaceChildren(new Option('Tous styles', ''), ...S.DATA.meta.styles.filter((s) => s.n && s.id !== 'a-verifier').map((s) => new Option(s.nom, s.id)));
  sel.onchange = () => { SUR.style = sel.value; tirer(); };
  $('#surprise-max').onchange = (e) => { SUR.max = Math.max(5, Number(e.target.value) || 60); tirer(); };
  $('#surprise-encore').onclick = tirer;
}
