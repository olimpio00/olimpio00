/** Elementos de cena compartilhados entre o banner e o card de estatísticas. */
import { between, seeded } from './random.mjs'

/**
 * IDs de <defs> sufixados por tema.
 *
 * Sem isso, dois SVGs no mesmo documento HTML colidem: `url(#rule)` resolve
 * para o primeiro match do documento, então o tema claro herda o gradiente do
 * escuro. No README cada SVG é um <img> isolado e o bug não aparece — mas
 * aparece em qualquer página que embuta os arquivos inline.
 */
export const id = (name, t) => `${name}-${t.id}`
export const ref = (name, t) => `url(#${id(name, t)})`

/**
 * Campo de estrelas (ou poeira, no tema Tatooine).
 * @param seed semente fixa por asset — mesmo build, mesmo céu.
 */
export function starfield(t, { w, h, seed }) {
  const rng = seeded(seed)
  const out = []

  for (let i = 0; i < t.starCount; i++) {
    const x = between(rng, 0, w).toFixed(1)
    const y = between(rng, 0, h).toFixed(1)
    const r = between(rng, 0.4, 1.5).toFixed(2)
    const o = between(rng, 0.25, t.starOpacity).toFixed(2)
    const twinkles = rng() < 0.22

    out.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.star}" opacity="${o}">` +
        (twinkles
          ? `<animate attributeName="opacity" values="${o};${(o * 0.2).toFixed(2)};${o}" ` +
            `dur="${between(rng, 2.4, 5.5).toFixed(1)}s" begin="${between(rng, 0, 4).toFixed(1)}s" repeatCount="indefinite"/>`
          : '') +
        `</circle>`
    )
  }

  return out.join('')
}

const PRESETS = {
  // Nebulosas atrás do texto do banner, à esquerda e nos cantos
  header: {
    space: [
      { cx: 858, cy: 52, r: 118, fill: 'accent2', drift: '0 0; -26 22; 0 0', dur: 15 },
      { cx: 120, cy: 430, r: 96, fill: 'accent3', drift: '0 0; 16 14; 0 0', dur: 17 },
    ],
    desert: [],
  },
  // No card, as manchas ficam longe da coluna direita: a legenda precisa de
  // contraste, e nebulosa atrás de texto de 12px é ilegível.
  stats: {
    space: [
      { cx: 140, cy: 30, r: 96, fill: 'accent2', drift: '0 0; -18 16; 0 0', dur: 16 },
      { cx: 300, cy: 235, r: 84, fill: 'accent', drift: '0 0; 22 -14; 0 0', dur: 19 },
    ],
    desert: [],
  },
}

/** Nebulosas difusas — só no tema espacial, onde blur grande lê como gás. */
export function nebulae(t, preset = 'header') {
  const bodies = PRESETS[preset][t.mode] ?? []
  if (!bodies.length) return ''

  return `<g filter="${ref('soft', t)}" opacity="${t.glow}">
      ${bodies
        .map(
          (b) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${t[b.fill]}">
        <animateTransform attributeName="transform" type="translate"
                          values="${b.drift}" dur="${b.dur}s" repeatCount="indefinite"/>
      </circle>`
        )
        .join('\n      ')}
    </g>`
}

/**
 * Sóis gêmeos de Tatooine — discos definidos com corona, não borrões.
 * Um feGaussianBlur largo sobre fundo creme lê como mancha; o que dá a
 * sensação de sol é o núcleo nítido com halo curto ao redor.
 */
export function twinSuns(t, { cx = 852, cy = 74 } = {}) {
  if (t.mode !== 'desert') return ''

  const sun = (x, y, r, delay) => `
      <g>
        <circle cx="${x}" cy="${y}" r="${r * 2.1}" fill="${ref('corona', t)}" opacity="0.75"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${t.accent3}" opacity="0.92">
          <animate attributeName="opacity" values="0.92;0.75;0.92" dur="6s"
                   begin="${delay}s" repeatCount="indefinite"/>
        </circle>
      </g>`

  return `<g>${sun(cx, cy, 30, 0)}${sun(cx + 66, cy + 40, 18, 1.8)}</g>`
}

/**
 * Estrela da Morte — preenche o vazio à direita do banner no tema espacial.
 * Opacidade baixa de propósito: é cenário, não deve competir com o nome.
 */
export function deathStar(t, { cx = 848, cy = 128, r = 92 } = {}) {
  if (t.mode !== 'space') return ''

  return `
    <g opacity="0.5">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.panel}" stroke="${t.border}" stroke-width="1.5"/>
      <!-- prato do superlaser -->
      <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.36}" r="${r * 0.21}"
              fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
      <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.36}" r="${r * 0.09}"
              fill="${t.saber}" opacity="0.55"/>
      <!-- trincheira equatorial -->
      <path d="M ${cx - r} ${cy + 6} A ${r} ${r} 0 0 0 ${cx + r} ${cy + 6}"
            fill="none" stroke="${t.border}" stroke-width="2.5" opacity="0.9"/>
      <path d="M ${cx - r * 0.98} ${cy - 14} A ${r} ${r} 0 0 0 ${cx + r * 0.98} ${cy - 14}"
            fill="none" stroke="${t.border}" stroke-width="1" opacity="0.5"/>
      <!-- sombra do terminador, para o disco não parecer plano -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${ref('terminator', t)}"/>
    </g>`
}

/**
 * Sabre de luz vertical: punho + lâmina que acende de baixo para cima.
 * A ignição anima `y` e `height` juntos — só `height` faria a lâmina crescer
 * para baixo, a partir do punho, que é o oposto do movimento.
 */
export function saber(t, { x = 44, top = 40, bottom = 228 } = {}) {
  const h = bottom - top
  const cx = x + 6.5

  return `
    <g>
      <rect x="${x}" y="${bottom}" width="13" height="30" rx="2.5" fill="${t.hilt}"/>
      <rect x="${x}" y="${bottom + 7}" width="13" height="2.5" fill="${t.hiltDark}"/>
      <rect x="${x}" y="${bottom + 13}" width="13" height="2.5" fill="${t.hiltDark}"/>
      <rect x="${x + 2}" y="${bottom + 22}" width="9" height="5" rx="1" fill="${t.hiltDark}"/>

      <rect x="${cx - 5}" y="${top}" width="10" height="${h}" rx="5"
            fill="${t.saberGlow}" opacity="${t.saberHalo}" filter="${ref('blade', t)}">
        <animate attributeName="y" from="${bottom}" to="${top}" dur="0.85s" fill="freeze"/>
        <animate attributeName="height" from="0" to="${h}" dur="0.85s" fill="freeze"/>
      </rect>

      <rect x="${cx - 1.75}" y="${top}" width="3.5" height="${h}" rx="1.75" fill="${t.saberCore}">
        <animate attributeName="y" from="${bottom}" to="${top}" dur="0.85s" fill="freeze"/>
        <animate attributeName="height" from="0" to="${h}" dur="0.85s" fill="freeze"/>
      </rect>
    </g>`
}

/** Filtros e gradientes da cena. Vai dentro de <defs>. */
export const sceneDefs = (t) => `
    <filter id="${id('soft', t)}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="58"/>
    </filter>
    <filter id="${id('blade', t)}" x="-200%" y="-50%" width="500%" height="200%">
      <feGaussianBlur stdDeviation="4.5"/>
    </filter>
    <filter id="${id('textGlow', t)}" x="-30%" y="-60%" width="160%" height="220%">
      <feGaussianBlur stdDeviation="${t.textGlow}" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="${id('corona', t)}">
      <stop offset="0.42" stop-color="${t.accent3}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id('terminator', t)}" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0.45" stop-color="${t.bg}" stop-opacity="0"/>
      <stop offset="1" stop-color="${t.bg}" stop-opacity="0.85"/>
    </linearGradient>`
