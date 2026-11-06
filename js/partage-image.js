// Carte de tenue en image (format story 1080 × 1920) à poster : les pièces, les prix, le style et le lien du site.
import { S, euros, titre, locale, toast } from './noyau.js';

const charger = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

function texte(ctx, t, x, y, { taille = 40, poids = 800, couleur = '#fff', police = 'Orbitron, Arial, sans-serif', align = 'left', max = 0, espace = 0 } = {}) {
  ctx.font = `${poids} ${taille}px ${police}`; ctx.fillStyle = couleur; ctx.textAlign = align;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${espace}px`;
  let s = t; if (max) while (s.length > 3 && ctx.measureText(s).width > max) s = s.slice(0, -2);
  if (s !== t) s = s.trimEnd() + '…';
  ctx.fillText(s, x, y);
}

export async function imageTenue(pieces, style) {
  const L = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = L; cv.height = H;
  const ctx = cv.getContext('2d');
  // Fond nuit de Tokyo
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c2457'); g.addColorStop(.55, '#050b1e'); g.addColorStop(1, '#02040c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L, H);
  const halo = ctx.createRadialGradient(L / 2, 260, 20, L / 2, 260, 700); halo.addColorStop(0, 'rgba(255,122,26,.35)'); halo.addColorStop(1, 'rgba(255,122,26,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, L, H);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, L, 1);
  // En-tête
  const logo = await charger('assets/logo-z.svg');
  if (logo) ctx.drawImage(logo, 80, 90, 110, 110);
  texte(ctx, 'ZINZIN', 215, 175, { taille: 92, poids: 900, couleur: '#e6f6ff', espace: 4 });
  texte(ctx, 'MA TENUE', 82, 300, { taille: 34, poids: 700, couleur: '#45e9ff', police: 'Inter, Arial, sans-serif', espace: 10 });
  texte(ctx, (S.STYLES[style]?.nom ?? 'Tous styles').toUpperCase(), 82, 370, { taille: 58, poids: 900, max: 920 });
  // Pièces en boîtiers CD
  const cases = pieces.filter(Boolean);
  const imgs = await Promise.all(cases.map((a) => charger(locale(a))));
  const y0 = 430, h = 350, w = 660;
  cases.forEach((a, i) => {
    const y = y0 + i * (h + 70), x = i % 2 ? 340 : 80;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((i % 2 ? 2 : -2) * Math.PI / 180); ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.fillStyle = '#c9ced8'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = '#050507'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#16171d'; ctx.fillRect(x + 10, y + 10, 60, h - 20);
    if (logo) ctx.drawImage(logo, x + 18, y + 22, 44, 44);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 80, y + 10, w - 90, h - 20);
    const im = imgs[i];
    if (im) { const cw = w - 90, ch = h - 20, r = Math.max(cw / im.width, ch / im.height), dw = im.width * r, dh = im.height * r; ctx.save(); ctx.beginPath(); ctx.rect(x + 80, y + 10, cw, ch); ctx.clip(); ctx.drawImage(im, x + 80 + (cw - dw) / 2, y + 10 + (ch - dh) / 2, dw, dh); ctx.restore(); }
    // Étiquette prix
    ctx.translate(x + w - 170, y + h - 70); ctx.rotate(-3 * Math.PI / 180);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(6, 6, 190, 70); ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, 190, 70);
    texte(ctx, `≈ ${euros(a.eur)} €`, 95, 50, { taille: 40, poids: 900, couleur: '#111', align: 'center' });
    ctx.restore();
    texte(ctx, titre(a), i % 2 ? 1000 : 80, y + h + 28, { taille: 24, poids: 600, couleur: '#9fb7cc', police: 'Inter, Arial, sans-serif', align: i % 2 ? 'right' : 'left', max: 640 });
  });
  // Total + lien
  const total = cases.reduce((s, a) => s + a.eur, 0);
  const yT = H - 190;
  texte(ctx, 'TOTAL', 82, yT, { taille: 30, poids: 700, couleur: '#45e9ff', police: 'Inter, Arial, sans-serif', espace: 8 });
  texte(ctx, `≈ ${euros(total)} €`, 82, yT + 80, { taille: 84, poids: 900, couleur: '#ff7a1a' });
  texte(ctx, 'Trouve la tienne sur', 1000, yT + 20, { taille: 28, poids: 600, couleur: '#9fb7cc', police: 'Inter, Arial, sans-serif', align: 'right' });
  texte(ctx, location.host + location.pathname.replace(/\/$/, ''), 1000, yT + 70, { taille: 30, poids: 800, couleur: '#fff', police: 'Inter, Arial, sans-serif', align: 'right', max: 600 });
  return new Promise((ok) => cv.toBlob(ok, 'image/png'));
}

export async function partagerTenue(pieces, style) {
  const blob = await imageTenue(pieces, style);
  if (!blob) { toast('Image impossible à créer'); return; }
  const fichier = new File([blob], 'ma-tenue-zinzin.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [fichier] })) { await navigator.share({ files: [fichier], title: 'Ma tenue Zinzin' }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ma-tenue-zinzin.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Image enregistrée, poste-la en story');
}
