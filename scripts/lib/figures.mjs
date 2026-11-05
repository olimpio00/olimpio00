/**
 * Rig mínimo de silhuetas para os duelos.
 *
 * Cada lutador é montado a partir de "articulações" (pés, joelhos, quadril,
 * ombro, cabeça) em coordenadas locais — virado para +x, chão em y=0, ~170
 * unidades de altura. Membros são traços grossos com ponta redonda; tronco,
 * manto, capa e capacete são caminhos fechados. É o suficiente para ler como
 * silhueta de cinema contra um fundo iluminado, e mantém cada lutador em
 * poucas dezenas de linhas de SVG.
 *
 * Por que silhueta e não ilustração: o reconhecimento vem do contorno (capa,
 * capacete, capuz, orelhas) e da cor do sabre. Detalhe interno ninguém enxerga
 * a 500px de largura no celular — e quanto mais fiel, mais perto de copiar
 * arte de terceiro.
 */

const BASE = {
  ff: [38, 0], // pé da frente
  bf: [-42, 0], // pé de trás
  fk: [26, -44], // joelho da frente
  bk: [-24, -46], // joelho de trás
  hip: [0, -86],
  sh: [10, -136], // ombro
  head: [14, -156],
  headR: 12,
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const pts = (list) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

/** Cotovelo: ponto médio ombro→mão, empurrado para baixo (perpendicular). */
function elbow(sh, hand, bend) {
  const dx = hand[0] - sh[0]
  const dy = hand[1] - sh[1]
  const len = Math.hypot(dx, dy) || 1
  return [(sh[0] + hand[0]) / 2 - (dy / len) * bend, (sh[1] + hand[1]) / 2 + (dx / len) * bend]
}

function shapes(P, hand, c) {
  const out = []
  const [hx, hy] = P.head
  const r = P.headR
  const bulk = c.bulk ?? 1

  // ---- capa (atrás de tudo)
  if (c.cape) {
    const [sx, sy] = P.sh
    out.push({
      d: `M ${sx + 6} ${sy - 4} C ${sx - 30} ${sy + 10}, ${sx - 64} ${sy + 70}, ${sx - 70} ${-2}
          L ${sx - 22} ${0} C ${sx - 30} ${sy + 80}, ${sx - 8} ${sy + 40}, ${sx + 12} ${sy + 8} Z`,
    })
  }

  // ---- perna de trás
  if (!c.longRobe) out.push({ line: [P.bf, P.bk, P.hip], w: 14 * bulk })

  // ---- braço de trás
  const backHand = add(hand, [-6, 3])
  out.push({ line: [P.sh, elbow(P.sh, backHand, 18), backHand], w: (c.sleeves ? 13 : 10) * bulk })

  // ---- tronco
  const [hipX, hipY] = P.hip
  const [shX, shY] = P.sh
  const tw = 14 * bulk
  out.push({
    d: `M ${hipX - tw} ${hipY} L ${hipX + tw} ${hipY} L ${shX + tw + 4} ${shY + 2}
        Q ${shX} ${shY - 10}, ${shX - tw} ${shY + 4} Z`,
  })

  // ---- manto até o joelho / túnica longa até o chão
  if (c.longRobe) {
    out.push({
      d: `M ${shX - 14} ${shY + 4} L ${shX + 20} ${shY + 2} C ${shX + 36} ${-60}, ${52} ${-20}, ${58} ${0}
          L ${-56} ${0} C ${-46} ${-30}, ${-30} ${-70}, ${shX - 14} ${shY + 4} Z`,
    })
  } else if (c.robe) {
    // Túnica até o joelho, aberta entre as pernas: o vão do meio é o que
    // impede a silhueta de ler como vestido.
    const F = [P.fk[0] + 14, P.fk[1] - 2]
    const B = [P.bk[0] - 22, P.bk[1] + 6]
    const mid = [(F[0] + B[0]) / 2 + 2, Math.min(F[1], B[1]) - 16]
    out.push({
      d: `M ${hipX - 14} ${hipY - 10} L ${hipX + 15} ${hipY - 10}
          Q ${F[0] - 2} ${(hipY + F[1]) / 2}, ${F[0]} ${F[1]} L ${mid[0]} ${mid[1]} L ${B[0]} ${B[1]}
          Q ${B[0] + 6} ${(hipY + B[1]) / 2}, ${hipX - 14} ${hipY - 10} Z`,
    })
  }

  // ---- perna da frente
  if (!c.longRobe) out.push({ line: [P.ff, P.fk, P.hip], w: 14 * bulk })

  // ---- pescoço + cabeça
  out.push({ line: [P.sh, [hx - 1, hy + 6]], w: 9 * bulk })

  if (c.helmet) {
    // Capacete: frente reta, cúpula, aba que desce mais atrás que na frente.
    out.push({
      d: `M ${hx + 12} ${hy + 11} L ${hx + 13} ${hy - 2} C ${hx + 14} ${hy - 19}, ${hx - 14} ${hy - 21}, ${hx - 15} ${hy - 3}
          L ${hx - 21} ${hy + 15} L ${hx - 4} ${hy + 12} Z`,
    })
  } else if (c.hood) {
    out.push({
      d: `M ${hx + 13} ${hy + 10} C ${hx + 17} ${hy - 8}, ${hx + 6} ${hy - 22}, ${hx - 8} ${hy - 21}
          C ${hx - 18} ${hy - 18}, ${hx - 20} ${hy + 2}, ${hx - 16} ${hy + 16} Z`,
    })
  } else {
    out.push({ circle: [hx, hy, r] })
  }

  if (c.horns) {
    const spikes = [-8, -3, 2, 7].map(
      (dx) => `M ${hx + dx - 2} ${hy - r + 2} L ${hx + dx} ${hy - r - 6} L ${hx + dx + 2} ${hy - r + 2} Z`
    )
    out.push({ d: spikes.join(' ') })
  }

  if (c.ears) {
    out.push({
      d: `M ${hx - 4} ${hy - 3} L ${hx - 36} ${hy - 12} L ${hx - 4} ${hy + 5} Z
          M ${hx + 4} ${hy - 3} L ${hx + 34} ${hy - 13} L ${hx + 4} ${hy + 5} Z`,
    })
  }

  if (c.hair) {
    out.push({
      d: `M ${hx - r - 1} ${hy + 8} C ${hx - r - 3} ${hy - 12}, ${hx + 4} ${hy - r - 6}, ${hx + r} ${hy - 4}
          L ${hx - 2} ${hy - 4} L ${hx - 6} ${hy + 14} Z`,
    })
  }

  // ---- braço da frente (por cima do tronco)
  out.push({ line: [P.sh, elbow(P.sh, hand, 12), hand], w: (c.sleeves ? 13 : 10) * bulk })

  return out
}

function render(list, { fill, rim, rimW }) {
  return list
    .map((s) => {
      if (s.line) {
        return `<polyline points="${pts(s.line)}" fill="none" stroke="${rim ?? fill}" stroke-width="${(s.w + (rimW ?? 0)).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`
      }
      if (s.circle) {
        const [cx, cy, r] = s.circle
        return `<circle cx="${cx}" cy="${cy}" r="${r + (rimW ?? 0) / 2}" fill="${rim ?? fill}"/>`
      }
      const d = s.d.replace(/\s+/g, ' ').trim()
      return rim
        ? `<path d="${d}" fill="${rim}" stroke="${rim}" stroke-width="${rimW}" stroke-linejoin="round"/>`
        : `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="0.8" stroke-linejoin="round"/>`
    })
    .join('')
}

/**
 * Um lutador.
 * @param x,y     posição do ponto entre os pés, em coordenadas do mundo
 * @param facing  1 = olhando para a direita, -1 = esquerda
 * @param grip    [x,y] da mão no mundo — o rig estica os braços até ela
 * @param costume { robe, longRobe, cape, helmet, hood, horns, ears, hair, sleeves, bulk }
 * @param pose    sobrescreve articulações do BASE (coordenadas locais)
 * @param rim     cor da luz de recorte (normalmente a do sabre mais próximo)
 */
export function figure({ x, y, facing = 1, scale = 1, grip, costume = {}, pose = {}, fill = '#040306', rim, rimW = 3.2 }) {
  const P = { ...BASE, ...pose }
  const hand = [(grip[0] - x) / (facing * scale), (grip[1] - y) / scale]
  const list = shapes(P, hand, costume)

  return `
      <g transform="translate(${x} ${y}) scale(${facing * scale} ${scale})">
        ${rim ? `<g opacity="0.85">${render(list, { rim, rimW: rimW / scale })}</g>` : ''}
        <g>${render(list, { fill })}</g>
      </g>`
}

/**
 * Sabre de luz: punho na mão, lâmina em direção a `toward`.
 * Três camadas (halo borrado, corpo colorido, núcleo quase branco) — a mesma
 * receita do sabre do banner.
 */
export function saber({ grip, toward, len = 112, color, core = '#fff', filter, double = false, hum = true }) {
  const dx = toward[0] - grip[0]
  const dy = toward[1] - grip[1]
  const n = Math.hypot(dx, dy) || 1
  const ux = dx / n
  const uy = dy / n
  const tip = [grip[0] + ux * len, grip[1] + uy * len]
  const hiltA = [grip[0] - ux * 9, grip[1] - uy * 9]
  const hiltB = [grip[0] + ux * 7, grip[1] + uy * 7]

  const blades = [[hiltB, tip]]
  if (double) {
    const back = [grip[0] - ux * (len * 0.85), grip[1] - uy * (len * 0.85)]
    blades.push([hiltA, back])
  }

  const line = ([a, b], w, stroke, extra = '') =>
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${extra}/>`

  const flicker = hum
    ? `<animate attributeName="opacity" values="0.75;0.6;0.8;0.65;0.75" dur="0.45s" repeatCount="indefinite"/>`
    : ''

  return `
      <g>
        <g opacity="0.75"${filter ? ` filter="${filter}"` : ''}>${flicker}${blades.map((b) => line(b, 13, color)).join('')}</g>
        ${blades.map((b) => line(b, 5.5, color, ' opacity="0.95"')).join('')}
        ${blades.map((b) => line(b, 2.4, core)).join('')}
        ${line([hiltA, double ? add(hiltB, [ux * 2, uy * 2]) : hiltB], 4.5, '#8d96a3')}
      </g>`
}

/**
 * Faísca no ponto de choque das lâminas. Um clarão central que pulsa e
 * fagulhas que saltam em direções fixas (semente implícita na lista).
 * Sem SMIL o clarão fica aceso e as fagulhas somem — estado válido.
 */
export function clash({ at, colors, filter }) {
  const [cx, cy] = at
  const dirs = [
    [-38, -30], [34, -36], [-20, 26], [42, 14], [-46, 4], [12, -44], [26, 34], [-8, 40],
  ]
  const sparks = dirs
    .map(([dx, dy], i) => {
      const dur = (0.7 + (i % 4) * 0.18).toFixed(2)
      const begin = ((i * 0.37) % 1.3).toFixed(2)
      return `<circle cx="${cx}" cy="${cy}" r="${1.2 + (i % 3) * 0.5}" fill="${i % 2 ? '#fff6e0' : colors[i % colors.length]}" opacity="0">
          <animate attributeName="opacity" values="1;0.8;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0; ${dx} ${dy}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        </circle>`
    })
    .join('')

  const star = [0, 45, 90, 135]
    .map((a) => {
      const r = a % 90 === 0 ? 22 : 12
      const rad = (a * Math.PI) / 180
      const x = Math.cos(rad) * r
      const y = Math.sin(rad) * r
      return `<line x1="${(cx - x).toFixed(1)}" y1="${(cy - y).toFixed(1)}" x2="${(cx + x).toFixed(1)}" y2="${(cy + y).toFixed(1)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`
    })
    .join('')

  return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="26" fill="${colors[0]}" opacity="0.5"${filter ? ` filter="${filter}"` : ''}>
          <animate attributeName="r" values="22;30;20;27;22" dur="0.6s" repeatCount="indefinite"/>
        </circle>
        <g opacity="0.95">
          <animate attributeName="opacity" values="1;0.55;0.95;0.7;1" dur="0.3s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="rotate" values="0 ${cx} ${cy}; 45 ${cx} ${cy}; 0 ${cx} ${cy}" dur="1.2s" repeatCount="indefinite"/>
          ${star}
        </g>
        <circle cx="${cx}" cy="${cy}" r="5" fill="#fff"/>
        ${sparks}
      </g>`
}
