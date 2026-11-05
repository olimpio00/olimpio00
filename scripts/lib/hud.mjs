/**
 * Peças de interface "terminal imperial" compartilhadas entre os assets:
 * painéis chanfrados, cantoneiras de mira, scanlines e a faixa de glifos.
 *
 * Tudo aqui é geometria pura — sem fonte externa, sem imagem. O GitHub serve os
 * SVGs como <img>, então nada que dependa de recurso externo renderizaria.
 */
import { between, seeded } from './random.mjs'

/**
 * Painel com dois cantos cortados (superior-esquerdo e inferior-direito).
 * O canto chanfrado é o que faz um retângulo ler como "console de nave" em vez
 * de "card de dashboard".
 */
export const chamfer = (x, y, w, h, c = 10) =>
  `M ${x + c} ${y} H ${x + w} V ${y + h - c} L ${x + w - c} ${y + h} H ${x} V ${y + c} Z`

/** Quatro cantoneiras em L, como a moldura de uma mira. */
export function brackets(x, y, w, h, len = 18) {
  const r = x + w
  const b = y + h
  return [
    `M ${x} ${y + len} V ${y} H ${x + len}`,
    `M ${r - len} ${y} H ${r} V ${y + len}`,
    `M ${r} ${b - len} V ${b} H ${r - len}`,
    `M ${x + len} ${b} H ${x} V ${b - len}`,
  ].join(' ')
}

/**
 * Padrão de scanlines. Usado como overlay de opacidade baixa: dá textura de
 * holograma/CRT sem custo de filtro.
 */
export const scanlineDef = (id, color = '#000', opacity = 0.22) => `
    <pattern id="${id}" width="4" height="3" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="${color}" opacity="${opacity}"/>
    </pattern>`

/**
 * Faixa de glifos alienígenas — evoca escrita galáctica sem usar nenhuma fonte
 * real (nem precisaria: SVG em <img> não carrega webfont externa).
 *
 * Cada glifo é montado com 2–3 traços de um repertório fixo numa caixa 8×12,
 * agrupados em "palavras". Semente fixa: mesmo texto em todo build.
 */
const STROKES = [
  (x, y, s) => `M ${x} ${y} H ${x + s}`, // topo
  (x, y, s) => `M ${x} ${y + s * 1.5} H ${x + s}`, // base
  (x, y, s) => `M ${x} ${y} V ${y + s * 1.5}`, // esquerda
  (x, y, s) => `M ${x + s} ${y} V ${y + s * 1.5}`, // direita
  (x, y, s) => `M ${x} ${y} L ${x + s} ${y + s * 1.5}`, // diagonal
  (x, y, s) => `M ${x} ${y + s * 0.75} H ${x + s}`, // meio
  (x, y, s) => `M ${x + s / 2} ${y} V ${y + s * 1.5}`, // eixo
  (x, y, s) => `M ${x + s} ${y} L ${x} ${y + s * 1.5}`, // contra-diagonal
]

export function glyphStrip({ x, y, width, size = 7, seed = 7, color, opacity = 0.6, anchor = 'start' }) {
  const rng = seeded(seed)
  const paths = []
  const glyphW = size + 4
  const items = []
  let cx = 0

  while (cx < width - glyphW) {
    const word = 2 + Math.floor(rng() * 4)
    for (let i = 0; i < word && cx < width - glyphW; i++) {
      items.push(cx)
      cx += glyphW
    }
    cx += glyphW * 0.9 // espaço entre palavras
  }

  const used = items.length ? items[items.length - 1] + size : 0
  const offset = anchor === 'end' ? x - used : x

  for (const gx of items) {
    const n = 2 + Math.floor(rng() * 2)
    const picks = new Set()
    while (picks.size < n) picks.add(Math.floor(rng() * STROKES.length))
    for (const p of picks) paths.push(STROKES[p](+(offset + gx).toFixed(1), y, size))
  }

  return `<path d="${paths.join(' ')}" fill="none" stroke="${color}" stroke-width="1.4"
          stroke-linecap="square" opacity="${opacity}"/>`
}

/**
 * Barrinhas de "sinal" piscando em sequência — ruído de interface. Sem SMIL
 * ficam todas acesas, que é um estado válido.
 */
export function signalBars({ x, y, n = 5, color, dim, seed = 3 }) {
  const rng = seeded(seed)
  return Array.from({ length: n }, (_, i) => {
    const h = 4 + i * 2.2
    const begin = between(rng, 0, 2).toFixed(1)
    return `<rect x="${x + i * 6}" y="${(y - h).toFixed(1)}" width="4" height="${h.toFixed(1)}" fill="${i < n - 1 ? color : dim}">
        <animate attributeName="opacity" values="1;0.35;1" dur="${(1.4 + i * 0.3).toFixed(1)}s" begin="${begin}s" repeatCount="indefinite"/>
      </rect>`
  }).join('')
}
