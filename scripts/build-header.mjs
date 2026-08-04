/**
 * Gera assets/header-dark.svg — banner do topo do README, tema Mustafar: crawl
 * vermelho subindo sobre um rio de lava.
 *
 * Decisões:
 * - Animação em SMIL (<animate>), não CSS. Se o renderizador ignorar SMIL, os
 *   elementos aparecem no estado final em vez de invisíveis — falha graciosa.
 * - Só tema escuro (ASSET_THEMES.header). O banner é a cena, e uma versão clara
 *   dela é lava sobre creme: perde a brasa e o contraste do crawl. Quem estiver
 *   no tema claro do GitHub vê o card escuro, que é o efeito desejado.
 * - A ordem de leitura imita a abertura dos filmes: fala em azul, o crawl
 *   subindo ao centro, e o logotipo (o nome) por último.
 * - O cenário é vetor, não foto. Um still do filme resolveria a estética em
 *   duas linhas, mas é material de terceiro num perfil público e ainda somaria
 *   ~250 KB de base64 a um asset que o GitHub rebaixa por peso.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, esc, monoWidth, themesOf } from './lib/theme.mjs'
import { embers, emberGlow, id, lavaHorizon, ref, saber, sceneDefs, skyGlow, starfield } from './lib/space.mjs'

const W = 1000
const H = 480
const CYCLE = 9 // segundos do ciclo completo do subtítulo rotativo
const SEED = 20260730 // fixo: mesmo céu em todo build

// Faixa reservada ao crawl. Fica entre a fala de abertura e o horizonte.
const CRAWL_TOP = 72
const CRAWL_BOTTOM = 272
/**
 * Largura útil do texto, centralizado em W/2. Mais largo que a versão anterior
 * porque não há mais nada no lado direito da cena para desviar.
 */
const CRAWL_WIDTH = 660
const CRAWL_DUR = 32 // segundos de uma passada completa
const CRAWL_SCALE_END = 0.42 // quanto o bloco encolhe ao "se afastar"
/**
 * Y do bloco quando a animação NÃO roda. Escolhido para o estado estático
 * mostrar título + início do primeiro parágrafo em vez de um recorte no meio
 * de uma frase.
 */
const CRAWL_BASE_Y = 118

/**
 * Linha do horizonte. Tudo abaixo é rocha, e é sobre ela que o nome se apoia —
 * por isso o bloco de identidade não precisa de um scrim opaco.
 */
const HORIZON = 346

const NAME_Y = 400
const ROTATING_Y = 434
const CHIPS_Y = 416
const CHIPS_RIGHT = 956

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
           vermelho-brasa sobre quase-preto já tem contraste de sobra. -->
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

/**
 * Chips da stack, alinhados à direita — contrapeso do nome, que fica à
 * esquerda. Alinhar à direita exige medir a fileira inteira antes de posicionar
 * o primeiro, daí o cálculo em duas passadas.
 */
function chips(labels, t, { y, right }) {
  const size = 13
  const padX = 11
  const h = 28
  const gap = 9

  const widths = labels.map((l) => Math.round(monoWidth(l, size) + padX * 2))
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, labels.length - 1)
  let x = right - total

  return labels
    .map((label, i) => {
      const w = widths[i]
      const chip = `
    <g opacity="0">
      <animate attributeName="opacity" to="1" dur="0.5s" begin="${(1.15 + i * 0.09).toFixed(2)}s" fill="freeze"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"
            fill="${t.panel}" fill-opacity="0.85" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + w / 2}" y="${y + h / 2 + 4.5}" text-anchor="middle"
            font-family="${MONO}" font-size="${size}" fill="${t.muted}">${esc(label)}</text>
    </g>`
      x += w + gap
      return chip
    })
    .join('')
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)} — ${esc(profile.role)}">
  <title>${esc(name)} — ${esc(profile.role)}</title>
  <defs>
    ${sceneDefs(t, { w: W, h: H })}
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
    ${skyGlow(t, { w: W, h: H })}
    <g>${starfield(t, { w: W, h: H, seed: SEED })}</g>
    ${emberGlow(t, { cx: W / 2, cy: HORIZON + 26, rx: W * 0.6, ry: 132 })}
    ${lavaHorizon(t, { w: W, bottom: H, base: HORIZON, seed: SEED })}
    ${embers(t, { w: W, base: HORIZON - 22, seed: SEED })}

    <!-- Reforço na base: a rocha da frente já é quase preta, mas o scrim
         garante o contraste do nome mesmo onde uma crista sobe mais alto. -->
    <rect x="0" y="${H - 132}" width="${W}" height="132" fill="${ref('scrim', t)}"/>

    ${saber(t, { x: 44, top: 40, bottom: 430 })}

    <text x="${W / 2}" y="46" text-anchor="middle" font-family="${MONO}" font-size="14.5"
          letter-spacing="0.6" fill="${t.opening}" opacity="0">
      <animate attributeName="opacity" to="1" dur="1.2s" fill="freeze"/>
      ${esc(h.opening)}
    </text>

    ${crawl(h.crawl, t)}

    <text x="76" y="${NAME_Y}" font-family="${SANS}" font-size="70" font-weight="800"
          letter-spacing="-1.5" fill="${t.title}"${t.textGlow ? ` filter="${ref('textGlow', t)}"` : ''} opacity="0">
      <animate attributeName="opacity" to="1" dur="0.9s" begin="0.5s" fill="freeze"/>
      ${esc(name)}
    </text>

    ${rotating(h.rotating, t, ROTATING_Y)}
    ${chips(h.chips, t, { y: CHIPS_Y, right: CHIPS_RIGHT })}

    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="${ref('rule', t)}"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="none"
          stroke="${t.border}" stroke-width="2"/>
  </g>
</svg>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
await mkdir(ASSETS, { recursive: true })

for (const t of themesOf('header')) {
  await writeFile(join(ASSETS, `header-${t.id}.svg`), header(profile, t))
  console.log(`✓ assets/header-${t.id}.svg`)
}
