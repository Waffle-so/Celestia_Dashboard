export type Client = {
  id: number
  nom: string
  telephone: string
}

export type Article = {
  id: number
  nom: string
  reference?: string
  type_metal?: string
  matiere?: string
  prix_vente?: number
  categorie?: string
  stock?: number
}

export type SelectedBijouItem = {
  article: Article
  qty: number
}

export type CommandeClient = {
  id: number
  client_id: number
  description: string
  quantite: number
  prix_total: number
  prix_vente_articles: number
  prix_total_achat: number
  avance: number
  reste: number
  statut: "en_cours" | "pret" | "livre" | "annule"
  date_commande: string
  date_livraison?: string
  notes?: string
  Client?: Client
}

export type CommandeClientFormState = {
  client_id: string
  description: string
  quantite: string
  prix_total: string
  avance: string
  statut: "en_cours" | "pret" | "livre" | "annule"
  date_livraison: string
  notes: string
}

export const CATEGORIES = ["bague", "collier", "bracelet", "boucles_oreilles", "pendentif", "chevillere", "autre"]

import { getCache, setCache, invalidateCache } from "@/lib/cache"
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const emptyCommandeClientForm = (): CommandeClientFormState => ({
  client_id: "",
  description: "",
  quantite: "1",
  prix_total: "0",
  avance: "0",
  statut: "en_cours",
  date_livraison: "",
  notes: "",
})

export const getArticleStock = (art: Article) => Math.max(0, art.stock ?? 0)

export const buildCartSync = (cart: SelectedBijouItem[]) => {
  if (cart.length === 0) return null
  const desc = cart
    .map((item) => {
      const parts = [item.article.nom]
      if (item.article.reference) parts.push(`Réf: ${item.article.reference}`)
      if (item.article.type_metal) parts.push(item.article.type_metal)
      return `${parts.join(" - ")} (x${item.qty})`
    })
    .join(" | ")
  const total = cart.reduce((acc, item) => acc + (item.article.prix_vente || 0) * item.qty, 0)
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0)

  return {
    description: desc,
    prix_total: total > 0 ? total.toString() : null,
    quantite: totalQty.toString(),
  }
}

export const filterCommandes = (commandes: CommandeClient[], query: string, status: string): CommandeClient[] => {
  const q = query.toLowerCase()
  return commandes.filter((c) => {
    const matchesSearch =
      (c.Client?.nom && c.Client.nom.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))

    const matchesStatus = status === "all" || c.statut === status
    return matchesSearch && matchesStatus
  })
}

export const calculateCommandeStats = (commandes: CommandeClient[]) => {
  const activeOrders = commandes.filter((c) => c.statut === "en_cours" || c.statut === "pret")
  const valueTotalSales = activeOrders.reduce((acc, c) => acc + parseFloat(c.prix_total.toString()), 0)
  const totalReste = activeOrders.reduce((acc, c) => acc + parseFloat(c.reste.toString()), 0)
  return { valueTotalSales, totalReste, activeCount: activeOrders.length }
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchCommandesClientsData = async (): Promise<{
  commandes: CommandeClient[]
  clients: Client[]
  articles: Article[]
}> => {
  type CCCache = { commandes: CommandeClient[]; clients: Client[]; articles: Article[] }
  const cached = getCache<CCCache>("commandes-clients")
  if (cached) return cached

  const [resCmd, resCli, resArt] = await Promise.all([
    fetch(`${API_BASE}/commandes-clients`),
    fetch(`${API_BASE}/clients`),
    fetch(`${API_BASE}/articles`),
  ])

  if (!resCmd.ok || !resCli.ok) {
    throw new Error("Erreur lors du chargement des données des commandes.")
  }

  const cmdData = await resCmd.json()
  const cliData = await resCli.json()
  const artData = resArt.ok ? await resArt.json() : { articles: [] }

  const result: CCCache = {
    commandes: Array.isArray(cmdData) ? cmdData : [],
    clients: Array.isArray(cliData) ? cliData : [],
    articles: Array.isArray(artData.articles) ? artData.articles : [],
  }
  setCache("commandes-clients", result)
  return result
}

export const saveCommandeClient = async (
  form: CommandeClientFormState,
  selectedBijoux: SelectedBijouItem[],
  editingId?: number | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    for (const item of selectedBijoux) {
      const stock = getArticleStock(item.article)
      if (item.qty > stock) {
        return {
          success: false,
          error: `Stock insuffisant pour « ${item.article.nom} » : ${stock} disponible(s), ${item.qty} demandé(s).`,
        }
      }
    }

    const payload = {
      client_id: parseInt(form.client_id),
      description: form.description.trim(),
      quantite: parseInt(form.quantite) || 1,
      prix_total: parseFloat(form.prix_total) || 0,
      avance: parseFloat(form.avance) || 0,
      statut: form.statut,
      date_livraison: form.date_livraison || null,
      notes: form.notes || null,
      articles: !editingId ? selectedBijoux.map((item) => ({ id: item.article.id, qty: item.qty })) : [],
    }

    const url = editingId ? `${API_BASE}/commandes-clients/${editingId}` : `${API_BASE}/commandes-clients`
    const method = editingId ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Une erreur est survenue lors de l'enregistrement." }
    }
    invalidateCache("commandes-clients", "articles")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const updateCommandeStatus = async (
  id: number,
  nextStatus: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/commandes-clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nextStatus }),
    })

    if (!res.ok) {
      return { success: false, error: "Erreur lors de la mise à jour du statut." }
    }
    invalidateCache("commandes-clients")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur pour la mise à jour." }
  }
}

export const deleteCommandeClient = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/commandes-clients/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la suppression." }
    }
    invalidateCache("commandes-clients")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}
