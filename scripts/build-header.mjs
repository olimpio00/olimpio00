/**
 * Gera assets/header-{light,dark}.svg — o banner do topo do README.
 *
 * Decisões:
 * - Animação em SMIL (<animate>), não CSS. Se o renderizador ignorar SMIL, os
 *   elementos aparecem no estado final em vez de invisíveis — falha graciosa.
 * - Dois arquivos (claro/escuro) porque `prefers-color-scheme` dentro de um SVG
 *   servido pelo proxy de imagens do GitHub não é confiável; o README escolhe
 *   via <picture media="...">.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, THEMES, esc, monoWidth } from './lib/theme.mjs'

const W = 1000
const H = 260
const CYCLE = 9 // segundos para o ciclo completo do subtítulo rotativo

function chips(labels, t) {
  const size = 13
  const padX = 11
  const h = 28
  const y = 194
  let x = 72
  const out = []

  labels.forEach((label, i) => {
    const w = Math.round(monoWidth(label, size) + padX * 2)
    out.push(`
    <g opacity="0">
      <animate attributeName="opacity" to="1" dur="0.5s" begin="${(0.9 + i * 0.09).toFixed(2)}s" fill="freeze"/>
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
  const x = 74
  const y = 163
  const prefixW = monoWidth('> ', size)

  return words
    .map((word, i) => {
      const cursorX = x + prefixW + monoWidth(word, size) + 3
      // Visível durante sua fatia do ciclo; base opacity=1 apenas na primeira
      // palavra, para que ela seja o fallback se o SMIL não rodar.
      const base = i === 0 ? 1 : 0
      return `
    <g opacity="${base}">
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.31;0.3333;1"
               dur="${CYCLE}s" begin="${i * (CYCLE / words.length)}s" repeatCount="indefinite"/>
      <text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${t.muted}"
            >&gt; <tspan fill="${t.accent3}">${esc(word)}</tspan></text>
      <rect x="${cursorX.toFixed(1)}" y="${y - 14}" width="9" height="18" fill="${t.accent3}">
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
    <linearGradient id="nameFill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="520" y2="0" spreadMethod="reflect">
      <stop offset="0" stop-color="${t.text}"/>
      <stop offset="0.5" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accent2}"/>
      <animateTransform attributeName="gradientTransform" type="translate"
                        values="-520 0; 520 0; -520 0" dur="11s" repeatCount="indefinite"/>
    </linearGradient>

    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accent2}"/>
    </linearGradient>

    <linearGradient id="rule" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="${t.accent2}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>

    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="${t.grid}"/>
    </pattern>

    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="58"/>
    </filter>

    <clipPath id="card">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18"/>
    </clipPath>
  </defs>

  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)" opacity="0.75"/>

    <g filter="url(#soft)" opacity="${t.glow}">
      <circle cx="855" cy="55" r="120" fill="${t.accent2}">
        <animateTransform attributeName="transform" type="translate"
                          values="0 0; -26 24; 0 0" dur="15s" repeatCount="indefinite"/>
      </circle>
      <circle cx="760" cy="235" r="100" fill="${t.accent3}">
        <animateTransform attributeName="transform" type="translate"
                          values="0 0; 30 -20; 0 0" dur="19s" repeatCount="indefinite"/>
      </circle>
      <circle cx="120" cy="245" r="90" fill="${t.accent}">
        <animateTransform attributeName="transform" type="translate"
                          values="0 0; 18 14; 0 0" dur="17s" repeatCount="indefinite"/>
      </circle>
    </g>

    <rect x="44" y="54" width="5" height="152" rx="2.5" fill="url(#bar)">
      <animate attributeName="height" from="0" to="152" dur="0.7s" fill="freeze"/>
    </rect>

    <text x="70" y="122" font-family="${SANS}" font-size="74" font-weight="800"
          letter-spacing="-2" fill="url(#nameFill)" opacity="0">
      <animate attributeName="opacity" to="1" dur="0.7s" begin="0.15s" fill="freeze"/>
      ${esc(name)}
    </text>

    ${rotating(h.rotating, t)}
    ${chips(h.chips, t)}

    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="url(#rule)"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="none"
          stroke="${t.border}" stroke-width="2"/>
  </g>
</svg>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
await mkdir(ASSETS, { recursive: true })

for (const t of Object.values(THEMES)) {
  const file = join(ASSETS, `header-${t.id}.svg`)
  await writeFile(file, header(profile, t))
  console.log(`✓ assets/header-${t.id}.svg`)
}
