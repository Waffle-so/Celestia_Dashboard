// ── Cache mémoire RAM ultra-rapide pour Node.js ──
//
// Avantages :
// - Stockage direct en mémoire vive (RAM V8) : latence ~0-2ms
// - Zéro dépendance externe (utilise un Map JavaScript natif)
// - Gestion du TTL (durée de validité) automatique
// - Support des préfixes pour invalider des groupes de routes (ex: "articles")
// - Headers HTTP informatifs : X-Cache = HIT ou MISS
// - Log visuel dans la console pour suivre les requêtes

/**
 * @typedef {Object} CacheEntry
 * @property {*} data
 * @property {number} expiresAt
 * @property {string} prefix
 */

const store = new Map();
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures par défaut

/**
 * Récupère une valeur du cache
 */
function get(key) {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Enregistre une valeur dans le cache
 */
function set(key, data, ttlMs = DEFAULT_TTL_MS, prefix = "general") {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    prefix,
  });
}

/**
 * Invalide toutes les entrées associées à un ou plusieurs préfixes
 */
function invalidate(...prefixes) {
  if (prefixes.length === 0) return;

  let count = 0;
  for (const [key, entry] of store.entries()) {
    for (const prefix of prefixes) {
      if (entry.prefix === prefix || key.startsWith(`${prefix}:`)) {
        store.delete(key);
        count++;
        break;
      }
    }
  }

  console.log(`🧹 [Cache Backend] Invalidé (${prefixes.join(", ")}) — ${count} clé(s) purgée(s)`);
}

/**
 * Vide complètement le cache
 */
function clear() {
  const size = store.size;
  store.clear();
  console.log(`🧹 [Cache Backend] Vidé totalement (${size} clés supprimées)`);
}

/**
 * Statistiques sur le cache en RAM
 */
function stats() {
  let active = 0;
  let expired = 0;
  const now = Date.now();

  for (const entry of store.values()) {
    if (now > entry.expiresAt) expired++;
    else active++;
  }

  return {
    totalEntries: store.size,
    activeEntries: active,
    expiredEntries: expired,
  };
}

/**
 * Middleware Express pour mettre en cache les requêtes GET
 * @param {string} prefix - Préfixe de la ressource (ex: "articles", "dashboard")
 * @param {number} [ttlMs] - Durée de validité optionnelle en millisecondes
 */
function cacheMiddleware(prefix, ttlMs = DEFAULT_TTL_MS) {
  return (req, res, next) => {
    // Ne mettre en cache QUE les requêtes GET
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `${prefix}:${req.originalUrl || req.url}`;
    const cachedData = get(cacheKey);

    if (cachedData !== null) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-Key", cacheKey);
      return res.json(cachedData);
    }

    // Si pas en cache (MISS), intercepter res.json pour capturer la réponse
    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Cache-Key", cacheKey);

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Mettre en cache seulement si le statut est un succès (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && body !== undefined && body !== null) {
        set(cacheKey, body, ttlMs, prefix);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware Express pour invalider le cache après une mutation réussie (POST / PUT / DELETE)
 * @param {...string} prefixes - Liste des préfixes à invalider (ex: "articles", "dashboard")
 */
function invalidateMiddleware(...prefixes) {
  return (req, res, next) => {
    res.on("finish", () => {
      // N'invalider que si la requête s'est terminée avec succès (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidate(...prefixes);
      }
    });

    next();
  };
}

module.exports = {
  get,
  set,
  invalidate,
  clear,
  stats,
  cacheMiddleware,
  invalidateMiddleware,
};
