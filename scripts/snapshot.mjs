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

const AT = Number(process.argv[2] ?? 6) // segundos no relógio das animações
const BASES = ['header', 'stats']
const THEMES = ['dark', 'light']

const read = async (base, theme) => {
  const file = join(ASSETS, `${base}-${theme}.svg`)
  const raw = await readFile(file, 'utf8')
  // Remove só a declaração XML; o <svg> em si vai inline no HTML
  return raw.replace(/<\?xml[^>]*\?>\s*/, '')
}

const sections = []
for (const theme of THEMES) {
  const svgs = []
  for (const base of BASES) svgs.push(await read(base, theme))
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
  section.light { background: #f2e8d5; color: #6a5333; }
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
