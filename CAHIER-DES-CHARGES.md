# Cahier des charges : Zinzin v4 (refonte « vraie DA »)

## Objectif
Passer d'un catalogue propre à une **expérience de marque** : on doit sentir une identité dès la première seconde, s'amuser en naviguant et avoir envie de s'inscrire sur LoveGoBuy via notre lien.

## Identité
- **Mascotte** : le lapin crétin de La Zizanie, **habillé streetwear** pour lui donner une personnalité unique. Tenue signature : hoodie oversize orange, chaîne, casquette à l'envers, sneakers. Plusieurs poses : accueil (bras levés), qui fouille dans un carton, qui montre un coupon, confus (aucun résultat), content (tenue finie). Rendu 3D façon figurine, fond transparent, cadrage complet (oreilles et pieds non coupés).
- **Couleurs** : noir charbon, blanc cassé, orange Zinzin pour les actions. Un accent par univers.
- **Typo** : grande typo display condensée pour les titres, serif italique pour les accroches, Inter pour le reste.
- **Ton** : pote qui connaît les bons plans, tutoiement, humour léger, jamais corporate.
- **Référence d'ambiance** : FashionSea (interactif, effets, DA assumée). On ne copie ni son design ni sa mise en page : on fait du Zinzin.

## Pages et sections
1. **Accueil-présentation** (plein écran, qui se raconte au scroll)
   - Intro : lapin en grand, titre animé, recherche visible.
   - **Bandeau coupon** : « 400 $ de coupons à l'inscription sur LoveGoBuy avec notre lien », gros bouton orange.
   - **Comment ça marche en 3 étapes** : 1. Crée ton compte LoveGoBuy (coupons) → 2. Choisis tes pièces ici → 3. LoveGoBuy achète, vérifie et t'envoie le colis.
   - Univers en grand, un par écran (défilement horizontal ou empilé), tenue détourée qui s'assemble au scroll.
   - « Compose ton look » mis en avant comme un jeu.
2. **Catalogue** : grille actuelle (filtres, fiche, favoris, collections), plus immersive.
3. **Look**, **Collections**, **Surprends-moi** : gardés et habillés aux couleurs de la mascotte.

## Interactions et effets
- Pièces qui volent et suivent la souris (parallaxe), aimantation au survol.
- Révélation des titres au scroll, transitions entre les univers.
- Cartes qui basculent légèrement en 3D au survol (ordi), retour haptique visuel au toucher (mobile).
- Curseur personnalisé (ordi seulement).
- Le lapin réagit : salue, fouille, applaudit une tenue finie, aide quand rien n'est trouvé.
- Tout respecte « réduire les animations », sans son automatique et sans animation permanente pendant la navigation.

## Contraintes
- Statique, rapide, mobile d'abord, aucune librairie lourde.
- Conserver : articles, liens LoveGoBuy affiliés (code de `lovegobuy.json`), classement, filtres, favoris, collections, partage, look.
- Coupon : texte réglable dans `site.json` (`coupon`), annoncé par le propriétaire.
- Rien n'est publié sans l'accord du propriétaire. Les mentions vendeur (« best batch », « 1:1 ») ne sont jamais présentées comme vérifiées.

## Étapes
1. ✅ Cahier des charges + bandeau coupon + « Comment ça marche ».
2. Mascotte habillée : génération d'images (plusieurs poses), détourage, intégration.
3. Accueil-présentation au scroll (intro, univers plein écran, look en avant).
4. Effets (parallaxe, révélations, cartes 3D, curseur) + réactions du lapin.
5. Tests ordi et mobile, captures, version de test sur Netlify.
