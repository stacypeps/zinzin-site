// Pluie dessinée au canvas : traits fins, longueurs et vitesses différentes, trois profondeurs.
// Remplace l'ancienne pluie en dégradés CSS (trop régulière, qui « sautait » à chaque boucle).
const MOUV_REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pluie(conteneur, { densite = 1, opacite = 1 } = {}) {
  if (!conteneur || MOUV_REDUIT) return;
  const cv = document.createElement('canvas'); conteneur.replaceChildren(cv);
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let L = 0, H = 0, gouttes = [], raf = 0, visible = true, t0 = 0;
  const vent = -0.16; // légère inclinaison vers la gauche
  const nouvelle = (haut) => {
    const z = Math.random(); // 0 = loin, 1 = près
    return { x: Math.random() * (L + 80), y: haut ? -Math.random() * H : Math.random() * H, z,
      v: 520 + z * 900 + Math.random() * 180, l: 8 + z * 22 + Math.random() * 8, a: (0.08 + z * 0.22) * opacite, e: z > 0.8 ? 1.3 : 1 };
  };
  const taille = () => {
    const r = conteneur.getBoundingClientRect(); L = r.width; H = r.height;
    cv.width = Math.round(L * dpr); cv.height = Math.round(H * dpr); cv.style.width = L + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(220, (L * H) / 9000) * densite * (L < 760 ? 0.6 : 1));
    gouttes = Array.from({ length: n }, () => nouvelle(false));
  };
  const image = (t) => {
    raf = requestAnimationFrame(image);
    const dt = Math.min(0.05, (t - (t0 || t)) / 1000); t0 = t;
    ctx.clearRect(0, 0, L, H);
    ctx.lineCap = 'round';
    for (const g of gouttes) {
      g.y += g.v * dt; g.x += g.v * vent * dt;
      if (g.y - g.l > H || g.x < -40) Object.assign(g, nouvelle(true));
      ctx.strokeStyle = `rgba(190, 225, 255, ${g.a})`; ctx.lineWidth = g.e;
      ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - g.l * vent, g.y - g.l); ctx.stroke();
    }
  };
  const lancer = () => { if (!raf && visible && !document.hidden) { t0 = 0; raf = requestAnimationFrame(image); } };
  const arreter = () => { cancelAnimationFrame(raf); raf = 0; };
  new ResizeObserver(taille).observe(conteneur);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? lancer() : arreter(); }).observe(conteneur);
  document.addEventListener('visibilitychange', () => (document.hidden ? arreter() : lancer()));
  taille(); lancer();
}
