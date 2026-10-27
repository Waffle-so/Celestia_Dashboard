export type SelectedStone = {
  id: string
  label: string
  categorie: string
  carat?: number
}

export type Commande = {
  id: number
  type_commande: "produit_marque" | "personnalisee"
  description?: string
  quantite: number
  poids?: number
  prix_total: number
  statut: "en_attente" | "arrivee"
  date_commande: string
  date_achat?: string
  date_reception?: string
  notes?: string
  portefeuille_debit_log_id?: number
  stock_applique: boolean
  CommandeLignes?: CommandeLigne[]
}

export type CommandeLigne = {
  id: number
  commande_id: number
  article_id?: number
  article_cree_id?: number
  nom: string
  description?: string
  categorie: "bague" | "collier" | "bracelet" | "boucles_oreilles" | "pendentif" | "chevillere" | "autre"
  matiere: "argent" | "or_18k" | "or_blanc" | "or_nordique" | "acier_inoxydable" | "autre"
  matiere_detail?: string
  mchelel: "aucun" | "or_veritable" | "or_nordique" | "or_rose" | "autre"
  mchelel_detail?: string
  a_des_pierres?: boolean
  type_pierres?: SelectedStone[]
  pierres_detail?: string
  poids?: number
  quantite: number
  prix_achat_unitaire: number
  prix_vente: number
  prix_total: number
}

export type CommandeFormState = {
  type_commande: "produit_marque" | "personnalisee"
  description: string
  statut: "en_attente" | "arrivee"
  date_achat: string
  date_reception: string
  notes: string
}

export type LigneFormState = {
  article_id: string | number
  nom: string
  description: string
  categorie: CommandeLigne["categorie"]
  collection_id?: string | number
  matiere: CommandeLigne["matiere"]
  matiere_detail: string
  mchelel: CommandeLigne["mchelel"]
  mchelel_detail: string
  a_des_pierres: boolean
  type_pierres: SelectedStone[]
  pierres_detail: string
  poids: string
  quantite: string
  prix_achat_unitaire: string
  prix_vente: string
}

import { getCache, setCache, invalidateCache } from "@/lib/cache"
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const emptyCommandeForm = (): CommandeFormState => ({
  type_commande: "produit_marque",
  description: "",
  statut: "en_attente",
  date_achat: "",
  date_reception: "",
  notes: "",
})

export const emptyLigneForm = (): LigneFormState => ({
  article_id: "",
  nom: "",
  description: "",
  categorie: "autre",
  collection_id: "",
  matiere: "argent",
  matiere_detail: "",
  mchelel: "aucun",
  mchelel_detail: "",
  a_des_pierres: false,
  type_pierres: [],
  pierres_detail: "",
  poids: "",
  quantite: "1",
  prix_achat_unitaire: "0",
  prix_vente: "0",
})

export const filterCommandes = (
  commandes: Commande[],
  query: string,
  statusFilter: string,
  typeFilter: string
): Commande[] => {
  const q = query.toLowerCase()
  return commandes.filter((c) => {
    const matchesSearch = !q || (c.description && c.description.toLowerCase().includes(q))
    const matchesStatus = statusFilter === "all" || c.statut === statusFilter
    const matchesType = typeFilter === "all" || c.type_commande === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })
}

export const calculateFournisseurStats = (commandes: Commande[]) => {
  const enAttente = commandes.filter((c) => c.statut === "en_attente")
  const totalValeurAttente = enAttente.reduce((acc, c) => acc + parseFloat(c.prix_total.toString()), 0)
  const totalValeurRecus = commandes
    .filter((c) => c.statut === "arrivee")
    .reduce((acc, c) => acc + parseFloat(c.prix_total.toString()), 0)

  return { enAttenteCount: enAttente.length, totalValeurAttente, totalValeurRecus }
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchCommandes = async (): Promise<Commande[]> => {
  const cached = getCache<Commande[]>("commandes")
  if (cached) return cached
  const res = await fetch(`${API_BASE}/commandes`)
  if (!res.ok) throw new Error("Erreur lors du chargement des commandes.")
  const data = await res.json()
  const commandes = Array.isArray(data) ? data : []
  setCache("commandes", commandes)
  return commandes
}

export const fetchArticlesForFournisseur = async (): Promise<any[]> => {
  const cached = getCache<any[]>("articles")
  if (cached) return cached
  try {
    const res = await fetch(`${API_BASE}/articles`)
    if (res.ok) {
      const data = await res.json()
      const articles = data.articles || []
      setCache("articles", articles)
      return articles
    }
  } catch {
    console.error("Erreur lors du chargement des articles")
  }
  return []
}

export const fetchLignesForCommande = async (commandeId: number): Promise<CommandeLigne[]> => {
  const res = await fetch(`${API_BASE}/commandes/${commandeId}/lignes`)
  if (!res.ok) {
    throw new Error("Erreur lors du chargement des lignes.")
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export const saveCommande = async (
  form: CommandeFormState,
  editingId?: number | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      type_commande: form.type_commande,
      description: form.description || null,
      poids: null,
      prix_total: 0,
      quantite: 0,
      statut: form.statut,
      date_achat: form.date_achat || null,
      date_reception: form.date_reception || null,
      notes: form.notes || null,
    }

    const url = editingId ? `${API_BASE}/commandes/${editingId}` : `${API_BASE}/commandes`
    const method = editingId ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Une erreur est survenue." }
    }
    invalidateCache("commandes")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const addLigneCommande = async (
  commandeId: number,
  form: LigneFormState
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      commande_id: commandeId,
      article_id: form.article_id ? parseInt(form.article_id.toString()) : null,
      nom: form.nom,
      description: form.description || null,
      categorie: form.categorie,
      collection_id: form.collection_id ? parseInt(form.collection_id.toString()) : null,
      matiere: form.matiere,
      matiere_detail: form.matiere_detail || null,
      mchelel: form.mchelel,
      mchelel_detail: form.mchelel_detail || null,
      a_des_pierres: form.a_des_pierres,
      type_pierres: form.a_des_pierres ? form.type_pierres : [],
      pierres_detail: form.pierres_detail || null,
      poids: form.poids ? parseFloat(form.poids) : null,
      quantite: parseInt(form.quantite) || 1,
      prix_achat_unitaire: parseFloat(form.prix_achat_unitaire) || 0,
      prix_vente: parseFloat(form.prix_vente) || 0,
    }

    const res = await fetch(`${API_BASE}/commandes-lignes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de l'ajout de la ligne." }
    }
    invalidateCache("commandes", "articles")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const deleteLigneCommande = async (ligneId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/commandes-lignes/${ligneId}`, { method: "DELETE" })
    if (!res.ok) {
      return { success: false, error: "Erreur lors de la suppression de la ligne." }
    }
    invalidateCache("commandes")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const markCommandeReceived = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/commandes/${id}/arrivee`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_reception: new Date().toISOString().split("T")[0],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la mise à jour du statut." }
    }
    invalidateCache("commandes", "articles", "budget")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const deleteCommande = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/commandes/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la suppression." }
    }
    invalidateCache("commandes")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}
