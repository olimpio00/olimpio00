/**
 * Gera assets/header-{light,dark}.svg — banner do topo do README, tema Star Wars.
 *
 * Decisões:
 * - Animação em SMIL (<animate>), não CSS. Se o renderizador ignorar SMIL, os
 *   elementos aparecem no estado final em vez de invisíveis — falha graciosa.
 * - Dois arquivos (claro/escuro) porque `prefers-color-scheme` dentro de um SVG
 *   servido pelo proxy de imagens do GitHub não é confiável; o README escolhe
 *   via <picture media="...">.
 * - A ordem de leitura imita a abertura dos filmes: fala em azul, o crawl
 *   subindo ao centro, e o logotipo (o nome) por último.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, THEMES, esc, monoWidth } from './lib/theme.mjs'
import { deathStar, id, nebulae, ref, saber, sceneDefs, starfield, twinSuns } from './lib/space.mjs'

const W = 1000
const H = 480
const CYCLE = 9 // segundos do ciclo completo do subtítulo rotativo
const SEED = 20260730 // fixo: mesmo céu em todo build

// Faixa reservada ao crawl. Fica entre a fala de abertura e o bloco do nome.
const CRAWL_TOP = 84
const CRAWL_BOTTOM = 300
// Estreito de propósito: mantém o crawl fora da Estrela da Morte, à direita.
const CRAWL_WIDTH = 560 // largura útil do texto, centralizado em W/2
const CRAWL_DUR = 32 // segundos de uma passada completa
const CRAWL_SCALE_END = 0.42 // quanto o bloco encolhe ao "se afastar"
/**
 * Y do bloco quando a animação NÃO roda. Escolhido para o estado estático
 * mostrar título + início do primeiro parágrafo em vez de um recorte no meio
 * de uma frase.
 */
const CRAWL_BASE_Y = 130

/** Largura aproximada de texto na fonte sans — só para quebrar linha. */
const sansWidth = (text, size) => text.length * size * 0.53

/** Quebra manual: SVG não tem reflow de texto. */
function wrap(text, maxWidth, size) {
  const lines = []
  let line = ''

  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && sansWidth(next, size) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)

  return lines
}

/**
 * Crawl de abertura.
 *
 * A perspectiva é falsa: em vez de rotacionar em 3D (impossível em SVG puro),
 * o bloco sobe e encolhe ao mesmo tempo — dois <animateTransform additive="sum">
 * sobre a mesma âncora. Visualmente lê como texto se afastando; e sem SMIL o
 * grupo simplesmente fica no `transform` base, legível.
 *
 * A máscara com gradiente vertical é o que faz o texto sumir no topo em vez de
 * ser cortado numa linha reta.
 */
function crawl(c, t) {
  if (!c) return ''

  const size = 20.5
  const lead = 29
  const parts = []
  let y = 0

  parts.push(`
      <text x="0" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="19"
            font-weight="800" letter-spacing="6" fill="${t.crawl}">${esc(c.episode)}</text>`)
  y += 50

  parts.push(`
      <text x="0" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="42"
            font-weight="800" letter-spacing="1" fill="${t.crawl}">${esc(c.title)}</text>`)
  y += 44

  for (const paragraph of c.paragraphs ?? []) {
    y += 26 // respiro entre parágrafos
    for (const line of wrap(paragraph, CRAWL_WIDTH, size)) {
      parts.push(`
      <text x="0" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="${size}"
            font-weight="600" fill="${t.crawl}">${esc(line)}</text>`)
      y += lead
    }
  }

  // Deslocamentos relativos à âncora base: entra logo abaixo da faixa e sai
  // quando a última linha, já encolhida, passa do topo.
  const enter = CRAWL_BOTTOM + 20 - CRAWL_BASE_Y
  const exit = CRAWL_TOP - 20 - CRAWL_BASE_Y - y * CRAWL_SCALE_END

  return `
    <g mask="${ref('crawlMask', t)}">
      <!-- Sem textGlow aqui de propósito: é um bloco alto que reescala a cada
           frame, e feGaussianBlur sob transform animado custa caro por nada —
           amarelo sobre quase-preto já tem contraste de sobra. -->
      <g transform="translate(${W / 2} ${CRAWL_BASE_Y})">
        <animateTransform attributeName="transform" type="translate" additive="sum"
                          values="0 ${enter}; 0 ${exit.toFixed(1)}"
                          dur="${CRAWL_DUR}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="scale" additive="sum"
                          values="1 1; ${CRAWL_SCALE_END} ${CRAWL_SCALE_END}"
                          dur="${CRAWL_DUR}s" repeatCount="indefinite"/>
        ${parts.join('')}
      </g>
    </g>`
}

function chips(labels, t, y) {
  const size = 13
  const padX = 11
  const h = 28
  let x = 76
  const out = []

  labels.forEach((label, i) => {
    const w = Math.round(monoWidth(label, size) + padX * 2)
    out.push(`
    <g opacity="0">
      <animate attributeName="opacity" to="1" dur="0.5s" begin="${(1.15 + i * 0.09).toFixed(2)}s" fill="freeze"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"
            fill="${t.panel}" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + w / 2}" y="${y + h / 2 + 4.5}" text-anchor="middle"
            font-family="${MONO}" font-size="${size}" fill="${t.muted}">${esc(label)}</text>
    </g>`)
    x += w + 9
  })

  return out.join('')
}

function rotating(words, t, y) {
  const size = 19
  const x = 78
  const prefixW = monoWidth('> ', size)

  return words
    .map((word, i) => {
      const cursorX = x + prefixW + monoWidth(word, size) + 3
      // Base opacity=1 só na primeira palavra: se o SMIL não rodar, ela é o
      // fallback visível em vez das três empilhadas.
      const base = i === 0 ? 1 : 0
      return `
    <g opacity="${base}">
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.31;0.3333;1"
               dur="${CYCLE}s" begin="${i * (CYCLE / words.length)}s" repeatCount="indefinite"/>
      <text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${t.muted}"
            >&gt; <tspan fill="${t.saber}">${esc(word)}</tspan></text>
      <rect x="${cursorX.toFixed(1)}" y="${y - 14}" width="9" height="18" fill="${t.saber}">
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.51;1"
                 dur="1.1s" repeatCount="indefinite"/>
      </rect>
    </g>`
    })
    .join('')
}

function header(profile, t) {
  const { name, header: h } = profile
  const NAME_Y = 372
  const ROTATING_Y = 412
  const CHIPS_Y = 434

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)} — ${esc(profile.role)}">
  <title>${esc(name)} — ${esc(profile.role)}</title>
  <defs>
    ${sceneDefs(t)}
    <linearGradient id="${id('rule', t)}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
      <stop offset="0" stop-color="${t.saber}" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="${t.accent2}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>
    <!-- O crawl desaparece nas duas pontas da faixa; corte reto denunciaria a
         máscara e mataria a ilusão de distância. -->
    <linearGradient id="${id('crawlFade', t)}" gradientUnits="userSpaceOnUse"
                    x1="0" y1="${CRAWL_TOP}" x2="0" y2="${CRAWL_BOTTOM}">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.86" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${id('crawlMask', t)}" maskUnits="userSpaceOnUse"
          x="0" y="${CRAWL_TOP}" width="${W}" height="${CRAWL_BOTTOM - CRAWL_TOP}">
      <rect x="0" y="${CRAWL_TOP}" width="${W}" height="${CRAWL_BOTTOM - CRAWL_TOP}"
            fill="${ref('crawlFade', t)}"/>
    </mask>
    <clipPath id="${id('card', t)}">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18"/>
    </clipPath>
  </defs>

  <g clip-path="${ref('card', t)}">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    ${nebulae(t, 'header')}
    <g>${starfield(t, { w: W, h: H, seed: SEED })}</g>
    ${deathStar(t, { cx: 866, cy: 116, r: 82 })}
    ${twinSuns(t)}

    ${saber(t, { x: 44, top: 40, bottom: 430 })}

    <text x="78" y="60" font-family="${MONO}" font-size="14.5" fill="${t.opening}" opacity="0">
      <animate attributeName="opacity" to="1" dur="1.2s" fill="freeze"/>
      ${esc(h.opening)}
    </text>

    ${crawl(h.crawl, t)}

    <text x="76" y="${NAME_Y}" font-family="${SANS}" font-size="70" font-weight="800"
          letter-spacing="-1.5" fill="${t.crawl}"${t.textGlow ? ` filter="${ref('textGlow', t)}"` : ''} opacity="0">
      <animate attributeName="opacity" to="1" dur="0.9s" begin="0.5s" fill="freeze"/>
      ${esc(name)}
    </text>

    ${rotating(h.rotating, t, ROTATING_Y)}
    ${chips(h.chips, t, CHIPS_Y)}

    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="${ref('rule', t)}"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="none"
          stroke="${t.border}" stroke-width="2"/>
  </g>
</svg>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
await mkdir(ASSETS, { recursive: true })

for (const t of Object.values(THEMES)) {
  await writeFile(join(ASSETS, `header-${t.id}.svg`), header(profile, t))
  console.log(`✓ assets/header-${t.id}.svg`)
}
