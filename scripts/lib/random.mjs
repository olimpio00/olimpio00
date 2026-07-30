/**
 * PRNG determinístico (mulberry32).
 *
 * Math.random() aqui seria um bug silencioso: o campo de estrelas mudaria a
 * cada build, o Action commitaria SVGs "novos" todo dia e o cache-buster
 * invalidaria as imagens sem que nada tivesse realmente mudado.
 */
export function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Float em [min, max) */
export const between = (rng, min, max) => min + rng() * (max - min)
