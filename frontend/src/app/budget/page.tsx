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
        <h1 className={styles.title}>Portefeuille &amp; Budget</h1>
      </div>

      {/* Main Grid: Balance Box & Statistics */}
      <div className={styles.walletOverview}>
        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <div>
            <span className={styles.balanceLabel}>Solde Actuel</span>
            <div className={styles.balanceValue}>
              {loading ? "—" : `${solde.toLocaleString("fr-DZ")} DA`}
            </div>
          </div>
          <div className={styles.actionsGroup}>
            <button
              onClick={() => handleOpenModal("credit")}
              className={`${styles.actionBtn} ${styles.actionBtnCredit}`}
            >
              <ArrowUpRight size={16} /> Ajouter
            </button>
            <button
              onClick={() => handleOpenModal("debit")}
              className={`${styles.actionBtn} ${styles.actionBtnDebit}`}
            >
              <ArrowDownRight size={16} /> Retirer
            </button>
          </div>
        </div>

        {/* Stats summary card */}
        <div className={styles.statsCard}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Entrées Totales</span>
            <span className={styles.statValue} style={{ color: "#10b981" }}>
              +{totalRevenus.toLocaleString("fr-DZ")} DA
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Sorties Totales</span>
            <span className={styles.statValue} style={{ color: "#f43f5e" }}>
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
        <div className={styles.filtersBar}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher description, catégorie…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
            ))}
          </select>

          <div className={styles.dateRange}>
            <Calendar size={14} style={{ color: "#52525b", flexShrink: 0 }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.dateInput}
            />
            <span className={styles.dateSep}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          <button
            className={styles.resetBtn}
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("all")
              setDateFrom("")
              setDateTo("")
            }}
          >
            Réinitialiser
          </button>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Date</th>
                <th className={styles.tableHeaderCell}>Description</th>
                <th className={styles.tableHeaderCell}>Catégorie</th>
                <th className={styles.tableHeaderCell}>Avant</th>
                <th className={styles.tableHeaderCell}>Après</th>
                <th className={styles.tableHeaderCell} style={{ textAlign: "right" }}>Montant</th>
                <th className={styles.tableHeaderCell} style={{ width: "52px" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.tableCell} style={{ textAlign: "center", color: "#52525b" }}>
                    Chargement…
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableCell} style={{ textAlign: "center", color: "#52525b" }}>
                    {logs.length === 0 ? "Aucune transaction enregistrée." : "Aucun résultat pour ces filtres."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className={styles.tableRow}>
                    <td className={styles.tableCell} data-label="Date">
                      {new Date(log.createdAt).toLocaleDateString("fr-DZ")}
                    </td>
                    <td className={styles.tableCell} data-label="Description" style={{ fontWeight: 500 }}>
                      {log.description}
                    </td>
                    <td className={styles.tableCell} data-label="Catégorie">
                      <span className={`${styles.badge} ${log.type === "credit" ? styles.creditBadge : styles.debitBadge}`}>
                        {log.categorie.replace("_", " ")}
                      </span>
                    </td>
                    <td className={styles.tableCell} data-label="Avant" style={{ color: "#71717a" }}>
                      {parseFloat(log.solde_avant.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell} data-label="Après" style={{ color: "#71717a" }}>
                      {parseFloat(log.solde_apres.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell} data-label="Montant" style={{ textAlign: "right", fontWeight: 700, color: log.type === "credit" ? "#10b981" : "#f43f5e" }}>
                      {log.type === "credit" ? "+" : "−"}{parseFloat(log.montant.toString()).toLocaleString("fr-DZ")} DA
                    </td>
                    <td className={styles.tableCell}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLog(log.id)}
                        style={{ color: "#52525b" }}
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
