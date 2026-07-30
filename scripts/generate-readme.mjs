/**
 * Monta o README.md a partir de data/profile.json + dados ao vivo da API.
 * Textos ficam no JSON; este arquivo só decide layout.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA, ROOT } from './lib/paths.mjs'
import { collect, shareOf } from './lib/stats.mjs'

const RAW = (login) => `https://raw.githubusercontent.com/${login}/${login}/main`

/**
 * Hash curto do conteúdo do asset, usado como query string.
 * O proxy de imagens do GitHub (camo) cacheia por URL — sem isso, um SVG
 * atualizado pode continuar servindo a versão antiga por horas.
 */
async function assetVersion(base) {
  const hashes = []
  for (const theme of ['dark', 'light']) {
    try {
      const buf = await readFile(join(ASSETS, `${base}-${theme}.svg`))
      hashes.push(createHash('md5').update(buf).digest('hex'))
    } catch {
      console.warn(`  ! assets/${base}-${theme}.svg ausente — rode npm run build:assets`)
    }
  }
  return createHash('md5').update(hashes.join('')).digest('hex').slice(0, 8)
}

const badge = ({ label, color, logo, logoColor = 'white' }) => {
  const text = encodeURIComponent(label).replace(/-/g, '--').replace(/%20/g, '%20')
  return `![${label}](https://img.shields.io/badge/${text}-${color}?style=flat-square&logo=${logo}&logoColor=${logoColor})`
}

/** <picture> com par claro/escuro — GitHub troca conforme o tema do usuário. */
const picture = (login, base, alt, v) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${RAW(login)}/assets/${base}-dark.svg?v=${v}">
  <source media="(prefers-color-scheme: light)" srcset="${RAW(login)}/assets/${base}-light.svg?v=${v}">
  <img src="${RAW(login)}/assets/${base}-dark.svg?v=${v}" alt="${alt}" width="100%">
</picture>`

function contribShare(stats, full) {
  const r = shareOf(stats, full)
  if (!r || !r.total) return 'colaborei no desenvolvimento'
  const share = `${r.mine} de ${r.total} commits`
  return r.mineIsTop
    ? `sou o maior contribuidor do repositório (${share})`
    : `contribuí com ${share}`
}

function project(p, stats) {
  const url = `https://github.com/${p.repo}`
  const extra = (p.links ?? []).map((l) => ` · [${l.label}](${l.url})`).join('')
  const out = [`### ${p.emoji} [${p.title}](${url})${extra}`, '']

  if (p.callout) {
    const text = p.callout.replace(/\{\{contribShare\}\}/g, contribShare(stats, p.repo))
    out.push(`> ${text}`, '')
  }

  out.push(p.body, '')

  // Duas linhas de meta precisam de quebra explícita (dois espaços no fim),
  // senão o markdown as junta num único parágrafo.
  if (p.meta?.length) out.push(p.meta.join('  \n'), '')
  if (p.bullets?.length) out.push(p.bullets.map((b) => `- ${b}`).join('\n'), '')
  if (p.ordered?.length) {
    if (p.orderedTitle) out.push(p.orderedTitle, '')
    out.push(p.ordered.map((o, i) => `${i + 1}. ${o}`).join('\n'), '')
  }
  if (p.quote) out.push(`> ${p.quote}`, '')
  if (p.footnote) out.push(`<sub>${p.footnote}</sub>`, '')

  return out.join('\n').replace(/\n+$/, '')
}

function render(profile, stats, versions) {
  const { login, name } = profile
  const links = [
    `<a href="https://github.com/${login}?tab=repositories"><img src="https://img.shields.io/badge/Projetos-${stats.projectCount}-1f6feb?style=flat-square&logo=github&logoColor=white" alt="Projetos"></a>`,
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
  ${picture(login, 'header', `${name} — ${profile.role}`, versions.header).split('\n').join('\n  ')}
</p>

<p align="center">
  ${profile.tagline}
</p>

<p align="center">
  ${links.join('\n  ')}
</p>

---

## Sobre mim

${profile.about.paragraphs.join('\n\n')}

${profile.about.bullets.map((b) => `- ${b}`).join('\n')}

---

## Stack

${profile.stack
  .map((g) => `**${g.group}**\n\n${g.badges.map(badge).join('\n')}`)
  .join('\n\n')}

---

## Projetos em destaque

${profile.featured.map((p) => project(p, stats)).join('\n\n---\n\n')}

---

### ${profile.smallTitle}

${table}

---

## GitHub em números

<p align="center">
  ${picture(login, 'stats', `Estatísticas de ${login}`, versions.stats).split('\n').join('\n  ')}
</p>

<p align="center">
  <sub>Atualizado automaticamente por GitHub Actions a partir da API do GitHub.</sub>
</p>

---

## Contato

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

await writeFile(join(ROOT, 'README.md'), render(profile, stats, versions))
console.log(`✓ README.md — ${profile.featured.length} destaques, ${stats.projectCount} projetos`)
