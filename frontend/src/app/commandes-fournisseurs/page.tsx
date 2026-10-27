"use client"

import * as React from "react"
import { Search, Plus, Trash2, Calendar, CheckCircle2, ShoppingBag } from "lucide-react"
import styles from "../../Style/Fournisseurs.module.css"
import { Button } from "@/components/ui/button"
import { AlertMessage } from "@/components/AlertMessage"
import { CommandeModal, DeleteCommandeModal, LignesCommandeModal } from "./modal"

import {
  type Commande,
  type CommandeLigne,
  type CommandeFormState,
  type LigneFormState,
  emptyCommandeForm,
  emptyLigneForm,
  filterCommandes,
  calculateFournisseurStats,
  fetchCommandes,
  fetchArticlesForFournisseur,
  fetchLignesForCommande,
  saveCommande,
  addLigneCommande,
  deleteLigneCommande,
  markCommandeReceived,
  deleteCommande,
} from "./actions"
import { fetchCollections } from "../articles/actions"

export default function CommandesFournisseursPage() {
  const [commandes, setCommandes] = React.useState<Commande[]>([])
  const [collections, setCollections] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "en_attente" | "arrivee">("all")
  const [typeFilter, setTypeFilter] = React.useState<"all" | "produit_marque" | "personnalisee">("all")

  // Modal create / edit
  const [isOpen, setIsOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Commande | null>(null)
  const [form, setForm] = React.useState<CommandeFormState>(emptyCommandeForm())
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Lignes de commande modal
  const [isLignesModalOpen, setIsLignesModalOpen] = React.useState(false)
  const [selectedCommandeForLignes, setSelectedCommandeForLignes] = React.useState<Commande | null>(null)
  const [lignes, setLignes] = React.useState<CommandeLigne[]>([])
  const [ligneForm, setLigneForm] = React.useState<LigneFormState>(emptyLigneForm())
  const [ligneError, setLigneError] = React.useState<string | null>(null)
  const [articles, setArticles] = React.useState<any[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 12

  // Stone selector states
  const [selectedCatIdx, setSelectedCatIdx] = React.useState<number>(0)
  const [selectedStoneIdx, setSelectedStoneIdx] = React.useState<number>(0)
  const [stoneCarat, setStoneCarat] = React.useState<string>("")

  // Page-level error
  const [pageError, setPageError] = React.useState<string | null>(null)

  const loadCommandes = async () => {
    try {
      const data = await fetchCommandes()
      setCommandes(data)
    } catch {
      setPageError("Impossible de charger les commandes. Vérifiez la connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  const loadArticles = async () => {
    const data = await fetchArticlesForFournisseur()
    setArticles(data)
  }

  const loadLignes = async (commandeId: number) => {
    try {
      const data = await fetchLignesForCommande(commandeId)
      setLignes(data)
    } catch {
      setLigneError("Erreur lors du chargement des lignes.")
    }
  }

  React.useEffect(() => {
    loadCommandes()
    loadArticles()
    fetchCollections().then(setCollections).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCommandeForm())
    setModalError(null)
    setIsOpen(true)
  }

  const openEdit = (cmd: Commande) => {
    setEditing(cmd)
    setForm({
      type_commande: cmd.type_commande,
      description: cmd.description || "",
      statut: cmd.statut,
      date_achat: cmd.date_achat || "",
      date_reception: cmd.date_reception || "",
      notes: cmd.notes || "",
    })
    setModalError(null)
    setIsOpen(true)
  }

  const openLignesModal = async (cmd: Commande) => {
    setSelectedCommandeForLignes(cmd)
    await loadLignes(cmd.id)
    setLigneError(null)
    setIsLignesModalOpen(true)
  }

  const handleAddLigne = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCommandeForLignes) return

    if (!ligneForm.article_id && !ligneForm.nom.trim()) {
      setLigneError("Veuillez sélectionner un article existant ou saisir un nom pour un nouvel article.")
      return
    }

    const result = await addLigneCommande(selectedCommandeForLignes.id, ligneForm)
    if (result.success) {
      await loadLignes(selectedCommandeForLignes.id)
      await loadCommandes()
      setLigneForm(emptyLigneForm())
      setSelectedCatIdx(0)
      setSelectedStoneIdx(0)
      setStoneCarat("")
      setLigneError(null)
    } else {
      setLigneError(result.error || "Erreur lors de l'ajout de la ligne.")
    }
  }

  const handleDeleteLigne = async (ligneId: number) => {
    if (!selectedCommandeForLignes) return
    const result = await deleteLigneCommande(ligneId)
    if (result.success) {
      await loadLignes(selectedCommandeForLignes.id)
      await loadCommandes()
    } else {
      setLigneError(result.error || "Erreur lors de la suppression de la ligne.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await saveCommande(form, editing?.id)
    if (result.success) {
      setIsOpen(false)
      await loadCommandes()
    } else {
      setModalError(result.error || "Une erreur est survenue.")
    }
  }

  const handleQuickMarkReceived = async (id: number) => {
    const result = await markCommandeReceived(id)
    if (result.success) {
      await loadCommandes()
    } else {
      setPageError(result.error || "Erreur lors de la mise à jour du statut.")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteCommande(deleteId)
    if (result.success) {
      setDeleteId(null)
      await loadCommandes()
    } else {
      setDeleteError(result.error || "Erreur lors de la suppression.")
    }
  }

  const setField = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const filtered = filterCommandes(commandes, searchQuery, statusFilter, typeFilter)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter])

  const { enAttenteCount, totalValeurAttente, totalValeurRecus } = calculateFournisseurStats(commandes)


  return (
    <div className={styles.container}>
      {pageError && <AlertMessage message={pageError} type="error" onClose={() => setPageError(null)} />}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Commandes Fournisseurs</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Suivi des achats et commandes
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
          <span className={styles.statLabel}>En attente</span>
          <span className={styles.statValue} style={{ color: enAttenteCount > 0 ? "#f59e0b" : undefined }}>
            {enAttenteCount}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valeur en attente</span>
          <span className={styles.statValue}>{totalValeurAttente.toLocaleString("fr-DZ")} DA</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valeur reçue</span>
          <span className={styles.statValue} style={{ color: "#10b981" }}>{totalValeurRecus.toLocaleString("fr-DZ")} DA</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher par description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="arrivee">Arrivée</option>
        </select>
        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
        >
          <option value="all">Tous les types</option>
          <option value="produit_marque">Marque</option>
          <option value="personnalisee">Personnalisée</option>
        </select>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingBag style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>Aucune commande fournisseur trouvée.</p>
          </div>
        ) : (
          paginated.map((cmd) => (
            <div key={cmd.id} className={styles.card} onClick={() => openEdit(cmd)}>
              {/* Header */}
              <div className={styles.cardHeader}>
                <div className={styles.cardSupplier}>
                  <span className={styles.supplierName}>Commande #{cmd.id}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                  <span className={`${styles.badge} ${cmd.statut === "en_attente" ? styles.badgePending
                      : cmd.statut === "arrivee" ? styles.badgeReceived
                        : styles.badgeCancelled
                    }`}>
                    {cmd.statut === "en_attente" ? "En attente" : cmd.statut === "arrivee" ? "Arrivée ✓" : "Annulée"}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeType}`}>
                    {cmd.type_commande === "produit_marque" ? "Marque" : "Personnalisée"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {cmd.description && (
                <div className={styles.cardDesc}>{cmd.description}</div>
              )}

              {/* Finance Row */}
              <div className={styles.financeRow}>
                <div className={styles.financeCol}>
                  <span className={styles.financeLabel}>Total</span>
                  <span className={styles.financeVal} style={{ color: "#ffffff", fontWeight: 700 }}>{parseFloat(cmd.prix_total.toString()).toLocaleString("fr-DZ")} DA</span>
                </div>
                <div className={styles.financeCol}>
                  <span className={styles.financeLabel}>Articles</span>
                  <span className={styles.financeVal}>{cmd.CommandeLignes?.length || 0}</span>
                </div>
              </div>

              {/* Notes */}
              {cmd.notes && <div className={styles.cardNotes}>"{cmd.notes}"</div>}

              {/* Dates */}
              <div className={styles.cardDates}>
                <div className={styles.dateRow}>
                  <Calendar className="h-3 w-3" />
                  <span>Commande : {new Date(cmd.date_commande).toLocaleDateString("fr-DZ")}</span>
                </div>
                {cmd.date_reception && (
                  <div className={styles.dateRow} style={{ color: "#10b981" }}>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Réception : {new Date(cmd.date_reception).toLocaleDateString("fr-DZ")}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {cmd.statut === "en_attente" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleQuickMarkReceived(cmd.id) }}
                      style={{ borderColor: "#10b981", color: "#10b981", height: "30px", fontSize: "0.75rem", borderRadius: "6px", gap: "0.25rem" }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Marquer Arrivée
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openLignesModal(cmd) }}
                    style={{ borderColor: "#3b82f6", color: "#3b82f6", height: "30px", fontSize: "0.75rem", borderRadius: "6px", gap: "0.25rem" }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Lignes ({cmd.CommandeLignes?.length || 0})
                  </Button>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(cmd.id) }}
                  style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
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
      <CommandeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editing={editing}
        form={form}
        setField={setField}
        modalError={modalError}
        setModalError={setModalError}
        onSubmit={handleSubmit}
      />

      {/* ── DELETE CONFIRM MODAL ── */}
      <DeleteCommandeModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onDelete={handleDelete}
        deleteError={deleteError}
        onErrorClose={() => setDeleteError(null)}
      />

      {/* ── LIGNES DE COMMANDE MODAL ── */}
      <LignesCommandeModal
        isOpen={isLignesModalOpen}
        onClose={() => setIsLignesModalOpen(false)}
        selectedCommande={selectedCommandeForLignes}
        lignes={lignes}
        ligneForm={ligneForm}
        setLigneForm={setLigneForm}
        ligneError={ligneError}
        setLigneError={setLigneError}
        articles={articles}
        onAddLigne={handleAddLigne}
        onDeleteLigne={handleDeleteLigne}
        selectedCatIdx={selectedCatIdx}
        setSelectedCatIdx={setSelectedCatIdx}
        selectedStoneIdx={selectedStoneIdx}
        setSelectedStoneIdx={setSelectedStoneIdx}
        stoneCarat={stoneCarat}
        setStoneCarat={setStoneCarat}
        collections={collections}
      />
    </div>
  )
}
