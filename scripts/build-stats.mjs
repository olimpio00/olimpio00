/**
 * Gera assets/stats-{light,dark}.svg — o "console de bordo": quatro métricas em
 * fileira e a distribuição de linguagens em largura cheia, no mesmo cenário
 * vulcânico do banner.
 *
 * Por que local em vez de github-readme-stats: o serviço hospedado cai e é
 * rate-limitado, e imagem quebrada no topo do perfil é pior que imagem nenhuma.
 *
 * Por que 4 colunas em vez do 2x2 anterior: liberar a coluna direita dá à barra
 * de linguagens os 872px inteiros. Com sete faixas, 440px transformava as
 * menores em fios de 3px.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, esc, langColor, themesOf } from './lib/theme.mjs'
import { emberGlow, id, ref, sceneDefs, skyGlow, starfield } from './lib/space.mjs'
import { collect } from './lib/stats.mjs'
import { brackets, chamfer, scanlineDef, signalBars } from './lib/hud.mjs'

/**
 * Ícones de 18px em traço, um por métrica. Desenhados aqui (e não emoji)
 * porque emoji em SVG depende da fonte do sistema de quem visita.
 */
const ICONS = {
  // cubo isométrico — "sistemas"
  projects: (x, y) => `M ${x + 9} ${y} L ${x + 18} ${y + 5} L ${x + 18} ${y + 14} L ${x + 9} ${y + 19} L ${x} ${y + 14} L ${x} ${y + 5} Z M ${x} ${y + 5} L ${x + 9} ${y + 10} L ${x + 18} ${y + 5} M ${x + 9} ${y + 10} V ${y + 19}`,
  // nó de commit
  commits: (x, y) => `M ${x} ${y + 9.5} H ${x + 5} M ${x + 13} ${y + 9.5} H ${x + 18} M ${x + 9} ${y + 5.5} a 4 4 0 1 0 0.01 0 Z`,
  // chaves de código
  lang: (x, y) => `M ${x + 6} ${y + 3} L ${x} ${y + 9.5} L ${x + 6} ${y + 16} M ${x + 12} ${y + 3} L ${x + 18} ${y + 9.5} L ${x + 12} ${y + 16} M ${x + 10.5} ${y + 1} L ${x + 7.5} ${y + 18}`,
  // ampulheta
  years: (x, y) => `M ${x + 2} ${y} H ${x + 16} M ${x + 2} ${y + 19} H ${x + 16} M ${x + 4} ${y} C ${x + 4} ${y + 7}, ${x + 14} ${y + 12}, ${x + 14} ${y + 19} M ${x + 14} ${y} C ${x + 14} ${y + 7}, ${x + 4} ${y + 12}, ${x + 4} ${y + 19}`,
}

const W = 1000
const H = 320
const TOP_LANGS = 6
const SEED = 66601138 // fixo: mesmo céu em todo build
const nf = new Intl.NumberFormat('pt-BR')
const mb = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const PAD = 40 // margem lateral do conteúdo
const GAP = 14

// Fileira de métricas
const TILE_Y = 72
const TILE_H = 80
const TILE_W = Math.round((W - PAD * 2 - GAP * 3) / 4)

// Painel de linguagens
const LANG_Y = 170
const LANG_H = 126
const BAR_X = PAD + 24
const BAR_W = W - (PAD + 24) * 2
const BAR_Y = LANG_Y + 38
const BAR_H = 12
const LEGEND_COLS = 4

/**
 * Faixa de status do topo — o console ligado.
 * O ponto pulsa em SMIL; se não animar, fica aceso, que é o estado correto.
 */
const band = (t) => `
    <g>
      <circle cx="${PAD + 6}" cy="41" r="4.5" fill="${t.accent}">
        <animate attributeName="opacity" values="1;0.35;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${PAD + 6}" cy="41" r="9" fill="${t.saberGlow}" opacity="0.4" filter="${ref('blade', t)}"/>
      <text x="${PAD + 22}" y="46" font-family="${MONO}" font-size="12" letter-spacing="2.4"
            fill="${t.dim}">SISTEMAS ONLINE · TELEMETRIA GITHUB</text>
      ${signalBars({ x: W - PAD - 28, y: 46, color: t.accent, dim: t.border, seed: 9 })}
    </g>`

/**
 * Rótulo em cima, número embaixo — ordem invertida em relação à versão antiga.
 * O rótulo é o que dá sentido ao número; lido primeiro, o valor grande chega
 * já contextualizado.
 *
 * `size` só é diferente na linguagem-chefe: é a única métrica textual, e 30px
 * de "TypeScript" estouraria o tile.
 */
function tiles(stats, t) {
  const items = [
    { label: 'PROJETOS', value: nf.format(stats.projectCount), icon: 'projects' },
    { label: 'COMMITS MEUS', value: nf.format(stats.commits), icon: 'commits' },
    { label: 'LINGUAGEM-CHEFE', value: stats.langs[0]?.name ?? '—', size: 19, color: t.text, icon: 'lang' },
    { label: `ANOS DESDE ${stats.since}`, value: `${stats.years}+`, icon: 'years' },
  ]

  return items
    .map((item, i) => {
      const x = PAD + i * (TILE_W + GAP)
      const size = item.size ?? 30
      return `
    <g opacity="0">
      <animate attributeName="opacity" to="1" dur="0.5s" begin="${(0.1 + i * 0.1).toFixed(2)}s" fill="freeze"/>
      <path d="${chamfer(x, TILE_Y, TILE_W, TILE_H, 12)}"
            fill="${t.panel}" fill-opacity="0.92" stroke="${t.border}" stroke-width="1"/>
      <rect x="${x}" y="${TILE_Y + 18}" width="3" height="${TILE_H - 36}" fill="${t.accent}"/>
      <path d="${ICONS[item.icon](x + TILE_W - 34, TILE_Y + 14)}" fill="none" stroke="${t.dim}"
            stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
      <text x="${x + 16}" y="${TILE_Y + 25}" font-family="${MONO}" font-size="10.5"
            letter-spacing="1.4" fill="${t.dim}">${esc(item.label)}</text>
      <text x="${x + 16}" y="${TILE_Y + 62}" font-family="${SANS}" font-size="${size}"
            font-weight="700" fill="${item.color ?? t.saber}">${esc(item.value)}</text>
    </g>`
    })
    .join('')
}

function langPanel(stats, t) {
  const top = stats.langs.slice(0, TOP_LANGS)
  const rest = stats.langs.slice(TOP_LANGS)
  const restPct = rest.reduce((s, l) => s + l.pct, 0)
  const shown = restPct > 0.5 ? [...top, { name: 'Outras', pct: restPct }] : top
  const colorOf = (lang) => (lang.name === 'Outras' ? t.dim : langColor(lang.name, t))

  let cursor = BAR_X
  const segments = shown
    .map((lang) => {
      const w = (lang.pct / 100) * BAR_W
      const seg = `<rect x="${cursor.toFixed(2)}" y="${BAR_Y}" width="${w.toFixed(2)}" height="${BAR_H}" fill="${colorOf(lang)}"/>`
      cursor += w
      return seg
    })
    .join('\n      ')

  const colW = BAR_W / LEGEND_COLS
  const legend = shown
    .map((lang, i) => {
      const lx = BAR_X + (i % LEGEND_COLS) * colW
      const ly = BAR_Y + 46 + Math.floor(i / LEGEND_COLS) * 24
      return `
      <g opacity="0">
        <animate attributeName="opacity" to="1" dur="0.4s" begin="${(0.7 + i * 0.07).toFixed(2)}s" fill="freeze"/>
        <rect x="${lx.toFixed(1)}" y="${ly - 9}" width="9" height="9" rx="2" fill="${colorOf(lang)}"/>
        <text x="${(lx + 17).toFixed(1)}" y="${ly}" font-family="${MONO}" font-size="12.5" fill="${t.muted}"
          >${esc(lang.name)} <tspan fill="${t.dim}">${lang.pct.toFixed(1)}%</tspan></text>
      </g>`
    })
    .join('')

  return `
    <!-- Painel próprio: texto de 12px sobre o brilho da brasa fica ilegível,
         então o bloco ganha fundo sólido em vez de flutuar sobre o cenário. -->
    <path d="${chamfer(PAD, LANG_Y, W - PAD * 2, LANG_H, 14)}"
          fill="${t.panel}" fill-opacity="0.92" stroke="${t.border}" stroke-width="1"/>
    <text x="${W - PAD - 24}" y="${LANG_Y + 25}" text-anchor="end" font-family="${MONO}" font-size="10.5"
          letter-spacing="1.4" fill="${t.dim}">${stats.langs.length} LINGUAGENS · ${mb.format(stats.langs.reduce((a, l) => a + l.bytes, 0) / 1048576)} MB DE CÓDIGO</text>

    <text x="${BAR_X}" y="${LANG_Y + 25}" font-family="${MONO}" font-size="10.5" letter-spacing="1.4"
          fill="${t.dim}">DISTRIBUIÇÃO DE CÓDIGO</text>

    <!-- brilho da "lâmina": a barra emite luz como um sabre -->
    <g clip-path="${ref('barClip', t)}" filter="${ref('blade', t)}" opacity="0.45">
      ${segments}
    </g>
    <g clip-path="${ref('barClip', t)}">
      ${segments}
      <rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" fill="${ref('cells', t)}"/>
      <rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H / 2.5}" fill="#fff" opacity="0.16"/>
    </g>
    ${legend}`
}

function card(stats, t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estatísticas do GitHub de ${esc(stats.profile.login)}">
  <title>${esc(stats.profile.login)} — ${stats.projectCount} projetos, ${stats.commits} commits, ${stats.langs.length} linguagens</title>
  <defs>
    ${sceneDefs(t, { w: W, h: H })}
    ${scanlineDef(id('scan', t), t.id === 'dark' ? '#000' : '#7a5a50', t.id === 'dark' ? 0.2 : 0.06)}
    <!-- Corta a barra em células de 2px a cada 9px: lê como medidor de
         energia em vez de gráfico de pizza esticado. -->
    <pattern id="${id('cells', t)}" width="9" height="${BAR_H}" patternUnits="userSpaceOnUse" x="${BAR_X}" y="${BAR_Y}">
      <rect x="7" width="2" height="${BAR_H}" fill="${t.panel}"/>
    </pattern>
    <clipPath id="${id('cardClip', t)}">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18"/>
    </clipPath>
    <clipPath id="${id('barClip', t)}">
      <rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}">
        <animate attributeName="width" from="0" to="${BAR_W}" dur="1.1s" begin="0.35s" fill="freeze"/>
      </rect>
    </clipPath>
  </defs>

  <g clip-path="${ref('cardClip', t)}">
    ${skyGlow(t, { w: W, h: H })}
    <g>${starfield(t, { w: W, h: H, seed: SEED })}</g>
    ${emberGlow(t, { cx: W / 2, cy: H + 44, rx: W * 0.55, ry: 118 })}

    ${band(t)}
    ${tiles(stats, t)}
    ${langPanel(stats, t)}

    <rect width="${W}" height="${H}" fill="${ref('scan', t)}"/>
    <path d="${brackets(12, 12, W - 24, H - 24, 20)}" fill="none" stroke="${t.accent}" stroke-width="1.6" opacity="0.5"/>
    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="${ref('rule', t)}"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="none"
          stroke="${t.border}" stroke-width="2"/>
  </g>
</svg>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
console.log(`→ coletando dados de ${profile.login}...`)
const stats = await collect(profile)

await mkdir(ASSETS, { recursive: true })
for (const t of themesOf('stats')) {
  await writeFile(join(ASSETS, `stats-${t.id}.svg`), card(stats, t))
  console.log(`✓ assets/stats-${t.id}.svg`)
}

console.log(
  `  ${stats.projectCount} projetos · ${stats.commits} commits · ` +
    stats.langs
      .slice(0, TOP_LANGS)
      .map((l) => `${l.name} ${l.pct.toFixed(1)}%`)
      .join(', ')
)
