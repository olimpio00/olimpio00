import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CACHE } from './paths.mjs'

const API = 'https://api.github.com'
const TTL = 30 * 60 * 1000 // 30 min — evita estourar o rate limit ao iterar localmente

const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': 'olimpio00-profile-generator',
  // Sem token: 60 req/h. No GitHub Actions o GITHUB_TOKEN entra automaticamente (5000 req/h).
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
}

const cacheFile = (path) => join(CACHE, path.replace(/[^a-z0-9]+/gi, '_') + '.json')

/**
 * GET na API do GitHub, com cache em disco.
 * @param {string} path caminho iniciando com "/" (ex: "/users/olimpio00")
 */
export async function gh(path) {
  const file = cacheFile(path)

  if (!process.env.NO_CACHE) {
    try {
      const hit = JSON.parse(await readFile(file, 'utf8'))
      if (Date.now() - hit.at < TTL) return hit.body
    } catch {
      // cache ausente ou corrompido — segue para a rede
    }
  }

  const res = await fetch(API + path, { headers })
  if (!res.ok) {
    const limit = res.headers.get('x-ratelimit-remaining')
    throw new Error(
      `GitHub ${res.status} ${res.statusText} em ${path}` +
        (limit === '0' ? ' — rate limit esgotado, defina GITHUB_TOKEN' : '')
    )
  }

  // 204 acontece em repo vazio (ex: /contributors sem commits indexados)
  const body = res.status === 204 ? null : await res.json()
  await mkdir(CACHE, { recursive: true })
  await writeFile(file, JSON.stringify({ at: Date.now(), body }))
  return body
}

export const user = (login) => gh(`/users/${login}`)
export const repos = (login) => gh(`/users/${login}/repos?per_page=100&sort=pushed`)
export const languages = (full) => gh(`/repos/${full}/languages`)
export const contributors = (full) => gh(`/repos/${full}/contributors?per_page=100`)
