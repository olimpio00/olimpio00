/**
 * Gera os banners de seção (assets/section-<chave>-dark.svg) e o rodapé
 * (assets/footer-dark.svg).
 *
 * Por que banner em SVG em vez de "## Título": o GitHub remove todo CSS do
 * README, então um heading markdown nunca vai combinar com o banner e o card
 * de stats. Como imagem, cada seção abre com a mesma linguagem visual do topo.
 * O texto continua no `alt` — leitor de tela e busca não perdem nada.
 *
 * Só tema escuro, como o header: são peças de cenário, não de dados.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, SECTION_KEYS, esc, themesOf } from './lib/theme.mjs'
import { embers, emberGlow, id, lavaHorizon, ref, sceneDefs, skyGlow, starfield } from './lib/space.mjs'
import { brackets, chamfer, glyphStrip, scanlineDef } from './lib/hud.mjs'
import { saber } from './lib/figures.mjs'
import { wedgeShip } from './lib/ships.mjs'

const W = 1000

// ---------------------------------------------------------------------------
// Banner de seção
// ---------------------------------------------------------------------------

const BH = 92

function banner({ index, title, tag, key }, base) {
  // ids exclusivos por banner: no snapshot todos os SVGs vão inline juntos
  const t = { ...base, id: `${base.id}-sec-${key}` }
  const num = String(index + 1).padStart(2, '0')
  const seed = 1000 + index * 37

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BH}" viewBox="0 0 ${W} ${BH}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>
    <linearGradient id="${id('bg', t)}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c0608"/>
      <stop offset="0.45" stop-color="${t.panel}"/>
      <stop offset="1" stop-color="${t.bg}"/>
    </linearGradient>
    <linearGradient id="${id('sweep', t)}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id('rule', t)}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="0.6" stop-color="${t.accent3}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id('blade', t)}" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="3"/></filter>
    ${scanlineDef(id('scan', t), '#000', 0.25)}
    <clipPath id="${id('clip', t)}"><path d="${chamfer(1, 1, W - 2, BH - 2, 16)}"/></clipPath>
  </defs>

  <g clip-path="url(#${id('clip', t)})">
    <rect width="${W}" height="${BH}" fill="url(#${id('bg', t)})"/>
    <g>${starfield({ ...t, starCount: 26, starOpacity: 0.5 }, { w: W, h: BH, seed })}</g>

    <!-- varredura do scanner -->
    <rect x="-220" y="0" width="220" height="${BH}" fill="url(#${id('sweep', t)})">
      <animateTransform attributeName="transform" type="translate" values="0 0; ${W + 440} 0" dur="6.5s" begin="${(index * 0.8).toFixed(1)}s" repeatCount="indefinite"/>
    </rect>

    <!-- número do arquivo -->
    <path d="${chamfer(18, 16, 58, 60, 10)}" fill="${t.bg}" stroke="${t.accent}" stroke-opacity="0.7" stroke-width="1.5"/>
    <text x="47" y="34" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="2" fill="${t.dim}">ARQ</text>
    <text x="47" y="62" text-anchor="middle" font-family="${MONO}" font-size="24" font-weight="700" fill="${t.saber}">${num}</text>

    <text x="96" y="48" font-family="${SANS}" font-size="29" font-weight="800" letter-spacing="2.5" fill="${t.title}">${esc(title.toUpperCase())}</text>
    <text x="98" y="70" font-family="${MONO}" font-size="11" letter-spacing="2.2" fill="${t.dim}">${esc(tag)}</text>

    ${glyphStrip({ x: W - 36, y: 22, width: 230, size: 6, seed, color: t.muted, opacity: 0.4, anchor: 'end' })}
    ${Array.from({ length: 14 }, (_, i) => {
      const lit = (i * 7 + index * 3) % 5 !== 0
      return `<rect x="${W - 36 - (14 - i) * 12}" y="52" width="8" height="8" fill="${lit ? t.accent : t.border}" opacity="${lit ? 0.75 : 1}">${
        lit ? `<animate attributeName="opacity" values="0.75;0.2;0.75" dur="${(1.2 + ((i * 13) % 7) * 0.3).toFixed(1)}s" begin="${((i * 0.37) % 2).toFixed(2)}s" repeatCount="indefinite"/>` : ''
      }</rect>`
    }).join('')}

    <rect width="${W}" height="${BH}" fill="url(#${id('scan', t)})"/>
    <rect x="0" y="${BH - 3}" width="${W}" height="3" fill="url(#${id('rule', t)})"/>
  </g>
  <path d="${chamfer(1, 1, W - 2, BH - 2, 16)}" fill="none" stroke="${t.border}" stroke-width="2"/>
</svg>
`
}

// ---------------------------------------------------------------------------
// Rodapé
// ---------------------------------------------------------------------------

const FH = 230

function footer(profile, base) {
  const t = { ...base, id: `${base.id}-footer` }
  const f = profile.footer ?? {}
  const seed = 51

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${FH}" viewBox="0 0 ${W} ${FH}" role="img" aria-label="${esc(f.quote ?? '')}">
  <title>${esc(f.quote ?? '')}</title>
  <defs>
    ${sceneDefs(t, { w: W, h: FH })}
    ${scanlineDef(id('scan', t), '#000', 0.2)}
    <filter id="${id('saberGlow', t)}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <clipPath id="${id('card', t)}"><rect width="${W}" height="${FH}" rx="18"/></clipPath>
  </defs>

  <g clip-path="url(#${id('card', t)})">
    ${skyGlow(t, { w: W, h: FH })}
    <g>${starfield(t, { w: W, h: FH, seed })}</g>

    <!-- nave pequena cruzando ao longe -->
    <g opacity="0.9">
      <animateTransform attributeName="transform" type="translate" values="-140 30; ${W + 60} -20" dur="38s" repeatCount="indefinite"/>
      ${wedgeShip({ x: 0, y: 40, scale: 0.14, rotate: 172, hull: '#2a2f38', edge: t.accent, filter: ref('blade', t) })}
    </g>

    ${emberGlow(t, { cx: W / 2, cy: FH, rx: W * 0.55, ry: 90 })}
    ${lavaHorizon(t, { w: W, bottom: FH, base: FH - 34, seed })}
    ${embers(t, { w: W, base: FH - 50, seed, count: 18 })}

    ${saber({ grip: [118, 102], toward: [218, 102], len: 112, color: '#2f8bff', core: '#eaf4ff', filter: `url(#${id('saberGlow', t)})` })}
    ${saber({ grip: [882, 102], toward: [782, 102], len: 112, color: '#ff2323', core: '#fff1f0', filter: `url(#${id('saberGlow', t)})` })}

    <text x="${W / 2}" y="66" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="5" fill="${t.dim}">${esc(f.over ?? 'FIM DA TRANSMISSÃO')}</text>
    <text x="${W / 2}" y="112" text-anchor="middle" font-family="${SANS}" font-size="34" font-weight="800"
          fill="${t.title}" filter="${ref('textGlow', t)}">${esc(f.quote ?? '')}</text>
    <text x="${W / 2}" y="142" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="2" fill="${t.muted}">${esc(f.under ?? '')}</text>

    <rect width="${W}" height="${FH}" fill="url(#${id('scan', t)})"/>
    <path d="${brackets(14, 14, W - 28, FH - 28, 20)}" fill="none" stroke="${t.accent}" stroke-width="2" opacity="0.5"/>
    <rect x="0" y="0" width="${W}" height="${FH}" rx="18" fill="none" stroke="${t.border}" stroke-width="2"/>
  </g>
</svg>
`
}

// ---------------------------------------------------------------------------

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
await mkdir(ASSETS, { recursive: true })

const fill = (s) => String(s ?? '').replace(/\{\{count\}\}/g, profile.featured.length)

for (const t of themesOf('footer')) {
  for (const [index, key] of SECTION_KEYS.entries()) {
    const title = profile.sections?.[key] ?? key
    const tag = fill(profile.sectionTags?.[key])
    await writeFile(join(ASSETS, `section-${key}-${t.id}.svg`), banner({ index, title, tag, key }, t))
  }
  console.log(`✓ assets/section-{${SECTION_KEYS.join(',')}}-${t.id}.svg`)

  await writeFile(join(ASSETS, `footer-${t.id}.svg`), footer(profile, t))
  console.log(`✓ assets/footer-${t.id}.svg`)
}
