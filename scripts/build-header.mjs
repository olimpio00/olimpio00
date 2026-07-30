/**
 * Gera assets/header-{light,dark}.svg — banner do topo do README, tema Star Wars.
 *
 * Decisões:
 * - Animação em SMIL (<animate>), não CSS. Se o renderizador ignorar SMIL, os
 *   elementos aparecem no estado final em vez de invisíveis — falha graciosa.
 * - Dois arquivos (claro/escuro) porque `prefers-color-scheme` dentro de um SVG
 *   servido pelo proxy de imagens do GitHub não é confiável; o README escolhe
 *   via <picture media="...">.
 * - A ordem de leitura imita a abertura dos filmes: fala em azul, depois o
 *   logotipo amarelo.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, THEMES, esc, monoWidth } from './lib/theme.mjs'
import { deathStar, id, nebulae, ref, saber, sceneDefs, starfield, twinSuns } from './lib/space.mjs'

const W = 1000
const H = 270
const CYCLE = 9 // segundos do ciclo completo do subtítulo rotativo
const SEED = 20260730 // fixo: mesmo céu em todo build

function chips(labels, t) {
  const size = 13
  const padX = 11
  const h = 28
  const y = 200
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

function rotating(words, t) {
  const size = 19
  const x = 78
  const y = 178
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
    ${sceneDefs(t)}
    <linearGradient id="${id('rule', t)}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
      <stop offset="0" stop-color="${t.saber}" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="${t.accent2}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${id('card', t)}">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18"/>
    </clipPath>
  </defs>

  <g clip-path="${ref('card', t)}">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    ${nebulae(t, 'header')}
    <g>${starfield(t, { w: W, h: H, seed: SEED })}</g>
    ${deathStar(t)}
    ${twinSuns(t)}

    ${saber(t, { x: 44, top: 40, bottom: 228 })}

    <text x="78" y="60" font-family="${MONO}" font-size="14.5" fill="${t.opening}" opacity="0">
      <animate attributeName="opacity" to="1" dur="1.2s" fill="freeze"/>
      ${esc(h.opening)}
    </text>

    <text x="76" y="138" font-family="${SANS}" font-size="70" font-weight="800"
          letter-spacing="-1.5" fill="${t.crawl}"${t.textGlow ? ` filter="${ref('textGlow', t)}"` : ''} opacity="0">
      <animate attributeName="opacity" to="1" dur="0.9s" begin="0.5s" fill="freeze"/>
      ${esc(name)}
    </text>

    ${rotating(h.rotating, t)}
    ${chips(h.chips, t)}

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
