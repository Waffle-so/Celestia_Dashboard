"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight, Trash2, Search, Calendar } from "lucide-react"
import styles from "../../Style/Budget.module.css"

import { Button } from "@/components/ui/button"
import { TransactionModal } from "./modal"

import {
  type Log,
  type Expense,
  calculateTotals,
  filterLogs,
  fetchBudgetData,
  executeTransaction,
  deleteLog,
} from "./actions"

export default function BudgetPage() {
  const [solde, setSolde] = React.useState<number>(0)
  const [logs, setLogs] = React.useState<Log[]>([])
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  // Modals state
  const [isOpen, setIsOpen] = React.useState(false)
  const [operationType, setOperationType] = React.useState<"credit" | "debit">("credit")
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Form state
  const [montant, setMontant] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [categorie, setCategorie] = React.useState("vente")
  const [notes, setNotes] = React.useState("")

  const loadData = async () => {
    try {
      const data = await fetchBudgetData()
      setSolde(data.solde)
      setLogs(data.logs)
      setExpenses(data.expenses)
    } catch (error) {
      console.error("Failed to load budget/wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = (type: "credit" | "debit") => {
    setOperationType(type)
    setCategorie(type === "credit" ? "vente" : "achat")
    setMontant("")
    setDescription("")
    setNotes("")
    setModalError(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!montant || parseFloat(montant) <= 0) {
      setModalError("Le montant doit être supérieur à zéro.")
      return
    }

    const result = await executeTransaction(operationType, {
      montant: parseFloat(montant),
      description,
      categorie,
      notes,
    })

    if (result.success) {
      setIsOpen(false)
      await loadData()
    } else {
      setModalError(result.error || "Une erreur est survenue.")
    }
  }

  const handleDeleteLog = async (id: number) => {
    if (!confirm("Voulez-vous vraiment annuler cette opération ? Cela restaurera le solde précédent.")) return

    const result = await deleteLog(id)
    if (result.success) {
      await loadData()
    } else {
      alert(result.error || "Erreur lors de la suppression.")
    }
  }

  const { totalRevenus, totalDepenses } = calculateTotals(logs)
  const filteredLogs = filterLogs(logs, searchQuery, categoryFilter, dateFrom, dateTo)
  const categories = Array.from(new Set(logs.map((l) => l.categorie)))


  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Portefeuille & Budget</h1>
      </div>

      {/* Main Grid: Balance Box & Statistics */}
      <div className={styles.walletOverview}>
        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <div>
            <span className={styles.balanceLabel}>Solde Actuel</span>
            <div className={styles.balanceValue}>
              {loading ? "_" : `${solde.toLocaleString("fr-DZ")} DA`}
            </div>
          </div>
          <div className={styles.actionsGroup}>
            <Button 
              onClick={() => handleOpenModal("credit")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 border-none"
            >
              <ArrowUpRight className="h-4 w-4" /> Ajouter de l&apos;argent
            </Button>
            <Button 
              onClick={() => handleOpenModal("debit")}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 border-none"
            >
              <ArrowDownRight className="h-4 w-4" /> Retirer de l&apos;argent
            </Button>
          </div>
        </div>

        {/* Small stats summary card */}
        <div className={styles.statsCard}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Entrées Totales</span>
            <span className={styles.statValue} style={{ color: "#10b981", fontWeight: 600 }}>
              +{totalRevenus.toLocaleString("fr-DZ")} DA
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Sorties Totales</span>
            <span className={styles.statValue} style={{ color: "#ef4444", fontWeight: 600 }}>
              -{totalDepenses.toLocaleString("fr-DZ")} DA
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Mouvements</span>
            <span className={styles.statValue}>{logs.length} logs</span>
          </div>
        </div>
      </div>

      {/* Table section: Cash logs */}
      <div className={styles.tableSection}>
        <h2 className={styles.tableTitle}>Mouvements de Caisse récents</h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#71717a" }} />
            <input
              type="text"
              placeholder="Rechercher par description ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.875rem 0.5rem 2.5rem",
                borderRadius: "8px",
                border: "1px solid #27272a",
                backgroundColor: "#18181b",
                color: "#e4e4e7",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "8px",
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              color: "#e4e4e7",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar style={{ width: "1rem", height: "1rem", color: "#71717a" }} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid #27272a",
                  backgroundColor: "#18181b",
                  color: "#e4e4e7",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <span style={{ color: "#71717a" }}>à</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar style={{ width: "1rem", height: "1rem", color: "#71717a" }} />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid #27272a",
                  backgroundColor: "#18181b",
                  color: "#e4e4e7",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("all")
              setDateFrom("")
              setDateTo("")
            }}
            style={{ fontSize: "0.875rem" }}
          >
            Réinitialiser
          </Button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Date</th>
                <th className={styles.tableHeaderCell}>Description</th>
                <th className={styles.tableHeaderCell}>Catégorie</th>
                <th className={styles.tableHeaderCell}>Solde Avant</th>
                <th className={styles.tableHeaderCell}>Solde Après</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: "right" }}>Montant</th>
                <th className={styles.tableHeaderCell} style={{ width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.tableCell} style={{ textAlign: "center" }}>
                    Chargement...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableCell} style={{ textAlign: "center" }}>
                    {logs.length === 0 ? "Aucune transaction enregistrée." : "Aucun résultat correspondant aux filtres."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      {new Date(log.createdAt).toLocaleDateString("fr-DZ")}
                    </td>
                    <td className={styles.tableCell} style={{ fontWeight: 500 }}>
                      {log.description}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.badge} ${log.type === "credit" ? styles.creditBadge : styles.debitBadge}`}>
                        {log.categorie.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.tableCell} style={{ color: "#71717a" }}>
                      {parseFloat(log.solde_avant.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell} style={{ color: "#71717a" }}>
                      {parseFloat(log.solde_apres.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell} style={{ textAlign: "right", fontWeight: 600, color: log.type === "credit" ? "#10b981" : "#ef4444" }}>
                      {log.type === "credit" ? "+" : "-"}{parseFloat(log.montant.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteLog(log.id)}
                        style={{ color: "#71717a" }}
                      >
                        <Trash2 className="h-4 w-4 hover:text-red-500 transition-colors" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        operationType={operationType}
        modalError={modalError}
        setModalError={setModalError}
        montant={montant}
        setMontant={setMontant}
        description={description}
        setDescription={setDescription}
        categorie={categorie}
        setCategorie={setCategorie}
        notes={notes}
        setNotes={setNotes}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
