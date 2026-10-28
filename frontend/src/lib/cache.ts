// ── Cache central basé sur sessionStorage avec fallback mémoire ──
//
// Avantages sessionStorage pour le dashboard (3 associés) :
// - Survit au rafraîchissement (F5) : 0 requête vers Railway lors d'un F5.
// - Isolé par session : dès que l'onglet est fermé et rouvert, les données
//   se rafraîchissent pour éviter les conflits de données entre associés.
// - TTL configurable (par défaut 6 heures).
// - Invalidation instantanée sur chaque mutation (POST / PUT / DELETE).

type CacheEntry<T> = { data: T; ts: number }

const PREFIX = "celestia_cache_"
const memoryStore = new Map<string, CacheEntry<unknown>>()
const TTL_MS = 6 * 60 * 60 * 1000 // 6 heures

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const testKey = "__celestia_test__"
    window.sessionStorage.setItem(testKey, "1")
    window.sessionStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function getCache<T>(key: string): T | null {
  // 1. Essayer sessionStorage si disponible
  if (isStorageAvailable()) {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + key)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry<T>
      if (!entry || typeof entry.ts !== "number") {
        window.sessionStorage.removeItem(PREFIX + key)
        return null
      }
      if (Date.now() - entry.ts > TTL_MS) {
        window.sessionStorage.removeItem(PREFIX + key)
        return null
      }
      return entry.data
    } catch {
      window.sessionStorage.removeItem(PREFIX + key)
      return null
    }
  }

  // 2. Fallback mémoire vive (SSR ou sessionStorage inaccessible)
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) {
    memoryStore.delete(key)
    return null
  }
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, ts: Date.now() }

  // 1. Sauvegarder dans sessionStorage
  if (isStorageAvailable()) {
    try {
      window.sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
    } catch (e) {
      console.warn("sessionStorage quota ou écriture impossible, fallback mémoire:", e)
    }
  }

  // 2. Maintenir également en mémoire vive
  memoryStore.set(key, entry)
}

export function invalidateCache(...keys: string[]): void {
  keys.forEach((targetKey) => {
    // Nettoyage mémoire vive
    memoryStore.delete(targetKey)
    for (const k of Array.from(memoryStore.keys())) {
      if (k.startsWith(`${targetKey}:`)) {
        memoryStore.delete(k)
      }
    }

    // Nettoyage sessionStorage
    if (isStorageAvailable()) {
      try {
        const fullTarget = PREFIX + targetKey
        window.sessionStorage.removeItem(fullTarget)

        // Supprimer aussi les sous-clés (ex: "collections:active" ou "dashboard:day")
        const toRemove: string[] = []
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const sKey = window.sessionStorage.key(i)
          if (sKey && (sKey === fullTarget || sKey.startsWith(`${fullTarget}:`))) {
            toRemove.push(sKey)
          }
        }
        toRemove.forEach((k) => window.sessionStorage.removeItem(k))
      } catch {
        // Ignorer erreurs éventuelles
      }
    }
  })
}
