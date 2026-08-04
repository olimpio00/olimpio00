/** Elementos de cena compartilhados entre o banner e o card de estatísticas. */
import { between, seeded } from './random.mjs'

/**
 * IDs de <defs> sufixados por tema.
 *
 * Sem isso, dois SVGs no mesmo documento HTML colidem: `url(#rule)` resolve
 * para o primeiro match do documento, então o tema claro herda o gradiente do
 * escuro. No README cada SVG é um <img> isolado e o bug não aparece — mas
 * aparece em qualquer página que embuta os arquivos inline (o preview, por ex).
 */
export const id = (name, t) => `${name}-${t.id}`
export const ref = (name, t) => `url(#${id(name, t)})`

/**
 * Campo de estrelas (ou cinza em suspensão, no tema claro).
 * @param seed semente fixa por asset — mesmo build, mesmo céu.
 */
export function starfield(t, { w, h, seed }) {
  const rng = seeded(seed)
  const out = []

  for (let i = 0; i < t.starCount; i++) {
    const x = between(rng, 0, w).toFixed(1)
    const y = between(rng, 0, h).toFixed(1)
    const r = between(rng, 0.4, 1.5).toFixed(2)
    const o = between(rng, 0.25, t.starOpacity).toFixed(2)
    const twinkles = rng() < 0.22

    out.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.star}" opacity="${o}">` +
        (twinkles
          ? `<animate attributeName="opacity" values="${o};${(o * 0.2).toFixed(2)};${o}" ` +
            `dur="${between(rng, 2.4, 5.5).toFixed(1)}s" begin="${between(rng, 0, 4).toFixed(1)}s" repeatCount="indefinite"/>`
          : '') +
        `</circle>`
    )
  }

  return out.join('')
}

/**
 * Calor subindo no topo da cena.
 *
 * É um gradiente radial num rect, não um círculo sob feGaussianBlur: o blur de
 * 58px que existia aqui antes era o filtro mais caro dos dois SVGs e produzia
 * exatamente a mesma mancha difusa. Gradiente também não depende de o
 * renderizador suportar filtros.
 */
export const skyGlow = (t, { w, h }) => `
    <rect width="${w}" height="${h}" fill="${ref('sky', t)}"/>`

/** Linha serrilhada atravessando a cena, aberta — serve de crista ou de veio. */
function ridgeLine(rng, { w, y, amp, step }) {
  const points = []
  for (let x = -30; x <= w + 30; x += step) {
    points.push(`${x} ${(y + between(rng, -amp, amp)).toFixed(1)}`)
  }
  return `M ${points.join(' L ')}`
}

/** A mesma linha, fechada até a base — silhueta de montanha preenchível. */
const ridgePath = (rng, opts) => `${ridgeLine(rng, opts)} L ${opts.w + 30} ${opts.bottom} L -30 ${opts.bottom} Z`

/**
 * Horizonte de Mustafar: rio de lava entre duas cristas de basalto.
 *
 * A profundidade vem da ordem de pintura — crista distante, rio, crista da
 * frente. O rio fica *atrás* da rocha próxima de propósito: é a luz vazando
 * por trás da pedra que lê como lava, não uma faixa laranja solta no meio da
 * imagem. Por isso o veio é uma polilinha irregular e não um rect: uma barra
 * reta de ponta a ponta lê como neon, não como rocha derretida.
 *
 * As três espessuras do veio são um só caminho desenhado em camadas — bloom
 * difuso, corpo laranja, núcleo quase branco. É o que dá a impressão de que a
 * luz vem de dentro.
 *
 * Tudo estático: a cena já tem brasa pulsando, estrelas piscando e o crawl
 * subindo. Montanha que se move viraria ruído.
 */
export function lavaHorizon(t, { w, bottom, base, seed }) {
  const rng = seeded(seed)
  const far = ridgePath(rng, { w, bottom, y: base - 48, amp: 17, step: 58 })
  const seam = ridgeLine(rng, { w, y: base - 28, amp: 11, step: 44 })
  // Amplitude maior que a do veio de propósito: é o que faz picos de rocha
  // cruzarem o rio e a lava aparecer só nos vãos.
  const near = ridgePath(rng, { w, bottom, y: base + 2, amp: 31, step: 84 })

  return `
    <g>
      <path d="${far}" fill="${t.rockFar}"/>
      <path d="${far}" fill="none" stroke="${t.rockEdge}" stroke-width="1" opacity="0.45"/>

      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${seam}" stroke="${t.lavaMid}" stroke-width="26" opacity="0.55" filter="${ref('heat', t)}"/>
        <path d="${seam}" stroke="${t.lavaHot}" stroke-width="9" opacity="0.9"/>
        <path d="${seam}" stroke="${t.lavaCore}" stroke-width="2.5" opacity="0.95"/>
      </g>

      <path d="${near}" fill="${t.rock}"/>
      <path d="${near}" fill="none" stroke="${t.rockEdge}" stroke-width="1.5" opacity="0.8"/>
    </g>`
}

/**
 * Halo de calor pulsando devagar.
 *
 * Vai *antes* do horizonte na ordem de pintura: o calor tem que sangrar do rio
 * para cima, com as cristas na frente dele. Desenhado depois, viraria um véu
 * vermelho sobre a rocha.
 *
 * Sem SMIL fica na opacidade base, que é o estado correto — não invisível.
 */
export const emberGlow = (t, { cx, cy, rx, ry }) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(0)}" ry="${ry}"
             fill="${ref('ember', t)}" opacity="${t.glow}">
      <animate attributeName="opacity" values="${t.glow};${(t.glow * 1.4).toFixed(2)};${t.glow}"
               dur="6s" repeatCount="indefinite"/>
    </ellipse>`

/**
 * Faíscas subindo da lava. Cada uma tem duração e atraso próprios — sincronizadas
 * denunciariam o truque na primeira olhada.
 */
export function embers(t, { w, base, seed, count = 26 }) {
  const rng = seeded(seed)
  const out = []

  for (let i = 0; i < count; i++) {
    const x = between(rng, 10, w - 10).toFixed(1)
    const y = between(rng, base - 30, base + 20).toFixed(1)
    const r = between(rng, 0.8, 2.1).toFixed(2)
    const rise = between(rng, 120, 300).toFixed(0)
    const drift = between(rng, -34, 34).toFixed(0)
    const dur = between(rng, 5.5, 11).toFixed(1)
    const delay = between(rng, 0, 9).toFixed(1)

    out.push(`
      <circle cx="${x}" cy="${y}" r="${r}" fill="${t.ember}" opacity="0">
        <animate attributeName="opacity" values="0;0.9;0.7;0" keyTimes="0;0.15;0.6;1"
                 dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate"
                          values="0 0; ${drift} -${rise}" dur="${dur}s"
                          begin="${delay}s" repeatCount="indefinite"/>
      </circle>`)
  }

  return `<g>${out.join('')}</g>`
}

/**
 * Sabre de luz vertical: punho + lâmina que acende de baixo para cima.
 * A ignição anima `y` e `height` juntos — só `height` faria a lâmina crescer
 * para baixo, a partir do punho, que é o oposto do movimento.
 */
export function saber(t, { x = 44, top = 40, bottom = 228 } = {}) {
  const h = bottom - top
  const cx = x + 6.5

  return `
    <g>
      <rect x="${x}" y="${bottom}" width="13" height="30" rx="2.5" fill="${t.hilt}"/>
      <rect x="${x}" y="${bottom + 7}" width="13" height="2.5" fill="${t.hiltDark}"/>
      <rect x="${x}" y="${bottom + 13}" width="13" height="2.5" fill="${t.hiltDark}"/>
      <rect x="${x + 2}" y="${bottom + 22}" width="9" height="5" rx="1" fill="${t.hiltDark}"/>

      <rect x="${cx - 5}" y="${top}" width="10" height="${h}" rx="5"
            fill="${t.saberGlow}" opacity="${t.saberHalo}" filter="${ref('blade', t)}">
        <animate attributeName="y" from="${bottom}" to="${top}" dur="0.85s" fill="freeze"/>
        <animate attributeName="height" from="0" to="${h}" dur="0.85s" fill="freeze"/>
      </rect>

      <rect x="${cx - 1.75}" y="${top}" width="3.5" height="${h}" rx="1.75" fill="${t.saberCore}">
        <animate attributeName="y" from="${bottom}" to="${top}" dur="0.85s" fill="freeze"/>
        <animate attributeName="height" from="0" to="${h}" dur="0.85s" fill="freeze"/>
      </rect>
    </g>`
}

/**
 * Filtros e gradientes da cena. Vai dentro de <defs>.
 * @param w largura do asset — o gradiente do céu é ancorado em userSpace para
 *          o foco cair no topo/centro, como no design.
 */
export const sceneDefs = (t, { w, h }) => `
    <!-- Régua da base, comum aos dois assets: brasa viva na esquerda apagando
         para a direita. É o que amarra banner e console como um par. -->
    <linearGradient id="${id('rule', t)}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="1"/>
      <stop offset="0.5" stop-color="${t.accent3}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id('sky', t)}" gradientUnits="userSpaceOnUse"
                    cx="${w / 2}" cy="0" r="${w * 0.78}">
      <stop offset="0" stop-color="${t.sky}"/>
      <stop offset="0.55" stop-color="${t.bg}"/>
      <stop offset="1" stop-color="${t.bg}"/>
    </radialGradient>
    <radialGradient id="${id('ember', t)}">
      <stop offset="0" stop-color="${t.accent3}" stop-opacity="0.85"/>
      <stop offset="0.45" stop-color="${t.accent2}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/>
    </radialGradient>
    <!-- Puxa a base para a cor de fundo, para o nome e os chips ficarem
         legíveis sobre a lava. No tema claro isso clareia em vez de escurecer,
         e por isso a opacidade é menor: 0.97 apagaria a rocha por completo. -->
    <linearGradient id="${id('scrim', t)}" gradientUnits="objectBoundingBox" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${t.bg}" stop-opacity="${t.scrim}"/>
      <stop offset="0.45" stop-color="${t.bg}" stop-opacity="${(t.scrim * 0.88).toFixed(2)}"/>
      <stop offset="1" stop-color="${t.bg}" stop-opacity="0"/>
    </linearGradient>
    <!-- Região generosa: a bbox do veio tem ~22px de altura e o bloom precisa
         de ~55px de folga (metade do traço + 3σ). Apertado, o brilho é cortado
         numa linha reta acima da lava. -->
    <filter id="${id('heat', t)}" x="-8%" y="-500%" width="116%" height="1100%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="${id('blade', t)}" x="-200%" y="-50%" width="500%" height="200%">
      <feGaussianBlur stdDeviation="4.5"/>
    </filter>
    <!-- Halo colorido: o blur puro devolveria brilho branco, e o design pede
         texto claro com auréola vermelha. feFlood tinge a silhueta borrada. -->
    <filter id="${id('textGlow', t)}" x="-30%" y="-80%" width="160%" height="260%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${t.textGlow}" result="b"/>
      <!-- 0.6, não 1: com o halo muito opaco encostado num texto branco o
           resultado satura e volta a parecer brilho branco, não vermelho. -->
      <feFlood flood-color="${t.glowColor}" flood-opacity="0.6" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`
