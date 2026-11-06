# Les finds de Zinzin

Site statique (HTML/CSS/JS, sans build) : catalogue de finds trié par type, style et marque, liens LoveGoBuy affiliés.

## Mettre à jour le catalogue
1. `node site-spread/import.mjs` : lit les spreads de `sources.json` (Google Sheets, pages HTML, pages rendues dans Chrome), retrouve le lien Taobao/Weidian/1688, classe, dédoublonne, écrit `data/articles.json`.
2. `node site-spread/miniatures.mjs` : **juste après l'import**. Télécharge une copie WebP 360 px de chaque photo dans `m/` (seulement les nouvelles) et marque les articles concernés. Sans ça, les photos des Google Sheets disparaissent (leurs liens expirent) et le site attend les serveurs chinois. `m/` n'est pas dans ce dépôt : il est publié avec le site.
3. `node site-spread/vision.mjs` : Gemini regarde chaque nouvelle photo (clé `GEMINI_API_KEY` du `.env`) et donne le vrai type, les couleurs, le motif, la qualité de la photo et un style aux pièces qui n'en ont pas. Résultats gardés dans `data/vision.json` (une photo n'est jamais repayée). Le type n'est corrigé que si le titre ne nomme pas clairement la pièce. « Compose ton look » s'en sert pour assortir les couleurs.
4. `node site-spread/verif-classement.mjs` : contrôle le classement sur des cas connus et résume les cas incertains (`data/a-verifier.csv`).
5. `node site-spread/visuels.mjs` : régénère les couvertures des univers et les pièces de l'accueil (détourage Gemini via Vertex AI, projet `zizanie-bot`, `gcloud auth login` requis).

## Régler
- `regles.json` : types (mot principal du titre), styles (mots descriptifs ; la marque seule ne suffit pas), marques, thème Hiver.
- `corrections.json` : corrections manuelles prioritaires.
- `couvertures.json` : pièces choisies à la main pour les couvertures.
- `site.json` : nom et poses de la mascotte (`assets/lapin/`), coupon LoveGoBuy, lien Discord.
- Mascotte : générée avec `creative/directions/lapins-Z/zinzin/generer.mjs` (Gemini image, Vertex AI).

## Voir en local
```bash
python3 -m http.server 8790 --directory site-spread
```
