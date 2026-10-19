import { getCache, setCache, invalidateCache } from "@/lib/cache"

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// ── Types ──────────────────────────────────────────────────────────────────────

export type DashboardData = {
  portefeuille: { solde_actuel: number }
  commandes_fournisseur: { total: number; en_attente: number; recues: number; montant_total: number }
  commandes_clients: { total: number; en_cours: number; pret: number; livrees: number; reste_a_encaisser: number; total_encaisse: number }
  articles: { total: number; unites_en_stock: number; valeur_stock: number; total_prix_achat: number; alertes_stock_faible: number }
  clients: { total: number }
  budget: { total_depenses: number; par_categorie: { categorie: string; total: number }[] }
  marge_beneficiaire: number
  argent_total_possede: number
  roi_global: number
  total_investi_fournisseurs: number
  derniers_logs: { id: number; type: "credit" | "debit"; montant: number; description: string; createdAt: string }[]
  dernieres_commandes_clients: { id: number; description: string; prix_total: number; statut: string; Client?: { nom: string } }[]
}

export const defaultData: DashboardData = {
  portefeuille: { solde_actuel: 0 },
  commandes_fournisseur: { total: 0, en_attente: 0, recues: 0, montant_total: 0 },
  commandes_clients: { total: 0, en_cours: 0, pret: 0, livrees: 0, reste_a_encaisser: 0, total_encaisse: 0 },
  articles: { total: 0, unites_en_stock: 0, valeur_stock: 0, total_prix_achat: 0, alertes_stock_faible: 0 },
  clients: { total: 0 },
  budget: { total_depenses: 0, par_categorie: [] },
  marge_beneficiaire: 0,
  argent_total_possede: 0,
  roi_global: 0,
  total_investi_fournisseurs: 0,
  derniers_logs: [],
  dernieres_commandes_clients: [],
}

// ── Clé de cache basée sur les filtres de période ─────────────────────────────

const dashboardCacheKey = (period: string, dateFrom?: string, dateTo?: string) =>
  `dashboard:${period}${dateFrom ? `:${dateFrom}` : ""}${dateTo ? `:${dateTo}` : ""}`

// ── API Fetch ─────────────────────────────────────────────────────────────────

export const fetchDashboardData = async (
  margePeriod: string,
  margeDateFrom?: string,
  margeDateTo?: string
): Promise<DashboardData> => {
  const cacheKey = dashboardCacheKey(margePeriod, margeDateFrom, margeDateTo)
  const cached = getCache<DashboardData>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams()
  if (margePeriod !== "all") params.append("period", margePeriod)
  if (margePeriod === "custom" && margeDateFrom && margeDateTo) {
    params.append("dateFrom", margeDateFrom)
    params.append("dateTo", margeDateTo)
  }

  const url = `${API_BASE}/dashboard${params.toString() ? `?${params.toString()}` : ""}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erreur lors du chargement du dashboard.")
  const json = await res.json()

  const data: DashboardData = {
    portefeuille: { solde_actuel: json?.portefeuille?.solde_actuel ?? 0 },
    commandes_fournisseur: {
      total: json?.commandes_fournisseur?.total ?? 0,
      en_attente: json?.commandes_fournisseur?.en_attente ?? 0,
      recues: json?.commandes_fournisseur?.recues ?? 0,
      montant_total: json?.commandes_fournisseur?.montant_total ?? 0,
    },
    commandes_clients: {
      total: json?.commandes_clients?.total ?? 0,
      en_cours: json?.commandes_clients?.en_cours ?? 0,
      pret: json?.commandes_clients?.pret ?? 0,
      livrees: json?.commandes_clients?.livrees ?? 0,
      reste_a_encaisser: json?.commandes_clients?.reste_a_encaisser ?? 0,
      total_encaisse: json?.commandes_clients?.total_encaisse ?? 0,
    },
    articles: {
      total: json?.articles?.total ?? 0,
      unites_en_stock: json?.articles?.unites_en_stock ?? 0,
      valeur_stock: json?.articles?.valeur_stock ?? 0,
      total_prix_achat: json?.articles?.total_prix_achat ?? 0,
      alertes_stock_faible: json?.articles?.alertes_stock_faible ?? 0,
    },
    clients: { total: json?.clients?.total ?? 0 },
    budget: {
      total_depenses: json?.budget?.total_depenses ?? 0,
      par_categorie: json?.budget?.par_categorie ?? [],
    },
    marge_beneficiaire: json?.marge_beneficiaire ?? 0,
    argent_total_possede: json?.argent_total_possede ?? 0,
    roi_global: json?.roi_global ?? 0,
    total_investi_fournisseurs: json?.total_investi_fournisseurs ?? 0,
    derniers_logs: json?.derniers_logs ?? [],
    dernieres_commandes_clients: json?.dernieres_commandes_clients ?? [],
  }

  setCache(cacheKey, data)
  return data
}

export const fetchProfitsData = async (selectedPeriod: string): Promise<any[]> => {
  const cacheKey = `profits:${selectedPeriod}`
  const cached = getCache<any[]>(cacheKey)
  if (cached) return cached

  const url =
    selectedPeriod === "all"
      ? `${API_BASE}/dashboard/profits-by-date?days=all`
      : `${API_BASE}/dashboard/profits-by-date?days=${selectedPeriod}`

  const res = await fetch(url)
  if (!res.ok) throw new Error("Erreur lors du chargement des profits.")
  const data = await res.json()
  setCache(cacheKey, data)
  return data
}

// Invalide tout le cache dashboard (après mutations qui impactent les totaux)
export const invalidateDashboardCache = () => {
  // On invalide toutes les clés potentielles du dashboard
  for (const period of ["all", "today", "week", "month", "custom"]) {
    invalidateCache(`dashboard:${period}`)
  }
  for (const days of ["30", "90", "180", "365", "1095", "all"]) {
    invalidateCache(`profits:${days}`)
  }
}
