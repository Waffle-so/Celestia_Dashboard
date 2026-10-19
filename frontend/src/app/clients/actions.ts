export type Client = {
  id: number
  nom: string
  telephone?: string
  email?: string
  adresse?: string
  wilaya?: string
  notes?: string
}

export type ClientFormState = {
  nom: string
  telephone: string
  email: string
  adresse: string
  wilaya: string
  notes: string
}

import { getCache, setCache, invalidateCache } from "@/lib/cache"
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const emptyClientForm = (): ClientFormState => ({
  nom: "",
  telephone: "",
  email: "",
  adresse: "",
  wilaya: "",
  notes: "",
})

export const filterClients = (clients: Client[], searchQuery: string): Client[] => {
  const q = searchQuery.toLowerCase()
  return clients.filter((c) => {
    return (
      c.nom.toLowerCase().includes(q) ||
      (c.telephone && c.telephone.includes(q)) ||
      (c.wilaya && c.wilaya.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  })
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchClients = async (): Promise<Client[]> => {
  const cached = getCache<Client[]>("clients")
  if (cached) return cached
  const res = await fetch(`${API_BASE}/clients`)
  if (!res.ok) throw new Error("Erreur lors du chargement des clients.")
  const data = await res.json()
  const clients = Array.isArray(data) ? data : []
  setCache("clients", clients)
  return clients
}

export const saveClient = async (
  form: ClientFormState,
  editingId?: number | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload = {
      nom: form.nom.trim(),
      telephone: form.telephone || null,
      email: form.email || null,
      adresse: form.adresse || null,
      wilaya: form.wilaya || null,
      notes: form.notes || null,
    }

    const url = editingId ? `${API_BASE}/clients/${editingId}` : `${API_BASE}/clients`
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
    invalidateCache("clients")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const deleteClient = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/clients/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { success: false, error: err.message || "Erreur lors de la suppression." }
    }
    invalidateCache("clients")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}
