// Cartes produit + fiche détaillée (dialogue accessible au clic, au toucher et au clavier).
import { $, $$, S, C, VUS, COULEURS, PLATEFORME, NOTE_PRIX, titre, euros, prixOrigine, origine, photo, toast, copier, evt, surEvt } from './noyau.js';

const COEUR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>';

export function prixEl(a, grand = false) {
  const p = document.createElement('p');
  p.className = grand ? 'prix prix-grand' : 'prix';
  if (a.eur === null || a.eur === undefined) { p.classList.add('inconnu'); p.textContent = 'Prix sur la page'; return p; }
  p.innerHTML = `<span class="prix-eur"><abbr title="${NOTE_PRIX}">≈</abbr> ${euros(a.eur)} €</span>`;
  if (prixOrigine(a)) { const s = document.createElement('span'); s.className = 'prix-orig'; s.textContent = prixOrigine(a); p.append(s); }
  return p;
}

export function tagsEl(a, max = 3) {
  const d = document.createElement('div'); d.className = 'tags';
  for (const s of a.styles.slice(0, max)) {
    const t = document.createElement('span'); t.className = 'tag'; t.style.setProperty('--c', COULEURS[s]);
    t.textContent = S.STYLES[s]?.court ?? s; d.append(t);
  }
  return d;
}

// Carte : la photo et le titre ouvrent la fiche ; le cœur et LoveGoBuy sont toujours visibles (pas seulement au survol).
export function carte(a, { i = 0, liste = null, petite = false } = {}) {
  const el = document.createElement('article');
  el.className = petite ? 'carte petite' : 'carte'; el.dataset.id = a.id; el.dataset.plateforme = (PLATEFORME[a.plateforme] ?? '').toUpperCase(); el.style.setProperty('--i', i % 12);
  el.innerHTML = `
    <button class="carte-photo" type="button"><img loading="lazy" decoding="async" alt=""><span class="photo-vide">Photo indisponible</span></button>
    <button class="coeur" type="button" aria-pressed="false">${COEUR}</button>
    <span class="badge" title="${PLATEFORME[a.plateforme] ?? ''}">${(PLATEFORME[a.plateforme] ?? '?')[0]}</span>
    <div class="carte-corps">
      <p class="carte-marque"></p>
      <h3 class="carte-titre"><button type="button" class="lien-titre"></button></h3>
      <div class="carte-bas"></div>
    </div>`;
  const cadre = $('.carte-photo', el);
  cadre.setAttribute('aria-label', `Voir la fiche : ${titre(a)}`);
  photo($('img', cadre), a, petite ? 300 : 400, cadre);
  $('.carte-marque', el).textContent = a.marque || S.TYPES[a.type]?.nom || '';
  const bt = $('.lien-titre', el); bt.textContent = titre(a); bt.tabIndex = -1;
  const ouvrir = () => ouvrirFiche(a, liste);
  cadre.onclick = ouvrir; bt.onclick = ouvrir;
  const coeur = $('.coeur', el);
  majCoeur(coeur, a.id);
  coeur.onclick = () => { const on = C.basculer('favoris', a.id); toast(on ? 'Ajouté aux favoris ♥' : 'Retiré des favoris'); };
  const bas = $('.carte-bas', el);
  bas.append(prixEl(a));
  if (!petite) {
    const l = document.createElement('a'); l.className = 'btn btn-orange btn-lgb'; l.href = a.lien; l.target = '_blank'; l.rel = 'noopener sponsored';
    l.setAttribute('aria-label', `Acheter sur LoveGoBuy : ${titre(a)}`);
    l.innerHTML = 'LoveGoBuy <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    bas.append(l);
  }
  return el;
}
function majCoeur(b, id) {
  const on = C.estFavori(id);
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Retirer des favoris' : 'Ajouter aux favoris');
}
surEvt('collections', () => $$('.carte').forEach((c) => majCoeur($('.coeur', c), c.dataset.id)));

// ---------- Fiche ----------
let courant = null, listeCourante = null;
export function ouvrirFiche(a, liste = null) {
  courant = a; listeCourante = liste;
  const d = $('#fiche');
  const img = $('#fiche-img'); img.alt = titre(a); $('.fiche-photo').classList.remove('charge', 'sans-photo');
  photo(img, a, 800, $('.fiche-photo'));
  $('#fiche-tags').replaceWith(Object.assign(tagsEl(a, 6), { id: 'fiche-tags' }));
  $('#fiche-marque').textContent = [a.marque, S.TYPES[a.type]?.nom].filter(Boolean).join(' · ');
  $('#fiche-titre').textContent = titre(a);
  const pr = $('#fiche-prix'); pr.replaceChildren(prixEl(a, true));
  const infos = $('#fiche-infos'); infos.replaceChildren();
  const li = (t) => { const x = document.createElement('li'); x.textContent = t; infos.append(x); };
  li(NOTE_PRIX);
  (a.infos ?? []).forEach(li);
  if (a.titreCourt) li(`Titre d’origine : ${a.titre}`);
  li(`Vendu sur ${PLATEFORME[a.plateforme]}${a.sources?.length ? ` · repéré dans : ${a.sources.join(', ')}` : ''}`);
  if (a.styles.includes('a-verifier')) li('Style pas encore identifié : on préfère le dire plutôt que d’inventer.');
  $('#fiche-lgb').href = a.lien;
  $('#fiche-origine').href = origine(a);
  majFicheCollections();
  // Dans le même style et le même type.
  const s0 = a.styles.find((s) => s !== 'a-verifier' && s !== 'designer') ?? a.styles[0];
  const sim = S.ORDRE.filter((b) => b !== a && b.img && b.type === a.type && b.styles.includes(s0)).slice(0, 6);
  const box = $('#fiche-similaires'); box.replaceChildren(...sim.map((b) => {
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'mini-photo'; bt.setAttribute('aria-label', titre(b));
    const im = document.createElement('img'); im.alt = ''; photo(im, b, 200, bt); bt.append(im);
    bt.onclick = () => ouvrirFiche(b, listeCourante); return bt;
  }));
  $('#fiche-sim-bloc').hidden = !sim.length;
  const i = liste ? liste.indexOf(a) : -1;
  $('#fiche-prec').hidden = i <= 0; $('#fiche-suiv').hidden = i < 0 || i >= liste.length - 1;
  VUS.ajouter(a.id);
  const u = new URL(location.href); u.searchParams.set('article', a.id);
  if (!d.open) { history.pushState({ fiche: true }, '', u); d.showModal(); }
  else history.replaceState({ fiche: true }, '', u);
  $('.fiche-boite').scrollTop = 0;
  evt('fiche', a);
}

function majFicheCollections() {
  const fav = $('#fiche-fav'), on = C.estFavori(courant.id);
  fav.setAttribute('aria-pressed', String(on)); fav.querySelector('span').textContent = on ? 'Dans tes favoris' : 'Favori';
  const sel = $('#fiche-coll');
  sel.replaceChildren(new Option('Ajouter à une collection…', ''),
    ...C.listes.filter((l) => l.id !== 'favoris').map((l) => new Option(`${l.ids.includes(courant.id) ? '✓ ' : ''}${l.nom} (${l.ids.length})`, l.id)),
    new Option('+ Nouvelle collection…', '__nouvelle'));
}
surEvt('collections', () => { if ($('#fiche').open && courant) majFicheCollections(); });

export function initFiche() {
  const d = $('#fiche');
  const fermer = () => { if (history.state?.fiche) history.back(); else d.close(); };
  $('#fiche-fermer').onclick = fermer;
  d.addEventListener('click', (e) => { if (e.target === d) fermer(); });
  d.addEventListener('cancel', (e) => { e.preventDefault(); fermer(); });
  addEventListener('popstate', () => { if (d.open && !history.state?.fiche) d.close(); });
  d.addEventListener('close', () => { const u = new URL(location.href); if (u.searchParams.has('article')) { u.searchParams.delete('article'); history.replaceState(history.state, '', u); } evt('fiche-fermee', courant); });
  const voisin = (k) => { const i = listeCourante?.indexOf(courant) ?? -1; const b = listeCourante?.[i + k]; if (b) ouvrirFiche(b, listeCourante); };
  $('#fiche-prec').onclick = () => voisin(-1); $('#fiche-suiv').onclick = () => voisin(1);
  d.addEventListener('keydown', (e) => { if (e.target.closest('select, input')) return; if (e.key === 'ArrowLeft') voisin(-1); if (e.key === 'ArrowRight') voisin(1); });
  let x0 = null;
  $('.fiche-photo').addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  $('.fiche-photo').addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) voisin(dx < 0 ? 1 : -1); x0 = null; });
  $('#fiche-fav').onclick = () => { const on = C.basculer('favoris', courant.id); toast(on ? 'Ajouté aux favoris ♥' : 'Retiré des favoris'); };
  $('#fiche-coll').onchange = (e) => {
    const v = e.target.value; e.target.value = '';
    if (!v) return;
    if (v === '__nouvelle') {
      const nom = prompt('Nom de la nouvelle collection (ex. « hiver », « prochaine commande ») :');
      if (nom?.trim()) { const l = C.creer(nom, [courant.id]); toast(`Ajouté à « ${l.nom} »`); }
      else majFicheCollections();
      return;
    }
    const on = C.basculer(v, courant.id); toast(on ? `Ajouté à « ${C.liste(v).nom} »` : `Retiré de « ${C.liste(v).nom} »`);
  };
  $('#fiche-copier').onclick = () => copier(courant.lien, 'Lien LoveGoBuy copié');
  $('#fiche-partager').onclick = () => { const u = new URL(location.href); u.searchParams.set('article', courant.id); copier(u.href, 'Lien de la fiche copié'); };
}
