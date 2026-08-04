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

const badge = ({ label, color, logo, logoColor = 'white' }) =>
  `![${label}](https://img.shields.io/badge/${seg(label)}-${color}?style=flat-square&logo=${logo}&logoColor=${logoColor})`

/** Badge de duas partes (rótulo · valor), usado na fileira do topo. */
const pairBadge = ({ label, value, color, logo, logoColor = 'white' }) => {
  const img = `<img src="https://img.shields.io/badge/${seg(label)}-${seg(value)}-${color}?style=flat-square${logo ? `&logo=${logo}&logoColor=${logoColor}` : ''}" alt="${label}">`
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
  featured: 'Projetos em destaque',
  featuredNote: '',
  stats: 'GitHub em números',
  contact: 'Contato',
}

function render(profile, stats, versions, branch) {
  const { login, name } = profile
  const S = { ...SECTIONS, ...profile.sections }
  const featuredNote = S.featuredNote
    ? `\n<sub>${S.featuredNote.replace(/\{\{count\}\}/g, profile.featured.length)}</sub>\n`
    : ''
  // Vermelho-escuro no primeiro badge, não o azul do GitHub: a fileira fica
  // logo abaixo do banner e o azul quebrava a paleta na primeira linha da página.
  const links = [
    `<a href="https://github.com/${login}?tab=repositories"><img src="https://img.shields.io/badge/Projetos-${stats.projectCount}-8b1a1a?style=flat-square&logo=github&logoColor=white" alt="Projetos"></a>`,
    `<a href="mailto:${profile.email}"><img src="https://img.shields.io/badge/Email-contato-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>`,
  ]
  if (profile.linkedin) {
    links.push(
      `<a href="${profile.linkedin}"><img src="https://img.shields.io/badge/LinkedIn-perfil-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>`
    )
  }
  if (profile.website) {
    links.push(
      `<a href="${profile.website}"><img src="https://img.shields.io/badge/Portfólio-online-3FCF8E?style=flat-square&logo=googlechrome&logoColor=white" alt="Portfólio"></a>`
    )
  }
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

  return `<!--
  ⚠️  Arquivo gerado por scripts/generate-readme.mjs — não edite à mão.
      Edite data/profile.json e rode: npm run build
-->

<p align="center">
  ${picture(login, branch, 'header', `${name} — ${profile.role}`, versions.header).split('\n').join('\n  ')}
</p>

<p align="center">
  ${profile.tagline}
</p>

<p align="center">
  ${links.join('\n  ')}
</p>

---

## ${S.about}

${profile.about.paragraphs.join('\n\n')}

${profile.about.bullets.map((b) => `- ${b}`).join('\n')}

---

## ${S.stack}

${profile.stack
  .map((g) => `**${g.group}**\n\n${g.badges.map(badge).join('\n')}`)
  .join('\n\n')}

---

## ${S.featured}
${featuredNote}
${profile.featured.map((p, i) => project(p, i, stats)).join('\n\n---\n\n')}

---

### ${profile.smallTitle}

${table}

---

## ${S.stats}

<p align="center">
  ${picture(login, branch, 'stats', `Estatísticas de ${login}`, versions.stats).split('\n').join('\n  ')}
</p>

<p align="center">
  <sub>Atualizado automaticamente por GitHub Actions a partir da API do GitHub.</sub>
</p>

---

## ${S.contact}

- 📫 **Email:** [${profile.email}](mailto:${profile.email})
- 💻 **GitHub:** [@${login}](https://github.com/${login})
${profile.linkedin ? `- 💼 **LinkedIn:** ${profile.linkedin}\n` : ''}${profile.website ? `- 🌐 **Portfólio:** ${profile.website}\n` : ''}
<p align="center"><sub>${profile.closing}</sub></p>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
console.log(`→ coletando dados de ${profile.login}...`)
const stats = await collect(profile)
const versions = {
  header: await assetVersion('header'),
  stats: await assetVersion('stats'),
}
const branch = detectBranch(profile.branch)

await writeFile(join(ROOT, 'README.md'), render(profile, stats, versions, branch))
console.log(
  `✓ README.md — ${profile.featured.length} destaques, ${stats.projectCount} projetos, branch "${branch}"`
)
