/**
 * Gera assets/stats-{light,dark}.svg — card único com métricas + distribuição
 * de linguagens, calculado da API do GitHub.
 *
 * Por que local em vez de github-readme-stats: o serviço hospedado cai e é
 * rate-limitado, e imagem quebrada no topo do perfil é pior que imagem nenhuma.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, THEMES, esc, langColor } from './lib/theme.mjs'
import { collect } from './lib/stats.mjs'

const W = 1000
const H = 240
const TOP_LANGS = 6
const nf = new Intl.NumberFormat('pt-BR')

function tiles(stats, t) {
  const items = [
    { value: nf.format(stats.projectCount), label: 'projetos' },
    { value: nf.format(stats.commits), label: 'commits meus' },
    { value: nf.format(stats.langs.length), label: 'linguagens' },
    { value: `${stats.years}+`, label: `anos desde ${stats.since}` },
  ]

  const w = 205
  const h = 78
  const cols = [40, 259]
  const rows = [50, 142]

  return items
    .map((item, i) => {
      const x = cols[i % 2]
      const y = rows[Math.floor(i / 2)]
      return `
    <g opacity="0">
      <animate attributeName="opacity" to="1" dur="0.5s" begin="${(0.1 + i * 0.1).toFixed(2)}s" fill="freeze"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"
            fill="${t.panel}" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + 16}" y="${y + 42}" font-family="${SANS}" font-size="30" font-weight="700"
            fill="${t.text}">${esc(item.value)}</text>
      <text x="${x + 16}" y="${y + 63}" font-family="${MONO}" font-size="12"
            fill="${t.dim}">${esc(item.label)}</text>
    </g>`
    })
    .join('')
}

function langPanel(stats, t) {
  const x = 520
  const barW = 440
  const barY = 84
  const barH = 14

  const top = stats.langs.slice(0, TOP_LANGS)
  const rest = stats.langs.slice(TOP_LANGS)
  const restPct = rest.reduce((s, l) => s + l.pct, 0)
  const shown = restPct > 0.5 ? [...top, { name: 'Outras', pct: restPct }] : top

  let cursor = x
  const segments = shown
    .map((lang) => {
      const w = (lang.pct / 100) * barW
      const seg = `<rect x="${cursor.toFixed(2)}" y="${barY}" width="${w.toFixed(2)}" height="${barH}"
            fill="${lang.name === 'Outras' ? t.dim : langColor(lang.name, t)}"/>`
      cursor += w
      return seg
    })
    .join('\n      ')

  const legend = shown
    .map((lang, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const lx = x + col * 224
      const ly = 132 + row * 24
      return `
      <g opacity="0">
        <animate attributeName="opacity" to="1" dur="0.4s" begin="${(0.7 + i * 0.07).toFixed(2)}s" fill="freeze"/>
        <circle cx="${lx + 5}" cy="${ly - 4}" r="5"
                fill="${lang.name === 'Outras' ? t.dim : langColor(lang.name, t)}"/>
        <text x="${lx + 18}" y="${ly}" font-family="${MONO}" font-size="12.5" fill="${t.muted}"
          >${esc(lang.name)} <tspan fill="${t.dim}">${lang.pct.toFixed(1)}%</tspan></text>
      </g>`
    })
    .join('')

  return `
    <text x="${x}" y="64" font-family="${MONO}" font-size="12" letter-spacing="2"
          fill="${t.dim}">DISTRIBUIÇÃO DE CÓDIGO</text>

    <g clip-path="url(#barClip)">
      ${segments}
    </g>
    ${legend}`
}

function card(stats, t) {
  const barW = 440

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estatísticas do GitHub de ${esc(stats.profile.login)}">
  <title>${esc(stats.profile.login)} — ${stats.projectCount} projetos, ${stats.commits} commits, ${stats.langs.length} linguagens</title>
  <defs>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18"/>
    </clipPath>
    <clipPath id="barClip">
      <rect x="520" y="84" width="${barW}" height="14" rx="7">
        <animate attributeName="width" from="0" to="${barW}" dur="1.1s" begin="0.35s" fill="freeze"/>
      </rect>
    </clipPath>
    <pattern id="statDots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.1" fill="${t.grid}"/>
    </pattern>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#statDots)" opacity="0.6"/>

    ${tiles(stats, t)}
    <line x1="492" y1="46" x2="492" y2="194" stroke="${t.border}" stroke-width="1"/>
    ${langPanel(stats, t)}

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
for (const t of Object.values(THEMES)) {
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
