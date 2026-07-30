import { contributors, languages, repos, user } from './github.mjs'

const safe = async (fn, fallback) => {
  try {
    return (await fn()) ?? fallback
  } catch (err) {
    console.warn(`  ! ${err.message}`)
    return fallback
  }
}

/**
 * Consolida os números do perfil a partir da API.
 * Inclui `extraRepos` (repos de outras contas em que o usuário contribuiu),
 * que não aparecem em /users/:login/repos.
 */
export async function collect({ login, extraRepos = [], excludeRepos = [] }) {
  const profile = await user(login)
  // O repo de perfil (login/login) é infraestrutura do README, não portfólio.
  const skip = new Set([login.toLowerCase(), ...excludeRepos.map((r) => r.toLowerCase())])
  const own = (await repos(login)).filter((r) => !r.fork && !skip.has(r.name.toLowerCase()))

  const fullNames = [...own.map((r) => r.full_name), ...extraRepos]

  const langBytes = {}
  let commits = 0
  const perRepo = []

  for (const full of fullNames) {
    const langs = await safe(() => languages(full), {})
    for (const [name, bytes] of Object.entries(langs)) {
      langBytes[name] = (langBytes[name] ?? 0) + bytes
    }

    const people = await safe(() => contributors(full), [])
    const list = Array.isArray(people) ? people : []
    const mine = list.find((c) => c.login?.toLowerCase() === login.toLowerCase())
    const total = list.reduce((sum, c) => sum + (c.contributions ?? 0), 0)

    commits += mine?.contributions ?? 0
    perRepo.push({
      full,
      mine: mine?.contributions ?? 0,
      total,
      contributors: list.length,
      // A API já devolve contributors ordenados por contribuições (desc)
      topContributor: list[0]?.login ?? null,
      mineIsTop: list[0]?.login?.toLowerCase() === login.toLowerCase(),
      languages: langs,
    })
  }

  const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1
  const langs = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, bytes, pct: (bytes / totalBytes) * 100 }))

  const since = new Date(profile.created_at)
  const years = Math.max(1, Math.floor((Date.now() - since.getTime()) / 31_557_600_000))

  return {
    profile,
    repoCount: own.length,
    projectCount: fullNames.length,
    commits,
    langs,
    years,
    since: since.getFullYear(),
    stars: own.reduce((s, r) => s + r.stargazers_count, 0),
    perRepo,
  }
}

/** Repos onde o usuário é o maior contribuidor — usado no texto do README. */
export const shareOf = (stats, full) => stats.perRepo.find((r) => r.full === full)
