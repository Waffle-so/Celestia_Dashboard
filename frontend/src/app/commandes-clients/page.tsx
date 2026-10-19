"use client"

import * as React from "react"
import { Search, Plus, Trash2, Calendar, CheckCircle2, AlertCircle, Edit2, X } from "lucide-react"
import styles from "../../Style/CommandesClients.module.css"
import { Button } from "@/components/ui/button"
import { AlertMessage } from "@/components/AlertMessage"
import { CommandeClientModal, DeleteCommandeClientModal } from "./modal"

import {
  type Client,
  type Article,
  type SelectedBijouItem,
  type CommandeClient,
  type CommandeClientFormState,
  CATEGORIES,
  emptyCommandeClientForm,
  getArticleStock,
  buildCartSync,
  filterCommandes,
  calculateCommandeStats,
  fetchCommandesClientsData,
  saveCommandeClient,
  updateCommandeStatus,
  deleteCommandeClient,
} from "./actions"

export default function CommandesClientsPage() {
  const [commandes, setCommandes] = React.useState<CommandeClient[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [articles, setArticles] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 12

  // Bijou multi-selector UI state
  const [bijouSearch, setBijouSearch] = React.useState("")
  const [bijouCategoryFilter, setBijouCategoryFilter] = React.useState("all")
  const [showBijouDropdown, setShowBijouDropdown] = React.useState(false)
  const [selectedBijoux, setSelectedBijoux] = React.useState<SelectedBijouItem[]>([])
  const bijouRef = React.useRef<HTMLDivElement>(null)

  // Modal create / edit
  const [isOpen, setIsOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CommandeClient | null>(null)
  const [form, setForm] = React.useState<CommandeClientFormState>(emptyCommandeClientForm())
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Page-level error
  const [pageError, setPageError] = React.useState<string | null>(null)

  const loadData = async () => {
    try {
      const data = await fetchCommandesClientsData()
      setCommandes(data.commandes)
      setClients(data.clients)
      setArticles(data.articles)
    } catch {
      setPageError("Impossible de charger les données. Vérifiez la connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  // Close bijou dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bijouRef.current && !bijouRef.current.contains(e.target as Node)) {
        setShowBijouDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  React.useEffect(() => {
    loadData()
  }, [])

  const resetBijoux = () => {
    setSelectedBijoux([])
    setBijouSearch("")
    setBijouCategoryFilter("all")
  }

  const syncFromCart = (cart: SelectedBijouItem[]) => {
    const synced = buildCartSync(cart)
    if (!synced) return
    setForm((f) => ({
      ...f,
      description: synced.description,
      prix_total: synced.prix_total ?? f.prix_total,
      quantite: synced.quantite,
    }))
  }

  const addBijou = (art: Article) => {
    const stock = getArticleStock(art)
    if (stock <= 0) {
      setModalError(`« ${art.nom} » n'est plus en stock.`)
      return
    }

    setSelectedBijoux((prev) => {
      const existing = prev.find((i) => i.article.id === art.id)
      if (existing && existing.qty >= stock) {
        setModalError(`Stock maximum atteint pour « ${art.nom} » (${stock} disponible(s)).`)
        return prev
      }
      const next = existing
        ? prev.map((i) => i.article.id === art.id ? { ...i, qty: Math.min(i.qty + 1, stock) } : i)
        : [...prev, { article: art, qty: 1 }]
      syncFromCart(next)
      return next
    })
    setShowBijouDropdown(false)
    setBijouSearch("")
  }

  const removeBijou = (id: number) => {
    setSelectedBijoux((prev) => {
      const next = prev.filter((i) => i.article.id !== id)
      syncFromCart(next)
      return next
    })
  }

  const updateBijouQty = (id: number, qty: number) => {
    if (qty < 1) return
    setSelectedBijoux((prev) => {
      const item = prev.find((i) => i.article.id === id)
      if (!item) return prev
      const stock = getArticleStock(item.article)
      const cappedQty = Math.min(qty, stock)
      if (qty > stock) {
        setModalError(`Stock insuffisant pour « ${item.article.nom} » : ${stock} disponible(s).`)
      }
      const next = prev.map((i) => i.article.id === id ? { ...i, qty: cappedQty } : i)
      syncFromCart(next)
      return next
    })
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCommandeClientForm())
    resetBijoux()
    setModalError(null)
    setIsOpen(true)
  }

  const openEdit = (cmd: CommandeClient) => {
    setEditing(cmd)
    setForm({
      client_id: cmd.client_id.toString(),
      description: cmd.description,
      quantite: cmd.quantite.toString(),
      prix_total: cmd.prix_total.toString(),
      avance: cmd.avance.toString(),
      statut: cmd.statut,
      date_livraison: cmd.date_livraison || "",
      notes: cmd.notes || "",
    })
    resetBijoux()
    setModalError(null)
    setIsOpen(true)
  }

  const filteredBijoux = articles.filter((a) => {
    const q = bijouSearch.toLowerCase()
    const matchesSearch =
      a.nom.toLowerCase().includes(q) ||
      (a.reference && a.reference.toLowerCase().includes(q)) ||
      (a.type_metal && a.type_metal.toLowerCase().includes(q)) ||
      (a.matiere && a.matiere.toLowerCase().includes(q)) ||
      (a.categorie && a.categorie.toLowerCase().includes(q))
    const matchesCategory = bijouCategoryFilter === "all" || a.categorie === bijouCategoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) { setModalError("Veuillez sélectionner un client."); return }
    if (!form.description.trim()) { setModalError("Veuillez saisir une description."); return }

    const result = await saveCommandeClient(form, selectedBijoux, editing?.id)
    if (result.success) {
      setIsOpen(false)
      await loadData()
    } else {
      setModalError(result.error || "Une erreur est survenue lors de l'enregistrement.")
    }
  }

  const handleQuickUpdateStatus = async (id: number, nextStatus: string) => {
    const result = await updateCommandeStatus(id, nextStatus)
    if (result.success) {
      await loadData()
    } else {
      setPageError(result.error || "Erreur lors de la mise à jour du statut.")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteCommandeClient(deleteId)
    if (result.success) {
      setDeleteId(null)
      await loadData()
    } else {
      setDeleteError(result.error || "Erreur lors de la suppression.")
    }
  }

  const setField = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const filtered = filterCommandes(commandes, searchQuery, statusFilter)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const { valueTotalSales, totalReste, activeCount } = calculateCommandeStats(commandes)
  const calculatedReste = Math.max(0, (parseFloat(form.prix_total) || 0) - (parseFloat(form.avance) || 0))


  return (
    <div className={styles.container}>
      {/* Page alert */}
      {pageError && <AlertMessage message={pageError} type="error" onClose={() => setPageError(null)} />}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Commandes Clients</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Suivi des créations et commandes personnalisées des clients
          </p>
        </div>
        <Button
          onClick={openCreate}
          style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white", gap: "0.5rem" }}
        >
          <Plus className="h-4 w-4" /> Nouvelle commande
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total commandes</span>
          <span className={styles.statValue}>{commandes.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>En cours / Prêtes</span>
          <span className={styles.statValue}>{activeCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ventes Actives (Total)</span>
          <span className={styles.statValue}>{valueTotalSales.toLocaleString("fr-DZ")} DA</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Reste à recouvrer</span>
          <span className={styles.statValue} style={{ color: totalReste > 0 ? "#ef4444" : undefined }}>
            {totalReste.toLocaleString("fr-DZ")} DA
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher par client, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="pret">Prête</option>
          <option value="livre">Livrée</option>
          <option value="annule">Annulée</option>
        </select>
      </div>

      {/* Grid of Order Cards */}
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>Aucune commande client trouvée.</p>
          </div>
        ) : (
          paginated.map((cmd) => {
            const clientInitial = cmd.Client?.nom ? cmd.Client.nom.charAt(0) : "C"
            return (
              <div key={cmd.id} className={styles.card} onClick={() => openEdit(cmd)}>
                {/* Card Header: Client Details */}
                <div className={styles.cardHeader}>
                  <div className={styles.clientAvatar}>{clientInitial}</div>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>{cmd.Client?.nom || "Client inconnu"}</span>
                    <span className={styles.clientPhone}>{cmd.Client?.telephone || "Pas de numéro"}</span>
                  </div>
                  <span className={`${styles.badge} ${cmd.statut === "en_cours"
                    ? styles.badgePending
                    : cmd.statut === "pret"
                      ? styles.badgeReady
                      : cmd.statut === "livre"
                        ? styles.badgeDelivered
                        : styles.badgeCancelled
                    }`}>
                    {cmd.statut === "en_cours" ? "En cours" : cmd.statut === "pret" ? "Prête" : cmd.statut === "livre" ? "Livrée" : "Annulée"}
                  </span>
                </div>

                {/* Card Body: Description and Notes */}
                <div className={styles.cardBody}>
                  <div className={styles.cardDesc}>
                    {cmd.description} <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(x{cmd.quantite})</span>
                  </div>
                  {cmd.notes && (
                    <div className={styles.cardNotes}>
                      "{cmd.notes}"
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className={styles.cardDates}>
                  <div className={styles.dateRow}>
                    <Calendar className="h-3 w-3" />
                    <span>Commande : {new Date(cmd.date_commande).toLocaleDateString("fr-DZ")}</span>
                  </div>
                  {cmd.date_livraison && (
                    <div className={styles.dateRow} style={{ color: cmd.statut === "en_cours" ? "#f59e0b" : undefined }}>
                      <AlertCircle className="h-3 w-3" />
                      <span>Livraison prévue : {new Date(cmd.date_livraison).toLocaleDateString("fr-DZ")}</span>
                    </div>
                  )}
                </div>

                {/* Finances row */}
                <div className={styles.financeRow}>
                  <div className={styles.financeCol}>
                    <span className={styles.financeLabel}>Total</span>
                    <span className={styles.financeVal}>{parseFloat(cmd.prix_total.toString()).toLocaleString("fr-DZ")}</span>
                  </div>
                  <div className={styles.financeCol}>
                    <span className={styles.financeLabel} style={{ color: "#10b981" }}>Avance</span>
                    <span className={styles.financeVal} style={{ color: "#10b981" }}>{parseFloat(cmd.avance.toString()).toLocaleString("fr-DZ")}</span>
                  </div>
                  <div className={styles.financeCol}>
                    <span className={styles.financeLabel} style={{ color: cmd.reste > 0 ? "#ef4444" : "#10b981" }}>Reste</span>
                    <span className={styles.financeVal} style={{ color: cmd.reste > 0 ? "#ef4444" : "#10b981" }}>
                      {cmd.reste > 0 ? parseFloat(cmd.reste.toString()).toLocaleString("fr-DZ") : "Réglé"}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {cmd.statut === "en_cours" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(cmd.id, "pret") }}
                        style={{ borderColor: "#3b82f6", color: "#3b82f6", height: "30px", fontSize: "0.75rem", borderRadius: "6px", gap: "0.25rem" }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Prête
                      </Button>
                    )}
                    {cmd.statut === "pret" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(cmd.id, "livre") }}
                        style={{ borderColor: "#10b981", color: "#10b981", height: "30px", fontSize: "0.75rem", borderRadius: "6px", gap: "0.25rem" }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Livrer
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(cmd.id) }}
                    style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
                  >
                    <Trash2 className="h-4 w-4 hover:scale-105 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d4d4d8",
              backgroundColor: currentPage === 1 ? "#f4f4f5" : "white",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              color: currentPage === 1 ? "#a1a1aa" : "#18181b",
            }}
          >
            Précédent
          </button>
          <span style={{ fontSize: "0.875rem", color: "#71717a" }}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d4d4d8",
              backgroundColor: currentPage === totalPages ? "#f4f4f5" : "white",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              color: currentPage === totalPages ? "#a1a1aa" : "#18181b",
            }}
          >
            Suivant
          </button>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      <CommandeClientModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editing={editing}
        form={form}
        setField={setField}
        clients={clients}
        modalError={modalError}
        setModalError={setModalError}
        onSubmit={handleSubmit}
        selectedBijoux={selectedBijoux}
        addBijou={addBijou}
        removeBijou={removeBijou}
        updateBijouQty={updateBijouQty}
        bijouSearch={bijouSearch}
        setBijouSearch={setBijouSearch}
        bijouCategoryFilter={bijouCategoryFilter}
        setBijouCategoryFilter={setBijouCategoryFilter}
        showBijouDropdown={showBijouDropdown}
        setShowBijouDropdown={setShowBijouDropdown}
        bijouRef={bijouRef}
        filteredBijoux={filteredBijoux}
        calculatedReste={calculatedReste}
      />

      {/* ── DELETE CONFIRM MODAL ── */}
      <DeleteCommandeClientModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onDelete={handleDelete}
        deleteError={deleteError}
        onErrorClose={() => setDeleteError(null)}
      />
    </div>
  )
}
