export type SelectedStone = {
  id: string
  label: string
  categorie: string
  carat?: number
}

export type Collection = {
  id: number
  nom: string
  slug?: string
  description?: string
  image?: string
  is_active: boolean
  ordre: number
  nombre_articles?: number
}

export type Article = {
  id: number
  nom: string
  description?: string
  image?: string
  images?: string[]
  collection_id?: number | null
  collection?: { id: number; nom: string; slug?: string }
  categorie: string
  matiere: string
  matiere_detail?: string
  mchelel: string
  mchelel_detail?: string
  a_des_pierres: boolean
  type_pierres?: SelectedStone[]
  pierres_detail?: string
  poids?: number
  prix_achat?: number
  prix_vente: number
  en_promo?: boolean
  prix_promo?: number | null
  stock: number
  ventes_total?: number
}

export type ArticleFormState = {
  nom: string
  description: string
  image: string
  images: string[]
  collection_id: string
  categorie: string
  matiere: string
  matiere_detail: string
  mchelel: string
  mchelel_detail: string
  a_des_pierres: boolean
  type_pierres: SelectedStone[]
  pierres_detail: string
  poids: string
  prix_achat: string
  prix_vente: string
  en_promo: boolean
  prix_promo: string
  stock: string
}

export const CATEGORIES = ["bague", "collier", "bracelet", "boucles_oreilles", "pendentif", "chevillere", "autre"]
export const MATIERES = ["argent", "or_18k", "or_blanc", "or_nordique", "acier_inoxydable", "autre"]
export const MCHEELS = ["aucun", "or_veritable", "or_nordique", "or_rose", "autre"]

export const CATEGORY_EMOJI: Record<string, string> = {
  bague: "💍", collier: "📿", bracelet: "✨", boucles_oreilles: "🔮",
  pendentif: "🪬", chevillere: "🌸", autre: "💎",
}

import { getCache, setCache, invalidateCache } from "@/lib/cache"
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const emptyForm = (): ArticleFormState => ({
  nom: "",
  description: "",
  image: "",
  images: [],
  collection_id: "",
  categorie: "bague",
  matiere: "argent",
  matiere_detail: "",
  mchelel: "aucun",
  mchelel_detail: "",
  a_des_pierres: false,
  type_pierres: [],
  pierres_detail: "",
  poids: "",
  prix_achat: "",
  prix_vente: "",
  en_promo: false,
  prix_promo: "",
  stock: "0",
})

export const FALLBACK_IMAGE = "/uploads/rieen.jfif"

export const getImageUrl = (imagePath?: string | null, images?: string[] | null): string => {
  // 1. Si on a des images dans le tableau Supabase Storage, prendre la première
  if (images && images.length > 0 && images[0]?.trim()) {
    const first = images[0].trim()
    if (first.startsWith("http://") || first.startsWith("https://")) return first
  }
  // 2. Sinon si une image simple est fournie
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")
  if (!imagePath || !imagePath.trim()) {
    return `${baseUrl}${FALLBACK_IMAGE}`
  }
  const trimmed = imagePath.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`
}

export const parseArticleStones = (raw: any): SelectedStone[] => {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((p: any) => {
      if (typeof p === "string") return { id: p, label: p, categorie: "Pierre ordinaire" }
      return p as SelectedStone
    })
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => typeof p === "string" ? { id: p, label: p, categorie: "Pierre ordinaire" } : p)
      }
    } catch {
      return raw.split(",").map((s: string) => s.trim()).filter(Boolean).map((s: string) => ({ id: s, label: s, categorie: "Pierre ordinaire" }))
    }
  }
  return []
}

export const filterArticles = (articles: Article[], query: string, category: string): Article[] => {
  const q = query.toLowerCase()
  return articles.filter((a) => {
    const matchesQuery = a.nom.toLowerCase().includes(q) || a.categorie.includes(q)
    const matchesCat = category === "all" || a.categorie === category
    return matchesQuery && matchesCat
  })
}

export const calculateArticleStats = (articles: Article[]) => {
  const totalStock = articles.reduce((acc, a) => acc + (a.stock || 0), 0)
  const valeurStockAchat = articles.reduce(
    (acc, a) => acc + (parseFloat(a.prix_achat?.toString() || "0") * (a.stock || 0)),
    0
  )
  const valeurStockVente = articles.reduce(
    (acc, a) => acc + (parseFloat(a.prix_vente?.toString() || "0") * (a.stock || 0)),
    0
  )
  const lowStock = articles.filter((a) => (a.stock || 0) <= 3).length

  return { totalStock, valeurStockAchat, valeurStockVente, lowStock }
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchArticles = async (): Promise<Article[]> => {
  const cached = getCache<Article[]>("articles")
  if (cached) return cached
  const res = await fetch(`${API_BASE}/articles`)
  if (!res.ok) throw new Error("Impossible de charger les articles.")
  const data = await res.json()
  const articles = Array.isArray(data.articles) ? data.articles : []
  setCache("articles", articles)
  return articles
}

export const saveArticle = async (
  form: ArticleFormState,
  editingId?: number | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const finalImagePath = form.image.trim() || null
    // Nettoyer les images et garder max 5
    const cleanImages = (form.images || []).map((img) => img.trim()).filter(Boolean).slice(0, 5)

    const payload = {
      nom: form.nom.trim(),
      description: form.description || null,
      image: finalImagePath || (cleanImages.length > 0 ? cleanImages[0] : null),
      images: cleanImages,
      collection_id: form.collection_id ? parseInt(form.collection_id, 10) : null,
      categorie: form.categorie,
      matiere: form.matiere,
      matiere_detail: form.matiere_detail || null,
      mchelel: form.mchelel,
      mchelel_detail: form.mchelel_detail || null,
      a_des_pierres: form.a_des_pierres,
      type_pierres: form.a_des_pierres ? form.type_pierres : [],
      pierres_detail: form.pierres_detail || null,
      poids: form.poids ? parseFloat(form.poids) : null,
      prix_achat: form.prix_achat ? parseFloat(form.prix_achat) : 0,
      prix_vente: parseFloat(form.prix_vente),
      en_promo: form.en_promo || false,
      prix_promo: form.en_promo && form.prix_promo ? parseFloat(form.prix_promo) : null,
      stock: parseInt(form.stock) || 0,
    }

    const url = editingId ? `${API_BASE}/articles/${editingId}` : `${API_BASE}/articles`
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

    invalidateCache("articles", "collections")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Impossible de contacter le serveur." }
  }
}

export const deleteArticle = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la suppression." }
    }
    invalidateCache("articles", "collections")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

// ── Image Upload & Suppression Supabase Storage ─────────────────────────────

export const uploadArticleImage = async (base64: string, fileName?: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/articles/upload-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, fileName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Échec de l'upload de l'image vers Supabase Storage.")
  }
  const data = await res.json()
  return data.url
}

export const deleteStorageImage = async (url: string): Promise<boolean> => {
  try {
    if (!url || !url.includes("supabase.co")) return true
    const res = await fetch(`${API_BASE}/articles/delete-storage-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    return res.ok
  } catch (err) {
    console.warn("Échec de la suppression de l'image sur Supabase Storage:", err)
    return false
  }
}

// ── Gestion des Collections ───────────────────────────────────────────────────

export const fetchCollections = async (activeOnly = false): Promise<Collection[]> => {
  try {
    const res = await fetch(`${API_BASE}/collections${activeOnly ? "?active_only=true" : ""}`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export const createCollection = async (
  data: Partial<Collection>
): Promise<{ success: boolean; collection?: Collection; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la création de la collection." }
    }
    const created = await res.json()
    invalidateCache("collections", "articles")
    return { success: true, collection: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Impossible de contacter le serveur." }
  }
}

export const deleteCollection = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/collections/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la suppression de la collection." }
    }
    invalidateCache("collections", "articles")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

