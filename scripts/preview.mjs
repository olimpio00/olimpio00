/**
 * Abre um preview dos assets nos dois temas, sem precisar dar push.
 * Uso: npm run preview
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { CACHE, ROOT } from './lib/paths.mjs'
import { ASSET_THEMES } from './lib/theme.mjs'

const BASES = Object.keys(ASSET_THEMES)

/** Assets que existem naquele tema — o header só tem versão escura. */
const basesOf = (theme) => BASES.filter((b) => ASSET_THEMES[b].includes(theme))

const page = `<!doctype html>
<meta charset="utf-8">
<title>Preview dos assets</title>
<style>
  body { margin: 0; font: 14px ui-sans-serif, system-ui, sans-serif; }
  section { padding: 32px; }
  section.dark  { background: #0d1117; color: #8b9cb8; }
  section.light { background: #ffffff; color: #57606a; }
  h2 { font: 600 12px ui-monospace, monospace; letter-spacing: 2px;
       text-transform: uppercase; margin: 0 0 16px; opacity: .7; }
  img { display: block; width: 100%; max-width: 1000px; margin: 0 auto 24px; }
</style>
${['dark', 'light']
  .map(
    (theme) => `<section class="${theme}">
  <h2>tema ${theme}</h2>
  ${basesOf(theme)
    .map((b) => `<img src="../assets/${b}-${theme}.svg" alt="${b} ${theme}">`)
    .join('\n  ')}
</section>`
  )
  .join('\n')}
`

await mkdir(CACHE, { recursive: true })
const out = join(CACHE, 'preview.html')
await writeFile(out, page)

console.log(`✓ ${relative(ROOT, out)}`)
console.log(`  abra: ${pathToFileURL(out).href}`)
