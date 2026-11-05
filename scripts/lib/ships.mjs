/**
 * Elementos de "céu" para o banner: nave em cunha, planeta, saída do
 * hiperespaço e disparos. Desenhos genéricos — a cunha cinzenta e o planeta
 * anelado evocam a estética sem copiar nenhum modelo específico.
 */
import { between, seeded } from './random.mjs'

/**
 * Nave capital em cunha, proa apontando para a esquerda-baixo.
 * O casco é escuro com a borda inferior acesa pela lava — a luz da cena vem de
 * baixo, e é isso que a destaca do céu quase preto.
 */
export function wedgeShip({ x, y, scale = 1, rotate = -8, hull = '#14171c', edge = '#ff5b3d', engine = '#7fd3ff', filter }) {
  const L = 420
  const hullPath = `M 0 0 L ${L} -58 L ${L + 18} -50 L ${L + 18} 46 L ${L} 56 Z`
  // superestrutura em degraus + torre de comando
  const tower = `M ${L - 150} -40 L ${L - 40} -54 L ${L - 40} -72 L ${L - 110} -66 Z
                 M ${L - 96} -66 L ${L - 52} -70 L ${L - 52} -88 L ${L - 90} -86 Z
                 M ${L - 104} -86 h 66 v 8 h -66 Z`
  const plates = Array.from({ length: 7 }, (_, i) => {
    const px = 60 + i * 50
    const k = px / L
    return `M ${px} ${(-58 * k + 2).toFixed(1)} L ${px} ${(56 * k - 2).toFixed(1)}`
  }).join(' ')

  return `
    <g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">
      <path d="${hullPath}" fill="${hull}"/>
      <path d="M 0 0 L ${L + 18} -4" stroke="#262b33" stroke-width="2"/>
      <path d="${plates}" stroke="#20252c" stroke-width="1"/>
      <path d="${tower.replace(/\s+/g, ' ')}" fill="${hull}"/>
      <path d="M 0 0 L ${L} 56 L ${L + 18} 46" fill="none" stroke="${edge}" stroke-width="2.2" opacity="0.75"/>
      <path d="M 0 0 L ${L} -58" fill="none" stroke="#5a6472" stroke-width="1" opacity="0.6"/>
      ${[-26, 0, 26]
        .map(
          (ey) => `
      <circle cx="${L + 20}" cy="${ey}" r="9" fill="${engine}" opacity="0.55"${filter ? ` filter="${filter}"` : ''}>
        <animate attributeName="opacity" values="0.55;0.35;0.6;0.55" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${L + 20}" cy="${ey}" r="3.5" fill="#e6f7ff"/>`
        )
        .join('')}
    </g>`
}

/** Planeta com anel e terminador — luz rasante vinda da direita-baixo. */
export function ringedPlanet({ cx, cy, r, id, base = '#2a0c0a', lit = '#c2410c', ring = '#8a5a4c' }) {
  return `
    <defs>
      <radialGradient id="${id}-g" cx="0.68" cy="0.7" r="0.85">
        <stop offset="0" stop-color="${lit}"/>
        <stop offset="0.45" stop-color="${base}"/>
        <stop offset="1" stop-color="#050203"/>
      </radialGradient>
      <clipPath id="${id}-back"><rect x="${cx - r * 2.4}" y="${cy - r * 2}" width="${r * 4.8}" height="${r * 2}"/></clipPath>
      <clipPath id="${id}-front"><rect x="${cx - r * 2.4}" y="${cy}" width="${r * 4.8}" height="${r * 2}"/></clipPath>
    </defs>
    <g transform="rotate(-18 ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.9}" ry="${r * 0.42}" fill="none" stroke="${ring}" stroke-width="3" opacity="0.55" clip-path="url(#${id}-back)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}-g)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${lit}" stroke-width="1" opacity="0.35"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.9}" ry="${r * 0.42}" fill="none" stroke="${ring}" stroke-width="3" opacity="0.7" clip-path="url(#${id}-front)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.6}" ry="${r * 0.33}" fill="none" stroke="${ring}" stroke-width="1" opacity="0.4" clip-path="url(#${id}-front)"/>
    </g>`
}

/**
 * Saída do hiperespaço: riscos de luz convergindo de volta para estrelas.
 * Opacidade base 0 — sem SMIL, nada aparece (o estado final do efeito).
 */
export function hyperspaceExit({ cx, cy, w, h, seed, n = 70, color = '#cfe8ff', dur = 1.3 }) {
  const rng = seeded(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const a = between(rng, 0, Math.PI * 2)
    const r0 = between(rng, 30, Math.max(w, h) * 0.45)
    const r1 = r0 + between(rng, 120, 420)
    const x1 = cx + Math.cos(a) * r0
    const y1 = cy + Math.sin(a) * r0 * 0.6
    const x2 = cx + Math.cos(a) * r1
    const y2 = cy + Math.sin(a) * r1 * 0.6
    const d = (dur * between(rng, 0.7, 1)).toFixed(2)
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${between(rng, 0.8, 2).toFixed(1)}" stroke-linecap="round" opacity="0">
        <animate attributeName="opacity" values="0.95;0" dur="${d}s" fill="freeze"/>
        <animate attributeName="x2" values="${x2.toFixed(1)};${x1.toFixed(1)}" dur="${d}s" fill="freeze"/>
        <animate attributeName="y2" values="${y2.toFixed(1)};${y1.toFixed(1)}" dur="${d}s" fill="freeze"/>
      </line>`
  }
  // clarão de chegada
  out += `<rect width="${w}" height="${h}" fill="${color}" opacity="0">
      <animate attributeName="opacity" values="0.35;0" dur="${(dur * 0.6).toFixed(2)}s" fill="freeze"/>
    </rect>`
  return `<g>${out}</g>`
}

/**
 * Disparos de turbolaser saindo da nave em direção ao solo. Ocupam só uma
 * fração do ciclo — o resto do tempo ficam apagados.
 */
export function bolts({ from, to, color = '#5dff8a', filter, cycle = 9, shots = [0, 0.35, 0.7, 4.6, 4.9] }) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const n = Math.hypot(dx, dy)
  const ux = (dx / n) * 34
  const uy = (dy / n) * 34
  const travel = 0.55 / cycle

  return shots
    .map(
      (t, i) => `
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.005;${(travel * 0.9).toFixed(4)};${travel.toFixed(4)};1" dur="${cycle}s" begin="${t + 2}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0 0; ${dx.toFixed(0)} ${dy.toFixed(0)}; ${dx.toFixed(0)} ${dy.toFixed(0)}" keyTimes="0;${travel.toFixed(4)};1" dur="${cycle}s" begin="${t + 2}s" repeatCount="indefinite"/>
      <line x1="${from[0] + (i % 2) * 8}" y1="${from[1] + (i % 2) * 5}" x2="${(from[0] + ux + (i % 2) * 8).toFixed(1)}" y2="${(from[1] + uy + (i % 2) * 5).toFixed(1)}" stroke="${color}" stroke-width="6" stroke-linecap="round" opacity="0.6"${filter ? ` filter="${filter}"` : ''}/>
      <line x1="${from[0] + (i % 2) * 8}" y1="${from[1] + (i % 2) * 5}" x2="${(from[0] + ux + (i % 2) * 8).toFixed(1)}" y2="${(from[1] + uy + (i % 2) * 5).toFixed(1)}" stroke="#eafff0" stroke-width="2" stroke-linecap="round"/>
    </g>`
    )
    .join('')
}
