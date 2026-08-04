/**
 * Gera .cache/snapshot.html — os assets embutidos inline, com o relógio das
 * animações travado num instante fixo.
 *
 * O preview normal usa <img>, que não dá controle sobre o SMIL: um screenshot
 * pega as animações pela metade e o resultado engana. Inline + setCurrentTime()
 * mostra o estado final, que é o que a pessoa que visita o perfil enxerga.
 *
 * Uso: npm run snapshot [-- segundos]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ASSETS, CACHE, ROOT } from './lib/paths.mjs'
import { ASSET_THEMES } from './lib/theme.mjs'

// 15s: as animações de entrada já congelaram e o crawl (32s de ciclo) está no
// meio da passada. Em 6s ele ainda entra pela base e o snapshot engana.
const AT = Number(process.argv[2] ?? 15) // segundos no relógio das animações
const BASES = Object.keys(ASSET_THEMES)
const THEMES = [...new Set(Object.values(ASSET_THEMES).flat())]

const read = async (base, theme) => {
  const file = join(ASSETS, `${base}-${theme}.svg`)
  const raw = await readFile(file, 'utf8')
  // Remove só a declaração XML; o <svg> em si vai inline no HTML
  return raw.replace(/<\?xml[^>]*\?>\s*/, '')
}

const sections = []
for (const theme of THEMES) {
  const svgs = []
  // O header só tem versão escura — na seção clara entra só o card de stats.
  for (const base of BASES.filter((b) => ASSET_THEMES[b].includes(theme))) {
    svgs.push(await read(base, theme))
  }
  sections.push(`<section class="${theme}">
  <h2>tema ${theme} — animações em t=${AT}s</h2>
  ${svgs.join('\n  ')}
</section>`)
}

const page = `<!doctype html>
<meta charset="utf-8">
<title>Snapshot dos assets</title>
<style>
  body { margin: 0; font: 14px ui-sans-serif, system-ui, sans-serif; }
  section { padding: 32px; }
  section.dark  { background: #0d1117; color: #8b9cb8; }
  section.light { background: #ffffff; color: #57606a; }
  h2 { font: 600 12px ui-monospace, monospace; letter-spacing: 2px;
       text-transform: uppercase; margin: 0 0 16px; opacity: .7; }
  svg { display: block; width: 100%; max-width: 1000px; height: auto; margin: 0 auto 24px; }
</style>
${sections.join('\n')}
<script>
  // Trava o SMIL no instante desejado para o screenshot ser determinístico
  for (const svg of document.querySelectorAll('svg')) {
    svg.pauseAnimations()
    svg.setCurrentTime(${AT})
  }
</script>
`

await mkdir(CACHE, { recursive: true })
const out = join(CACHE, 'snapshot.html')
await writeFile(out, page)

console.log(`✓ ${relative(ROOT, out)} (t=${AT}s)`)
console.log(`  abra: ${pathToFileURL(out).href}`)
