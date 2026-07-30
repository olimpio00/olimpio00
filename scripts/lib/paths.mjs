import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Raiz do repositório (scripts/lib/../..) */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const ASSETS = join(ROOT, 'assets')
export const DATA = join(ROOT, 'data')
export const CACHE = join(ROOT, '.cache')
