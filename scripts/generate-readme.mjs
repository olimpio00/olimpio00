/**
 * Monta o README.md a partir de data/profile.json + dados ao vivo da API.
 * Textos ficam no JSON; este arquivo só decide layout.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA, ROOT } from './lib/paths.mjs'
import { collect, shareOf } from './lib/stats.mjs'
import { ASSET_THEMES } from './lib/theme.mjs'

/**
 * Branch usado nas URLs dos assets. Detectado, não fixo: apontar para "main"
 * num repo em "master" faz as imagens darem 404 e o README aparecer vazio.
 * Precedência: profile.branch > CI > git local > "main".
 */
function detectBranch(override) {
  if (override) return override
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME
  try {
    const out = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (out && out !== 'HEAD') return out
  } catch {
    // sem git ou fora de um repo — cai no default
  }
  return 'main'
}

const RAW = (login, branch) => `https://raw.githubusercontent.com/${login}/${login}/${branch}`

/**
 * Hash curto do conteúdo do asset, usado como query string.
 * O proxy de imagens do GitHub (camo) cacheia por URL — sem isso, um SVG
 * atualizado pode continuar servindo a versão antiga por horas.
 */
async function assetVersion(base) {
  const hashes = []
  for (const theme of ASSET_THEMES[base]) {
    try {
      const buf = await readFile(join(ASSETS, `${base}-${theme}.svg`))
      hashes.push(createHash('md5').update(buf).digest('hex'))
    } catch {
      console.warn(`  ! assets/${base}-${theme}.svg ausente — rode npm run build:assets`)
    }
  }
  return createHash('md5').update(hashes.join('')).digest('hex').slice(0, 8)
}

/** Segmento de badge do shields.io: "-" literal precisa virar "--". */
const seg = (text) => encodeURIComponent(text).replace(/-/g, '--')

/** Luminância relativa aproximada de um hex — decide se o logo some no fundo. */
const luminance = (hex) => {
  const n = parseInt(hex, 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

/**
 * Badge do arsenal. Todos com o mesmo fundo quase preto e o logo na cor da
 * marca: a fileira lê como um painel de equipamentos, não como um arco-íris de
 * pílulas. Marca de cor escura (Express, Render, Expo) ganha logo branco, senão
 * desapareceria no fundo.
 */
const ARSENAL_BG = '0d0507'
const badge = ({ label, color, logo }) => {
  const logoColor = luminance(color) < 0.12 ? 'white' : color
  return `<img src="https://img.shields.io/badge/${seg(label)}-${ARSENAL_BG}?style=for-the-badge&logo=${logo}&logoColor=${logoColor}" alt="${label}">`
}

/** Badge de duas partes (rótulo · valor), usado na fileira do topo. */
const pairBadge = ({ label, value, color, logo, logoColor = 'white' }) => {
  const img = `<img src="https://img.shields.io/badge/${seg(label)}-${seg(value)}-${color}?style=for-the-badge&labelColor=${ARSENAL_BG}${logo ? `&logo=${logo}&logoColor=${logoColor}` : ''}" alt="${label}">`
  return img
}

/**
 * <picture> com par claro/escuro — GitHub troca conforme o tema do usuário.
 * Asset de tema único (o header) sai como <img> puro: um <picture> com uma só
 * fonte é ruído, e o `srcset` de um arquivo que não existe daria 404.
 */
function picture(login, branch, base, alt, v) {
  const src = (theme) => `${RAW(login, branch)}/assets/${base}-${theme}.svg?v=${v}`
  const themes = ASSET_THEMES[base]
  const fallback = `<img src="${src('dark')}" alt="${alt}" width="100%">`

  if (themes.length < 2) return fallback

  return `<picture>
${themes.map((theme) => `  <source media="(prefers-color-scheme: ${theme})" srcset="${src(theme)}">`).join('\n')}
  ${fallback}
</picture>`
}

/** Banner SVG de seção — substitui o "## Título" (o alt carrega o texto). */
const sectionBanner = (login, branch, key, title, v) =>
  `<p align="center">\n  <img src="${RAW(login, branch)}/assets/section-${key}-dark.svg?v=${v}" alt="${title}" width="100%">\n</p>`

function contribShare(stats, full) {
  const r = shareOf(stats, full)
  if (!r || !r.total) return 'colaborei no desenvolvimento'
  const share = commitShare(stats, full)
  return r.mineIsTop
    ? `sou o maior contribuidor do repositório (${share})`
    : `contribuí com ${share}`
}

/**
 * Só a fração, sem frase em volta — cabe na linha de CLASSIFICAÇÃO do dossiê.
 * Vazio quando a API não devolve contributors (repo novo, 202 em cache warming):
 * quem chama remove o separador órfão.
 */
function commitShare(stats, full) {
  const r = shareOf(stats, full)
  return r?.total ? `${r.mine} de ${r.total} commits` : ''
}

const fillTokens = (text, stats, repo) =>
  text
    .replace(/\{\{contribShare\}\}/g, () => contribShare(stats, repo))
    .replace(/\{\{commitShare\}\}/g, () => commitShare(stats, repo))

/**
 * Chip de status da missão. Paleta única (vermelhos escuros) de propósito:
 * o bloco de registros deve ler como um arquivo classificado, não como um
 * semáforo — status diferentes se distinguem pelo texto, não pela cor.
 */
const STATUS_COLOR = { 'PRIORIDADE MÁXIMA': 'b91c1c' }
const STATUS_DEFAULT = '5c1113'

function statusBadge(status) {
  const color = STATUS_COLOR[status] ?? STATUS_DEFAULT
  return `![${status}](https://img.shields.io/badge/${encodeURIComponent(status).replace(/-/g, '--')}-${color}?style=flat-square)`
}

/**
 * Rodapé do registro: código, setor e classificação em letra miúda.
 * Os rótulos vão em `code span` porque o GitHub remove CSS do README — o
 * monoespaçado é o único jeito de reproduzir a fileira de metadados do design.
 */
function dossier(p, code, stats) {
  // `{{commitShare}}` pode virar vazio; sem esta limpeza sobra "Solo ·" no fim.
  const clearance = p.clearance
    ? fillTokens(p.clearance, stats, p.repo)
        .replace(/\s*·\s*$/, '')
        .trim()
    : ''

  const fields = [
    `\`${code}\``,
    p.sector && `\`SETOR\` ${p.sector}`,
    clearance && `\`CLASSIFICAÇÃO\` ${clearance}`,
  ].filter(Boolean)

  return `<sub>${fields.join(' &nbsp; ')}</sub>`
}

function project(p, index, stats) {
  const url = `https://github.com/${p.repo}`
  const code = `M-${String(index + 1).padStart(3, '0')}`
  const extra = (p.links ?? []).map((l) => ` · [${l.label}](${l.url})`).join('')
  const status = p.status ? ` ${statusBadge(p.status)}` : ''
  const out = [`### ${p.emoji} [${p.title}](${url})${extra}${status}`, '']

  if (p.callout) out.push(`> ${fillTokens(p.callout, stats, p.repo)}`, '')

  out.push(p.body, '')

  // Uma linha de meta é a stack "pura" e ganha o rótulo ARMAMENTO do design.
  // Duas ou mais já trazem rótulo próprio (**Mobile:**, **API:**) e precisam de
  // quebra explícita (dois espaços no fim), senão o markdown as junta num
  // único parágrafo.
  if (p.meta?.length === 1) out.push(`\`ARMAMENTO\` · ${p.meta[0]}`, '')
  else if (p.meta?.length) out.push(p.meta.join('  \n'), '')

  if (p.bullets?.length) out.push(p.bullets.map((b) => `- ${b}`).join('\n'), '')
  if (p.ordered?.length) {
    if (p.orderedTitle) out.push(p.orderedTitle, '')
    out.push(p.ordered.map((o, i) => `${i + 1}. ${o}`).join('\n'), '')
  }
  if (p.quote) out.push(`> ${p.quote}`, '')
  out.push(dossier(p, code, stats), '')
  if (p.footnote) out.push(`<sub>${p.footnote}</sub>`, '')

  return out.join('\n').replace(/\n+$/, '')
}

/** Títulos das seções. Vêm do JSON; os defaults existem só para não quebrar. */
const SECTIONS = {
  about: 'Sobre mim',
  stack: 'Stack',
  duels: 'Holoarquivo',
  featured: 'Projetos em destaque',
  stats: 'GitHub em números',
  contact: 'Contato',
}

function render(profile, stats, versions, branch) {
  const { login, name } = profile
  const S = { ...SECTIONS, ...profile.sections }
  const banner = (key) => sectionBanner(login, branch, key, S[key] ?? key, versions[`section-${key}`])
  const tb = (path) => `https://img.shields.io/badge/${path}`
  const style = `style=for-the-badge&labelColor=${ARSENAL_BG}`

  // Vermelho-escuro no primeiro badge, não o azul do GitHub: a fileira fica
  // logo abaixo do banner e o azul quebrava a paleta na primeira linha da página.
  const links = [
    `<a href="https://github.com/${login}?tab=repositories"><img src="${tb(`Projetos-${stats.projectCount}-8b1a1a`)}?${style}&logo=github&logoColor=white" alt="Projetos"></a>`,
    `<a href="mailto:${profile.email}"><img src="${tb('Email-contato-b91c1c')}?${style}&logo=gmail&logoColor=white" alt="Email"></a>`,
  ]
  const linkedin = profile.linkedin
    ? `<a href="${profile.linkedin}"><img src="${tb('LinkedIn-perfil-0A66C2')}?${style}&logo=linkedin&logoColor=white" alt="LinkedIn"></a>`
    : ''
  const website = profile.website
    ? `<a href="${profile.website}"><img src="${tb(`${seg('Portfólio')}-online-3FCF8E`)}?${style}&logo=googlechrome&logoColor=white" alt="Portfólio"></a>`
    : ''
  if (linkedin) links.push(linkedin)
  if (website) links.push(website)
  // Badges decorativos (sem link) fecham a fileira — vêm por último de propósito:
  // o que é clicável fica junto, à esquerda.
  for (const b of profile.extraBadges ?? []) links.push(pairBadge(b))

  const table = [
    '| Projeto | Descrição | Stack |',
    '|---|---|---|',
    ...profile.small.map(
      (s) => `| [${s.label}](https://github.com/${s.repo}) | ${s.description} | ${s.stack} |`
    ),
  ].join('\n')

  // Holoarquivo: só entra se houver duelos no JSON.
  const duels = profile.duels?.items ?? []
  const duelsAlt = duels.map((d) => `${d.left.name} vs ${d.right.name}`).join(', ')
  const duelsBlock = duels.length
    ? `${banner('duels')}

<p align="center">
  ${picture(login, branch, 'duels', `${profile.duels.title}: ${duelsAlt}`, versions.duels)}
</p>

<p align="center">
  <sub>${duels.map((d) => `<code>${d.episode.replace('EPISÓDIO ', 'EP ')}</code> ${d.left.name} × ${d.right.name}`).join(' &nbsp;·&nbsp; ')}</sub>
</p>

<br>

`
    : ''

  const contact = [
    `<a href="mailto:${profile.email}"><img src="${tb(`${seg(profile.email)}-b91c1c`)}?${style}&logo=gmail&logoColor=white" alt="Email: ${profile.email}"></a>`,
    `<a href="https://github.com/${login}"><img src="${tb(`${seg('@' + login)}-1b1f24`)}?${style}&logo=github&logoColor=white" alt="GitHub: @${login}"></a>`,
    linkedin,
    website,
  ].filter(Boolean)

  return `<!--
  ⚠️  Arquivo gerado por scripts/generate-readme.mjs — não edite à mão.
      Edite data/profile.json e rode: npm run build
-->

<p align="center">
  ${picture(login, branch, 'header', `${name} — ${profile.role}`, versions.header).split('\n').join('\n  ')}
</p>

<p align="center">
  <i>${profile.tagline}</i>
</p>

<p align="center">
  ${links.join('\n  ')}
</p>

<br>

${banner('about')}

${profile.about.paragraphs.join('\n\n')}

${profile.about.bullets.map((b) => `- ${b}`).join('\n')}

<br>

${banner('stack')}

${profile.stack
  .map((g) => `<p>\n  <sub><b>◢ ${g.group.toUpperCase()}</b></sub><br>\n  ${g.badges.map(badge).join('\n  ')}\n</p>`)
  .join('\n\n')}

<br>

${duelsBlock}${banner('featured')}

${profile.featured.map((p, i) => project(p, i, stats)).join('\n\n---\n\n')}

---

### ${profile.smallTitle}

${table}

<br>

${banner('stats')}

<p align="center">
  ${picture(login, branch, 'stats', `Estatísticas de ${login}`, versions.stats).split('\n').join('\n  ')}
</p>

<p align="center">
  <sub>Atualizado automaticamente por GitHub Actions a partir da API do GitHub.</sub>
</p>

<br>

${banner('contact')}

<p align="center">
  ${contact.join('\n  ')}
</p>

<br>

<p align="center">
  ${picture(login, branch, 'footer', profile.footer?.quote ?? profile.closing, versions.footer)}
</p>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
console.log(`→ coletando dados de ${profile.login}...`)
const stats = await collect(profile)
const versions = {}
for (const base of Object.keys(ASSET_THEMES)) versions[base] = await assetVersion(base)
const branch = detectBranch(profile.branch)

await writeFile(join(ROOT, 'README.md'), render(profile, stats, versions, branch))
console.log(
  `✓ README.md — ${profile.featured.length} destaques, ${stats.projectCount} projetos, branch "${branch}"`
)
