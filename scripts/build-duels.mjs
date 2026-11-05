/**
 * Gera assets/duels-dark.svg — o "holoarquivo": um projetor que alterna entre
 * os duelos de sabre mais icônicos, cada um com cenário próprio.
 *
 * Decisões:
 * - Um único SVG em carrossel, não um por duelo. No README cada imagem é um
 *   bloco de 1000px; seis empilhados viravam uma galeria que ninguém rola.
 * - Troca de cena em SMIL com `begin` escalonado — a mesma técnica do subtítulo
 *   rotativo do banner. Só a cena 0 tem opacidade base 1: se o renderizador
 *   ignorar SMIL, aparece um duelo inteiro, não seis sobrepostos.
 * - Personagens são silhuetas vetoriais (lib/figures.mjs) contra cenário
 *   iluminado. Nada de still de filme: é material de terceiro num perfil público.
 * - Textos (nomes, filme, local) vêm do data/profile.json; a composição visual
 *   de cada cena mora aqui, porque pose e cenário são acoplados.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ASSETS, DATA } from './lib/paths.mjs'
import { MONO, SANS, esc, themesOf } from './lib/theme.mjs'
import { between, seeded } from './lib/random.mjs'
import { brackets, chamfer, glyphStrip, scanlineDef, signalBars } from './lib/hud.mjs'
import { clash, figure, saber } from './lib/figures.mjs'

const W = 1000
const H = 440
const GROUND = 334
const SCENE = 7 // segundos por duelo

/** Cor da lâmina (traço) e do texto (precisa contraste sobre fundo escuro). */
const BLADES = {
  blue: { blade: '#2f8bff', core: '#eaf4ff', text: '#6cb4ff' },
  green: { blade: '#29e05a', core: '#effff2', text: '#5fe58a' },
  red: { blade: '#ff2323', core: '#fff1f0', text: '#ff6259' },
}

const P = 'duel' // prefixo de ids: o asset pode ser embutido inline junto dos outros
const id = (name) => `${P}-${name}`
const url = (name) => `url(#${id(name)})`

// ---------------------------------------------------------------------------
// Utilitários de cenário
// ---------------------------------------------------------------------------

function stars(seed, { n = 80, y0 = 0, y1 = H, color = '#fff', max = 0.8 } = {}) {
  const rng = seeded(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const o = between(rng, 0.2, max).toFixed(2)
    out += `<circle cx="${between(rng, 0, W).toFixed(1)}" cy="${between(rng, y0, y1).toFixed(1)}" r="${between(rng, 0.4, 1.4).toFixed(2)}" fill="${color}" opacity="${o}"/>`
  }
  return out
}

function ridge(seed, { y, amp, step, bottom = H }) {
  const rng = seeded(seed)
  const p = []
  for (let x = -30; x <= W + 30; x += step) p.push(`${x} ${(y + between(rng, -amp, amp)).toFixed(1)}`)
  return `M ${p.join(' L ')} L ${W + 30} ${bottom} L -30 ${bottom} Z`
}

/** Brasas/partículas subindo. */
function motes(seed, { n = 22, color, y0, y1, rise = 160, size = [0.8, 2] }) {
  const rng = seeded(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const dur = between(rng, 4, 9).toFixed(1)
    const begin = between(rng, 0, 6).toFixed(1)
    out += `<circle cx="${between(rng, 0, W).toFixed(1)}" cy="${between(rng, y0, y1).toFixed(1)}" r="${between(rng, size[0], size[1]).toFixed(2)}" fill="${color}" opacity="0">
        <animate attributeName="opacity" values="0;0.9;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; ${between(rng, -30, 30).toFixed(0)} -${between(rng, rise * 0.5, rise).toFixed(0)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      </circle>`
  }
  return out
}

/**
 * Par de lutadores em choque de lâminas. Cada lado fica num <g> com leve
 * vai-e-vem oposto — o "empurra" do duelo travado.
 */
function duelPair({ left, right, at, filter = url('glow') }) {
  const side = (f, dir) => {
    const b = BLADES[f.color]
    const toward = f.toward ?? at
    return `
    <g>
      <animateTransform attributeName="transform" type="translate"
                        values="0 0; ${dir * 2.5} -1; 0 0; ${-dir * 1.2} 0.6; 0 0" dur="2.6s" repeatCount="indefinite"/>
      ${figure({ ...f, rim: f.rim ?? b.blade })}
      ${saber({ grip: f.grip, toward, len: f.len ?? 118, color: b.blade, core: b.core, filter, double: f.double })}
    </g>`
  }
  const colors = [BLADES[left.color].blade, BLADES[right.color].blade]
  return `${side(left, 1)}${side(right, -1)}${clash({ at, colors, filter: url('bloom') })}`
}

// ---------------------------------------------------------------------------
// Cenas
// ---------------------------------------------------------------------------

/** Naboo — sala do gerador: colunas de luz, portões de energia, passarela sobre o abismo. */
function theed() {
  const pillars = Array.from({ length: 10 }, (_, i) => {
    const x = 20 + i * 104 + (i % 3) * 9
    return `
      <rect x="${x}" y="0" width="38" height="${H}" fill="#0b1b22"/>
      <rect x="${x + 16}" y="0" width="6" height="${H}" fill="#47e0d4" opacity="0.28" filter="${url('soft')}"/>
      <rect x="${x + 18}" y="0" width="2" height="${H}" fill="#9ff5ee" opacity="0.4"/>`
  }).join('')

  const gates = [760, 812, 856, 894, 926]
    .map(
      (x, i) => `
      <rect x="${x}" y="${150 + i * 10}" width="7" height="${170 - i * 20}" fill="#ff2b2b" opacity="0.7" filter="${url('soft')}">
        <animate attributeName="opacity" values="0.7;0.35;0.7" dur="${1.6 + i * 0.2}s" repeatCount="indefinite"/>
      </rect>
      <rect x="${x + 2.5}" y="${150 + i * 10}" width="2" height="${170 - i * 20}" fill="#ffb4b0" opacity="0.8"/>`
    )
    .join('')

  return `
    <rect width="${W}" height="${H}" fill="url(#${id('theedSky')})"/>
    ${pillars}
    <ellipse cx="500" cy="200" rx="420" ry="190" fill="url(#${id('theedHalo')})"/>
    ${gates}
    <!-- abismo com fachos de luz subindo -->
    <rect x="0" y="${GROUND + 10}" width="${W}" height="${H - GROUND}" fill="#010406" opacity="0.85"/>
    ${[180, 400, 640, 860].map((x) => `<rect x="${x}" y="${GROUND + 10}" width="60" height="${H - GROUND}" fill="url(#${id('shaft')})"/>`).join('')}
    <!-- passarela -->
    <rect x="90" y="${GROUND}" width="820" height="9" fill="#0b161b"/>
    <rect x="90" y="${GROUND}" width="820" height="1.5" fill="#6fe9df" opacity="0.6"/>
    ${[140, 300, 460, 620, 780].map((x) => `<path d="M ${x} ${GROUND + 9} L ${x + 30} ${GROUND + 40} L ${x + 60} ${GROUND + 9}" stroke="#0b161b" stroke-width="3" fill="none"/>`).join('')}
    ${motes(11, { color: '#8ff3ea', y0: 200, y1: H, n: 16, size: [0.6, 1.4] })}

    ${figure({ x: 238, y: GROUND, facing: 1, grip: [290, 226], rim: BLADES.blue.blade, costume: { robe: true, sleeves: true, hair: true }, pose: { sh: [6, -136], head: [8, -156] } })}
    ${saber({ grip: [290, 226], toward: [334, 108], len: 112, color: BLADES.blue.blade, core: BLADES.blue.core, filter: url('glow') })}

    ${duelPair({
      at: [503, 172],
      left: { x: 410, y: GROUND, facing: 1, grip: [462, 224], color: 'green', costume: { robe: true, sleeves: true, hair: true } },
      right: {
        x: 600, y: GROUND, facing: -1, grip: [548, 214], color: 'red', double: true, len: 100,
        costume: { robe: true, horns: true },
      },
    })}`
}

/** Mustafar — o duelo sobre a lava: céu em brasa, cascatas, braço coletor. */
function mustafar() {
  const falls = [110, 230, 790, 900]
    .map(
      (x, i) => {
        const d = `M ${x} 150 C ${x + 6} 200, ${x - 8} 250, ${x + 4} 300`
        const w = 12 - i * 1.5
        return `
      <path d="${d}" stroke="#ff6a1a" stroke-width="${w * 2.2}" fill="none" opacity="0.45" filter="${url('soft')}"/>
      <path d="${d}" stroke="#ff8a3d" stroke-width="${w}" fill="none" opacity="0.9" stroke-linecap="round"/>
      <path d="${d}" stroke="#ffe3b8" stroke-width="${(w * 0.3).toFixed(1)}" fill="none" stroke-dasharray="46 22" stroke-linecap="round" opacity="0.9">
        <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="${1.4 + i * 0.25}s" repeatCount="indefinite"/>
      </path>
      <ellipse cx="${x + 4}" cy="302" rx="${w * 3}" ry="7" fill="#ffb066" opacity="0.7" filter="${url('soft')}"/>`
      }
    )
    .join('')

  return `
    <rect width="${W}" height="${H}" fill="url(#${id('mustSky')})"/>
    ${[[160, 40, 260, 60], [620, 70, 320, 70], [880, 30, 200, 50], [380, 20, 220, 40]]
      .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#120302" opacity="0.7" filter="${url('haze')}"/>`)
      .join('')}
    <path d="${ridge(41, { y: 150, amp: 40, step: 70, bottom: 330 })}" fill="#1d0604"/>
    ${falls}
    <path d="${ridge(42, { y: 285, amp: 22, step: 60 })}" fill="#120302"/>
    <!-- rio de lava -->
    <rect x="0" y="352" width="${W}" height="${H - 352}" fill="url(#${id('lava')})"/>
    <path d="M -10 372 Q 120 362 260 374 T 520 370 T 780 376 T 1010 366" stroke="#ffe0b0" stroke-width="2" fill="none" opacity="0.7">
      <animate attributeName="d" dur="5s" repeatCount="indefinite"
               values="M -10 372 Q 120 362 260 374 T 520 370 T 780 376 T 1010 366;
                       M -10 368 Q 120 378 260 366 T 520 376 T 780 368 T 1010 374;
                       M -10 372 Q 120 362 260 374 T 520 370 T 780 376 T 1010 366"/>
    </path>
    <ellipse cx="500" cy="360" rx="560" ry="80" fill="#ff5a1f" opacity="0.35" filter="${url('haze')}"/>
    <!-- braço coletor onde a luta acontece -->
    <path d="M 220 ${GROUND} L 790 ${GROUND - 6} L 800 ${GROUND + 6} L 220 ${GROUND + 12} Z" fill="#0a0303"/>
    <path d="M 220 ${GROUND} L 790 ${GROUND - 6}" stroke="#ff7a3d" stroke-width="1.4" opacity="0.6"/>
    ${[300, 420, 540, 660].map((x) => `<line x1="${x}" y1="${GROUND + 10}" x2="${x + 18}" y2="${H}" stroke="#0a0303" stroke-width="5"/>`).join('')}
    ${motes(12, { color: '#ffb066', y0: 260, y1: H, n: 30, rise: 220 })}

    ${duelPair({
      at: [500, 176],
      left: { x: 414, y: GROUND, facing: 1, grip: [464, 222], color: 'blue', costume: { robe: true, sleeves: true, hair: true } },
      right: { x: 588, y: GROUND - 4, facing: -1, grip: [538, 220], color: 'blue', costume: { hair: true, sleeves: true } },
    })}`
}

/** Senado — o salão vermelho de cápsulas. */
function senate() {
  const rows = Array.from({ length: 6 }, (_, k) => {
    const cy = 470 - k * 18
    const rx = 620 - k * 40
    const ry = 300 - k * 34
    const count = 18 - k
    const o = (0.75 - k * 0.1).toFixed(2)
    return Array.from({ length: count }, (_, i) => {
      const a = Math.PI + (i + 0.5) * (Math.PI / count)
      const x = 500 + Math.cos(a) * rx
      const y = cy + Math.sin(a) * ry
      const w = 46 - k * 4
      return `<g opacity="${o}"><path d="${chamfer(x - w / 2, y, w, 14 - k, 4)}" fill="#24060a"/><rect x="${(x - w / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="1.5" fill="#ff5b52" opacity="0.55"/></g>`
    }).join('')
  })
    .reverse()
    .join('')

  return `
    <rect width="${W}" height="${H}" fill="url(#${id('senateSky')})"/>
    ${rows}
    <ellipse cx="500" cy="210" rx="360" ry="170" fill="#ff2a2a" opacity="0.16" filter="${url('haze')}"/>
    <!-- cápsula onde os dois se enfrentam -->
    <ellipse cx="510" cy="${GROUND + 12}" rx="260" ry="26" fill="#14030a"/>
    <ellipse cx="510" cy="${GROUND + 6}" rx="260" ry="22" fill="#1d050c" stroke="#ff5b52" stroke-opacity="0.45" stroke-width="1.5"/>
    <path d="M 250 ${GROUND + 12} L 300 ${H} H 720 L 770 ${GROUND + 12} Z" fill="#0c0206"/>
    ${motes(13, { color: '#ff8a80', y0: 150, y1: H, n: 14, size: [0.6, 1.3] })}

    ${duelPair({
      at: [506, 192],
      left: {
        x: 420, y: GROUND - 64, facing: 1, scale: 0.55, grip: [470, 230], color: 'green', len: 92,
        costume: { robe: true, sleeves: true, ears: true },
        pose: { headR: 17, head: [16, -152], ff: [30, -22], bf: [-18, -8], fk: [34, -48], bk: [-6, -40] },
      },
      right: {
        x: 600, y: GROUND, facing: -1, grip: [548, 226], color: 'red',
        costume: { longRobe: true, hood: true, sleeves: true },
      },
    })}`
}

/** Estrela da Morte — hangar: painéis de metal, porta blindada, piso refletindo. */
function deathStar() {
  const panels = []
  for (let y = 0; y < GROUND; y += 48) {
    for (let x = 0; x < W; x += 96) {
      panels.push(`<rect x="${x + 2}" y="${y + 2}" width="92" height="44" fill="#141a20" stroke="#222b33" stroke-width="1.5"/>`)
    }
  }
  const floorLines = Array.from({ length: 13 }, (_, i) => {
    const bx = -300 + i * 133
    return `<line x1="500" y1="${GROUND - 40}" x2="${bx}" y2="${H + 60}" stroke="#2b3640" stroke-width="1"/>`
  }).join('')

  return `
    <rect width="${W}" height="${H}" fill="#0c1014"/>
    ${panels.join('')}
    <!-- faixas de luz -->
    ${[70, 150].map((y) => `<rect x="0" y="${y}" width="${W}" height="5" fill="#cfe3ff" opacity="0.85"/><rect x="0" y="${y - 6}" width="${W}" height="16" fill="#9cc4ff" opacity="0.25" filter="${url('soft')}"/>`).join('')}
    <!-- porta blindada ao fundo, aberta para o hangar iluminado -->
    <rect x="300" y="96" width="400" height="${GROUND - 96}" fill="#05080b"/>
    <rect x="316" y="110" width="368" height="${GROUND - 110}" fill="url(#${id('hangar')})"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="316" y="${110 + i * 12}" width="368" height="3" fill="#05080b" opacity="0.6"/>`).join('')}
    <rect x="300" y="96" width="400" height="${GROUND - 96}" fill="none" stroke="#3a4651" stroke-width="4"/>
    <!-- piso -->
    <rect x="0" y="${GROUND}" width="${W}" height="${H - GROUND}" fill="url(#${id('floor')})"/>
    ${floorLines}
    <rect x="0" y="${GROUND}" width="${W}" height="2" fill="#8fb0d6" opacity="0.5"/>

    ${duelPair({
      at: [500, 182],
      left: { x: 412, y: GROUND, facing: 1, grip: [462, 226], color: 'blue', costume: { robe: true, sleeves: true, hair: true } },
      right: {
        x: 592, y: GROUND, facing: -1, scale: 1.08, grip: [540, 222], color: 'red',
        costume: { cape: true, helmet: true, bulk: 1.2 },
      },
    })}
    <!-- reflexo das lâminas no piso -->
    <ellipse cx="500" cy="${GROUND + 26}" rx="90" ry="10" fill="#7a5cff" opacity="0.25" filter="${url('soft')}"/>`
}

/** Cidade das Nuvens — o poço do reator: névoa azul, luz laranja vinda de baixo. */
function bespin() {
  const ribs = Array.from({ length: 9 }, (_, i) => {
    const y = 20 + i * 44
    return `<rect x="0" y="${y}" width="150" height="6" fill="#0b1a26"/><rect x="${W - 150}" y="${y}" width="150" height="6" fill="#0b1a26"/>`
  }).join('')

  return `
    <rect width="${W}" height="${H}" fill="url(#${id('bespinSky')})"/>
    <!-- estrutura circular ao fundo -->
    <g fill="none" stroke="#1d3a4f" opacity="0.8">
      <circle cx="500" cy="160" r="210" stroke-width="18"/>
      <circle cx="500" cy="160" r="150" stroke-width="6"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return `<line x1="${(500 + Math.cos(a) * 150).toFixed(1)}" y1="${(160 + Math.sin(a) * 150).toFixed(1)}" x2="${(500 + Math.cos(a) * 210).toFixed(1)}" y2="${(160 + Math.sin(a) * 210).toFixed(1)}" stroke-width="6"/>`
      }).join('')}
    </g>
    <circle cx="500" cy="160" r="140" fill="#2aa1d6" opacity="0.12" filter="${url('haze')}"/>
    <!-- paredes do poço -->
    <rect x="0" y="0" width="150" height="${H}" fill="#06111a"/>
    <rect x="${W - 150}" y="0" width="150" height="${H}" fill="#06111a"/>
    ${ribs}
    <ellipse cx="500" cy="${H + 10}" rx="420" ry="120" fill="#ff8a3d" opacity="0.45" filter="${url('haze')}"/>
    <!-- névoa correndo -->
    ${[0, 1, 2].map((i) => `
    <ellipse cx="${300 + i * 220}" cy="${250 + i * 40}" rx="260" ry="34" fill="#9fd3ee" opacity="0.08" filter="${url('haze')}">
      <animateTransform attributeName="transform" type="translate" values="-60 0; 80 0; -60 0" dur="${14 + i * 4}s" repeatCount="indefinite"/>
    </ellipse>`).join('')}
    <!-- passarela que termina no vazio -->
    <rect x="150" y="${GROUND}" width="520" height="8" fill="#050c12"/>
    <rect x="150" y="${GROUND}" width="520" height="1.5" fill="#ffb27a" opacity="0.55"/>
    <rect x="664" y="${GROUND - 4}" width="8" height="16" fill="#050c12"/>
    ${[200, 330, 460, 590].map((x) => `<line x1="${x}" y1="${GROUND + 8}" x2="${x}" y2="${H}" stroke="#050c12" stroke-width="4"/>`).join('')}

    ${duelPair({
      at: [498, 180],
      left: { x: 410, y: GROUND, facing: 1, grip: [460, 224], color: 'blue', costume: { hair: true } },
      right: {
        x: 590, y: GROUND, facing: -1, scale: 1.08, grip: [538, 220], color: 'red',
        costume: { cape: true, helmet: true, bulk: 1.2 },
      },
    })}`
}

/** Sala do trono — a janela circular gigante com a lua florestal lá fora. */
function throne() {
  const cx = 500
  const cy = 190
  const R = 200
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R).toFixed(1)}"/>`
  }).join('')

  return `
    <rect width="${W}" height="${H}" fill="#05070a"/>
    <clipPath id="${id('window')}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    <g clip-path="url(#${id('window')})">
      <rect x="${cx - R}" y="${cy - R}" width="${R * 2}" height="${R * 2}" fill="#03060c"/>
      ${stars(61, { n: 120 })}
      <!-- lua florestal -->
      <circle cx="${cx - 150}" cy="${cy + 250}" r="200" fill="url(#${id('moon')})"/>
      <circle cx="${cx - 150}" cy="${cy + 250}" r="200" fill="none" stroke="#8fd0a8" stroke-width="2" opacity="0.5"/>
      <!-- estação em construção, ao longe -->
      <circle cx="${cx + 110}" cy="${cy - 70}" r="44" fill="none" stroke="#7d8794" stroke-width="1" opacity="0.6" stroke-dasharray="3 3"/>
      <path d="M ${cx + 66} ${cy - 70} A 44 44 0 0 1 ${cx + 154} ${cy - 70}" fill="#1a2028" opacity="0.8"/>
    </g>
    <g fill="none" stroke="#1f252d">
      <circle cx="${cx}" cy="${cy}" r="${R}" stroke-width="16"/>
      <circle cx="${cx}" cy="${cy}" r="${R * 0.62}" stroke-width="7"/>
      <circle cx="${cx}" cy="${cy}" r="${R * 0.28}" stroke-width="7"/>
      <g stroke-width="5">${spokes}</g>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="none" stroke="#3a4552" stroke-width="2"/>
    <!-- degraus -->
    ${[0, 1, 2, 3].map((i) => `<rect x="${120 - i * 40}" y="${GROUND + i * 14}" width="${760 + i * 80}" height="14" fill="${['#0d1116', '#0b0e12', '#090b0f', '#07090c'][i]}"/><rect x="${120 - i * 40}" y="${GROUND + i * 14}" width="${760 + i * 80}" height="1.2" fill="#5d6b7a" opacity="${0.6 - i * 0.12}"/>`).join('')}
    <rect x="0" y="${GROUND + 56}" width="${W}" height="${H}" fill="#05070a"/>

    ${duelPair({
      at: [500, 182],
      left: { x: 412, y: GROUND, facing: 1, grip: [462, 226], color: 'green', costume: { hair: true, sleeves: true } },
      right: {
        x: 592, y: GROUND, facing: -1, scale: 1.08, grip: [540, 222], color: 'red',
        costume: { cape: true, helmet: true, bulk: 1.2 },
      },
    })}`
}

const SCENES = { theed, mustafar, senate, deathStar, bespin, throne }

// ---------------------------------------------------------------------------
// Moldura do projetor
// ---------------------------------------------------------------------------

function defs() {
  return `
    <filter id="${id('glow')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${id('bloom')}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="${id('soft')}" x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${id('haze')}" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>
    ${scanlineDef(id('scan'), '#000', 0.28)}

    <linearGradient id="${id('theedSky')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#06141a"/><stop offset="1" stop-color="#010507"/>
    </linearGradient>
    <radialGradient id="${id('theedHalo')}"><stop offset="0" stop-color="#3fd1c8" stop-opacity="0.22"/><stop offset="1" stop-color="#3fd1c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id('shaft')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#47e0d4" stop-opacity="0.18"/><stop offset="1" stop-color="#47e0d4" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="${id('mustSky')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e0403"/><stop offset="0.55" stop-color="#5c1006"/><stop offset="1" stop-color="#a8320c"/>
    </linearGradient>
    <linearGradient id="${id('lava')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb347"/><stop offset="0.3" stop-color="#ff6a1a"/><stop offset="1" stop-color="#8a1a06"/>
    </linearGradient>

    <radialGradient id="${id('senateSky')}" cx="0.5" cy="0.45" r="0.7">
      <stop offset="0" stop-color="#4a0b12"/><stop offset="1" stop-color="#0d0205"/>
    </radialGradient>

    <linearGradient id="${id('hangar')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dfeaff"/><stop offset="0.6" stop-color="#8fb3e6"/><stop offset="1" stop-color="#3d5778"/>
    </linearGradient>
    <linearGradient id="${id('floor')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c252e"/><stop offset="1" stop-color="#07090c"/>
    </linearGradient>

    <linearGradient id="${id('bespinSky')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1a26"/><stop offset="0.6" stop-color="#14354a"/><stop offset="1" stop-color="#3a2a26"/>
    </linearGradient>

    <radialGradient id="${id('moon')}" cx="0.65" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#5f9c74"/><stop offset="0.6" stop-color="#21402f"/><stop offset="1" stop-color="#0b1610"/>
    </radialGradient>

    <linearGradient id="${id('captionScrim')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#010307" stop-opacity="0"/><stop offset="0.5" stop-color="#010307" stop-opacity="0.82"/><stop offset="1" stop-color="#010307" stop-opacity="0.96"/>
    </linearGradient>
    <radialGradient id="${id('vignette')}" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/>
    </radialGradient>
    <clipPath id="${id('card')}"><rect width="${W}" height="${H}" rx="18"/></clipPath>`
}

function caption(d, i, n) {
  const L = BLADES[d.left.color]
  const R = BLADES[d.right.color]
  return `
      <rect x="0" y="${H - 132}" width="${W}" height="132" fill="url(#${id('captionScrim')})"/>
      <text x="40" y="${H - 82}" font-family="${MONO}" font-size="12" letter-spacing="3" fill="#a8b3c2">${esc(d.episode)} · ${esc(d.film.toUpperCase())} · ${esc(d.year)}</text>
      <text x="40" y="${H - 46}" font-family="${SANS}" font-size="32" font-weight="800" letter-spacing="-0.5">
        <tspan fill="${L.text}">${esc(d.left.name)}</tspan><tspan fill="#6b7685" font-size="20" font-weight="600" dx="10">vs</tspan><tspan fill="${R.text}" dx="10">${esc(d.right.name)}</tspan>
      </text>
      <text x="40" y="${H - 22}" font-family="${MONO}" font-size="12" fill="#8592a3">◉ ${esc(d.place)}</text>
      <text x="${W - 40}" y="52" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="2" fill="#c9d4e2">REGISTRO <tspan fill="#fff" font-weight="700">${String(i + 1).padStart(2, '0')}</tspan> / ${String(n).padStart(2, '0')}</text>`
}

/** Barra de progresso: n segmentos, o atual enchendo ao longo da cena. */
function progress(n, cycle) {
  const segW = 34
  const gap = 6
  const x0 = W - 40 - (segW * n + gap * (n - 1))
  const y = H - 30
  const base = Array.from({ length: n }, (_, i) => `<rect x="${x0 + i * (segW + gap)}" y="${y}" width="${segW}" height="3" fill="#ffffff" opacity="0.18"/>`).join('')
  const fills = Array.from({ length: n }, (_, i) => {
    const k = (1 / n).toFixed(4)
    return `<rect x="${x0 + i * (segW + gap)}" y="${y}" width="${i === 0 ? segW : 0}" height="3" fill="#ff3b30">
        <animate attributeName="width" values="0;${segW};0;0" keyTimes="0;${k};${k};1" dur="${cycle}s" begin="${i * SCENE}s" repeatCount="indefinite"/>
      </rect>`
  }).join('')
  return base + fills
}

function holo(profile) {
  const cfg = profile.duels
  const list = cfg.items
  const n = list.length
  const cycle = n * SCENE
  const k = 1 / n
  const fade = 0.6 / cycle // 0.6s de crossfade

  const scenes = list
    .map((d, i) => {
      const draw = SCENES[d.scene]
      if (!draw) throw new Error(`cena desconhecida: ${d.scene}`)
      return `
    <g opacity="${i === 0 ? 1 : 0}">
      <animate attributeName="opacity" values="0;1;1;0;0"
               keyTimes="0;${fade.toFixed(4)};${(k - fade).toFixed(4)};${k.toFixed(4)};1"
               dur="${cycle}s" begin="${i * SCENE}s" repeatCount="indefinite"/>
      ${draw()}
      ${caption(d, i, n)}
    </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.title)}">
  <title>${esc(cfg.title)} — ${list.map((d) => `${d.left.name} vs ${d.right.name}`).map(esc).join('; ')}</title>
  <defs>${defs()}</defs>

  <g clip-path="url(#${id('card')})">
    ${scenes}

    <!-- moldura do projetor: comum a todas as cenas -->
    <rect width="${W}" height="${H}" fill="url(#${id('vignette')})"/>
    <rect width="${W}" height="${H}" fill="url(#${id('scan')})"/>
    <rect x="0" y="-60" width="${W}" height="60" fill="#9fd8ff" opacity="0.05">
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 ${H + 60}" dur="5.5s" repeatCount="indefinite"/>
    </rect>

    <path d="${chamfer(24, 22, 330, 40, 8)}" fill="#010307" fill-opacity="0.72" stroke="#ff3b30" stroke-opacity="0.45"/>
    <circle cx="44" cy="42" r="4.5" fill="#ff3b30">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite"/>
    </circle>
    <text x="58" y="47" font-family="${MONO}" font-size="12" letter-spacing="2.2" fill="#f1d9d7">${esc(cfg.title)}</text>
    ${glyphStrip({ x: W - 40, y: 66, width: 200, size: 6, seed: 99, color: '#c9d4e2', opacity: 0.35, anchor: 'end' })}
    ${signalBars({ x: W - 210, y: 52, color: '#ff3b30', dim: '#3a2a2c' })}

    ${progress(n, cycle)}

    <path d="${brackets(12, 12, W - 24, H - 24, 26)}" fill="none" stroke="#ff3b30" stroke-width="2" opacity="0.6"/>
    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="#ff3b30" opacity="0.8"/>
    <rect width="${W}" height="${H}" rx="18" fill="none" stroke="#2a1113" stroke-width="2"/>
  </g>
</svg>
`
}

const profile = JSON.parse(await readFile(join(DATA, 'profile.json'), 'utf8'))
await mkdir(ASSETS, { recursive: true })

if (!profile.duels?.items?.length) {
  console.log('· sem duelos em profile.json — pulando assets/duels-dark.svg')
} else {
  for (const t of themesOf('duels')) {
    // Espaço entre tags é só indentação do template: removido, o arquivo cai
    // para perto da metade — e o proxy de imagens do GitHub penaliza peso.
    await writeFile(join(ASSETS, `duels-${t.id}.svg`), holo(profile).replace(/>\s+</g, '><'))
    console.log(`✓ assets/duels-${t.id}.svg — ${profile.duels.items.length} duelos`)
  }
}
