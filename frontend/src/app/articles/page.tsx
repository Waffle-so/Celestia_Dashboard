"use client"

import * as React from "react"
import { Search, Plus, Gem, Edit2, Trash2, Layers, Sparkles } from "lucide-react"
import styles from "../../Style/Articles.module.css"
import { Button } from "@/components/ui/button"
import { AlertMessage } from "@/components/AlertMessage"
import { ArticleModal, DeleteArticleModal } from "./modal"
import { CollectionModal } from "./collectionModal"
import {
  type SelectedStone,
  type Article,
  type ArticleFormState,
  type Collection,
  CATEGORIES,
  MATIERES,
  MCHEELS,
  CATEGORY_EMOJI,
  emptyForm,
  getImageUrl,
  parseArticleStones,
  filterArticles,
  calculateArticleStats,
  fetchArticles,
  fetchCollections,
  saveArticle,
  deleteArticle,
} from "./actions"

const stockBadge = (stock: number) => {
  if (stock > 3) return { label: `En stock (${stock})`, cls: styles.badgeGreen }
  if (stock > 0) return { label: `Faible (${stock})`, cls: styles.badgeAmber }
  return { label: "Rupture", cls: styles.badgeRed }
}

export default function ArticlesPage() {
  const [articles, setArticles] = React.useState<Article[]>([])
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [collectionFilter, setCollectionFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 12

  // Modal create / edit
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCollectionModalOpen, setIsCollectionModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Article | null>(null)
  const [form, setForm] = React.useState<ArticleFormState>(emptyForm())
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Stone selector states
  const [selectedCatIdx, setSelectedCatIdx] = React.useState<number>(0)
  const [selectedStoneIdx, setSelectedStoneIdx] = React.useState<number>(0)
  const [stoneCarat, setStoneCarat] = React.useState<string>("")

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Page-level error
  const [pageError, setPageError] = React.useState<string | null>(null)

  const loadArticles = async () => {
    try {
      const data = await fetchArticles()
      setArticles(data)
    } catch {
      setPageError("Impossible de charger les articles. Vérifiez la connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  const loadCollections = async () => {
    try {
      const data = await fetchCollections()
      setCollections(data)
    } catch {}
  }

  React.useEffect(() => {
    loadArticles()
    loadCollections()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalError(null)
    setSelectedCatIdx(0)
    setSelectedStoneIdx(0)
    setStoneCarat("")
    setIsOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditing(article)
    setForm({
      nom: article.nom,
      description: article.description || "",
      image: article.image || "",
      images: Array.isArray(article.images) ? article.images : (article.image ? [article.image] : []),
      collection_id: article.collection_id?.toString() || "",
      categorie: article.categorie,
      matiere: article.matiere,
      matiere_detail: article.matiere_detail || "",
      mchelel: article.mchelel,
      mchelel_detail: article.mchelel_detail || "",
      a_des_pierres: article.a_des_pierres,
      type_pierres: parseArticleStones(article.type_pierres),
      pierres_detail: article.pierres_detail || "",
      poids: article.poids?.toString() || "",
      prix_achat: article.prix_achat?.toString() || "",
      prix_vente: article.prix_vente.toString(),
      en_promo: article.en_promo || false,
      prix_promo: article.prix_promo?.toString() || "",
      stock: article.stock.toString(),
    })
    setModalError(null)
    setSelectedCatIdx(0)
    setSelectedStoneIdx(0)
    setStoneCarat("")
    setIsOpen(true)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) {
      setModalError("Le nom de l'article est requis.")
      return
    }
    if (!form.prix_vente || parseFloat(form.prix_vente) < 0) {
      setModalError("Le prix de vente doit être valide.")
      return
    }

    const result = await saveArticle(form, editing?.id)
    if (result.success) {
      setIsOpen(false)
      await loadArticles()
    } else {
      setModalError(result.error || "Une erreur est survenue.")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteArticle(deleteId)
    if (result.success) {
      setDeleteId(null)
      await loadArticles()
    } else {
      setDeleteError(result.error || "Erreur lors de la suppression.")
    }
  }

  const setField = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const filtered = articles.filter((a) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = a.nom.toLowerCase().includes(q) || a.categorie.includes(q) || (a.collection?.nom && a.collection.nom.toLowerCase().includes(q))
    const matchesCat = categoryFilter === "all" || a.categorie === categoryFilter
    const matchesCol = collectionFilter === "all"
      ? true
      : collectionFilter === "none"
        ? !a.collection_id
        : a.collection_id?.toString() === collectionFilter
    return matchesQuery && matchesCat && matchesCol
  })
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, collectionFilter])

  const { totalStock, valeurStockAchat, valeurStockVente, lowStock } = calculateArticleStats(articles)


  return (
    <div className={styles.container}>
      {/* Page alert */}
      {pageError && <AlertMessage message={pageError} type="error" onClose={() => setPageError(null)} />}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Catalogue</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Gérez vos bijoux, collections et articles en vente
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            variant="outline"
            onClick={() => setIsCollectionModalOpen(true)}
            style={{ borderRadius: "8px", gap: "0.4rem" }}
          >
            <Layers className="h-4 w-4" /> Gérer les collections ({collections.length})
          </Button>
          <Button
            onClick={openCreate}
            style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white", gap: "0.5rem" }}
          >
            <Plus className="h-4 w-4" /> Ajouter un article
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total articles</span>
          <span className={styles.statValue}>{articles.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Unités en stock</span>
          <span className={styles.statValue}>{totalStock}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Stock faible</span>
          <span className={styles.statValue} style={{ color: lowStock > 0 ? "#f59e0b" : undefined }}>{lowStock}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valeur (Achat)</span>
          <span className={styles.statValue}>{valeurStockAchat.toLocaleString("fr-DZ")} DA</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Valeur (Vente)</span>
          <span className={styles.statValue}>{valeurStockVente.toLocaleString("fr-DZ")} DA</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher par nom, catégorie, collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
        >
          <option value="all">Toutes les collections</option>
          <option value="none">Sans collection</option>
          {collections.map((col) => (
            <option key={col.id} value={col.id.toString()}>📁 {col.nom}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Gem style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>Aucun article trouvé.</p>
          </div>
        ) : (
          paginated.map((article) => {
            const { label, cls } = stockBadge(article.stock)
            return (
              <div key={article.id} className={styles.card} onClick={() => openEdit(article)}>
                <div className={styles.cardHeader}>
                  <img
                    src={getImageUrl(article.image, article.images)}
                    alt={article.nom}
                    className={styles.cardImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImageUrl()
                    }}
                  />
                  <div className={styles.cardBadgeGroup}>
                    <span className={`${styles.badge} ${cls}`}>{label}</span>
                    {article.ventes_total && article.ventes_total > 0 ? (
                      <span className={styles.badge} style={{ backgroundColor: "#8b5cf6", color: "white", fontWeight: 600 }}>
                        ⭐ {article.ventes_total} vendu{article.ventes_total > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {article.en_promo && (
                      <span className={styles.badge} style={{ backgroundColor: "#eab308", color: "#000", fontWeight: 700 }}>
                        🏷️ Offre
                      </span>
                    )}
                    {article.images && article.images.length > 1 && (
                      <span className={styles.badge} style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}>
                        📷 {article.images.length}
                      </span>
                    )}
                    {article.a_des_pierres && (
                      <span className={`${styles.badge} ${styles.badgeGreen}`}>Pierres ✦</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className={styles.cardName}>{article.nom}</div>
                  {article.description && (
                    <div className={styles.cardDesc}>{article.description}</div>
                  )}
                </div>

                <div className={styles.cardMeta}>
                  {article.collection && (
                    <span className={styles.tag} style={{ borderColor: "rgba(59, 130, 246, 0.4)", color: "#60a5fa", backgroundColor: "rgba(59, 130, 246, 0.08)" }}>
                      📁 {article.collection.nom}
                    </span>
                  )}
                  <span className={styles.tag}>{article.categorie.replace("_", " ")}</span>
                  <span className={styles.tag}>{article.matiere.replace(/_/g, " ")}</span>
                  {article.mchelel !== "aucun" && (
                    <span className={styles.tag}>mchelel: {article.mchelel.replace("_", " ")}</span>
                  )}
                  {article.poids && (
                    <span className={styles.tag}>{article.poids}g</span>
                  )}
                  {article.a_des_pierres && article.type_pierres && Array.isArray(article.type_pierres) &&
                    article.type_pierres.map((p: any, idx: number) => {
                      const stoneLabel = typeof p === "string" ? p : p.label;
                      const caratStr = typeof p === "object" && p.carat ? ` (${p.carat} ct)` : "";
                      return (
                        <span key={idx} className={styles.tag} style={{ borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.05)" }}>
                          ✦ {stoneLabel}{caratStr}
                        </span>
                      )
                    })
                  }
                </div>

                <div className={styles.cardFooter}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    {article.prix_achat && parseFloat(article.prix_achat.toString()) > 0 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                        Coût d'achat: {parseFloat(article.prix_achat.toString()).toLocaleString("fr-DZ")} DA
                      </span>
                    )}
                    {article.en_promo && article.prix_promo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ textDecoration: "line-through", opacity: 0.5, fontSize: "0.8rem" }}>
                          {parseFloat(article.prix_vente.toString()).toLocaleString("fr-DZ")} DA
                        </span>
                        <span className={styles.cardPrice} style={{ color: "#eab308" }}>
                          {parseFloat(article.prix_promo.toString()).toLocaleString("fr-DZ")} DA
                        </span>
                      </div>
                    ) : (
                      <span className={styles.cardPrice}>
                        {parseFloat(article.prix_vente.toString()).toLocaleString("fr-DZ")} DA
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(article.id) }}
                    style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
                  >
                    <Trash2 className="h-4 w-4" />
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
            Page {currentPage} sur {totalPages}
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
      <ArticleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editing={editing}
        form={form}
        setField={setField}
        setForm={setForm}
        modalError={modalError}
        setModalError={setModalError}
        onSubmit={handleSubmit}
        selectedCatIdx={selectedCatIdx}
        setSelectedCatIdx={setSelectedCatIdx}
        selectedStoneIdx={selectedStoneIdx}
        setSelectedStoneIdx={setSelectedStoneIdx}
        stoneCarat={stoneCarat}
        setStoneCarat={setStoneCarat}
        collections={collections}
      />

      {/* ── MANAGE COLLECTIONS MODAL ── */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        collections={collections}
        onCollectionsChange={() => {
          loadCollections()
          loadArticles()
        }}
      />

      {/* ── DELETE CONFIRM MODAL ── */}
      <DeleteArticleModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onDelete={handleDelete}
        deleteError={deleteError}
        onErrorClose={() => setDeleteError(null)}
      />
    </div>
  )
}
