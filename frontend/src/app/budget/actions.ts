export type Log = {
  id: number
  type: "credit" | "debit"
  montant: number
  description: string
  solde_avant: number
  solde_apres: number
  categorie: string
  createdAt: string
}

export type Expense = {
  id: number
  categorie: string
  description: string
  montant: number
  date_depense: string
  notes?: string
}

export type TransactionPayload = {
  montant: number
  description: string
  categorie: string
  notes?: string
}

import { getCache, setCache, invalidateCache } from "@/lib/cache"
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// ── Helpers & Calculs ────────────────────────────────────────────────────────

export const calculateTotals = (logs: Log[]) => {
  const totalRevenus = logs
    .filter((l) => l.type === "credit")
    .reduce((acc, curr) => acc + parseFloat(curr.montant.toString()), 0)

  const totalDepenses = logs
    .filter((l) => l.type === "debit")
    .reduce((acc, curr) => acc + parseFloat(curr.montant.toString()), 0)

  return { totalRevenus, totalDepenses }
}

export const filterLogs = (
  logs: Log[],
  searchQuery: string,
  categoryFilter: string,
  dateFrom: string,
  dateTo: string
): Log[] => {
  const q = searchQuery.toLowerCase()
  return logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(q) ||
      log.categorie.toLowerCase().includes(q)

    const matchesCategory = categoryFilter === "all" || log.categorie === categoryFilter

    const logDate = new Date(log.createdAt)
    const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom)
    const matchesDateTo = !dateTo || logDate <= new Date(dateTo)

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo
  })
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const fetchBudgetData = async (): Promise<{
  solde: number
  logs: Log[]
  expenses: Expense[]
}> => {
  type BudgetCache = { solde: number; logs: Log[]; expenses: Expense[] }
  const cached = getCache<BudgetCache>("budget")
  if (cached) return cached

  const [resSolde, resLogs, resExpenses] = await Promise.all([
    fetch(`${API_BASE}/portefeuille`),
    fetch(`${API_BASE}/portefeuille/logs`),
    fetch(`${API_BASE}/budget`),
  ])

  if (!resSolde.ok || !resLogs.ok || !resExpenses.ok) {
    throw new Error("Erreur lors de la récupération des données de caisse / budget.")
  }

  const soldeData = await resSolde.json()
  const logsData = await resLogs.json()
  const expensesData = await resExpenses.json()

  const result: BudgetCache = {
    solde: parseFloat(soldeData?.solde ?? 0),
    logs: Array.isArray(logsData) ? logsData : [],
    expenses: Array.isArray(expensesData) ? expensesData : [],
  }
  setCache("budget", result)
  return result
}

export const executeTransaction = async (
  type: "credit" | "debit",
  payload: TransactionPayload
): Promise<{ success: boolean; error?: string }> => {
  try {
    const endpoint = `${API_BASE}/portefeuille/${type}`
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || "Une erreur est survenue côté serveur." }
    }
    invalidateCache("budget")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}

export const deleteLog = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/portefeuille/logs/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      return { success: false, error: "Erreur lors de la suppression du log." }
    }
    invalidateCache("budget")
    return { success: true }
  } catch {
    return { success: false, error: "Impossible de contacter le serveur." }
  }
}
