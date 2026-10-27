// ── Cache central — mémoire vive uniquement (se réinitialise au redémarrage) ──
//
// Clés utilisées :
//   "articles"          → Article[]
//   "clients"           → Client[]
//   "commandes"         → Commande[]        (fournisseurs)
//   "commandes-clients" → CommandeClient[]
//   "budget"            → { solde, logs, expenses }
//
// Invalidation immédiate à chaque mutation (POST / PUT / DELETE).

type CacheEntry<T> = { data: T; ts: number }

const store = new Map<string, CacheEntry<unknown>>()
const TTL_MS = 6 * 60 * 60 * 1000 // 6 heures — idéal pour un catalogue stable avec invalidation automatique sur modification

export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function invalidateCache(...keys: string[]): void {
  keys.forEach((k) => store.delete(k))
}
