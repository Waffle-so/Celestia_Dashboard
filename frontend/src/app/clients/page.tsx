"use client"

import * as React from "react"
import { Search, Plus, Trash2, Mail, Phone, MapPin, Users } from "lucide-react"
import styles from "../../Style/Clients.module.css"
import { Button } from "@/components/ui/button"
import { AlertMessage } from "@/components/AlertMessage"
import { ClientModal, DeleteClientModal } from "./modal"

import {
  type Client,
  type ClientFormState,
  emptyClientForm,
  filterClients,
  fetchClients,
  saveClient,
  deleteClient,
} from "./actions"

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 12

  // Modal create / edit
  const [isOpen, setIsOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Client | null>(null)
  const [form, setForm] = React.useState<ClientFormState>(emptyClientForm())
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // Page-level error
  const [pageError, setPageError] = React.useState<string | null>(null)

  const loadClients = async () => {
    try {
      const data = await fetchClients()
      setClients(data)
    } catch {
      setPageError("Impossible de charger les clients. Vérifiez la connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadClients()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyClientForm())
    setModalError(null)
    setIsOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({
      nom: client.nom,
      telephone: client.telephone || "",
      email: client.email || "",
      adresse: client.adresse || "",
      wilaya: client.wilaya || "",
      notes: client.notes || "",
    })
    setModalError(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) {
      setModalError("Le nom du client est requis.")
      return
    }

    const result = await saveClient(form, editing?.id)
    if (result.success) {
      setIsOpen(false)
      await loadClients()
    } else {
      setModalError(result.error || "Une erreur est survenue.")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteClient(deleteId)
    if (result.success) {
      setDeleteId(null)
      await loadClients()
    } else {
      setDeleteError(result.error || "Erreur lors de la suppression.")
    }
  }

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const filtered = filterClients(clients, searchQuery)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])


  const withWilaya = clients.filter((c) => c.wilaya).length
  const withEmail = clients.filter((c) => c.email).length

  return (
    <div className={styles.container}>
      {/* Page alert */}
      {pageError && <AlertMessage message={pageError} type="error" onClose={() => setPageError(null)} />}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Répertoire Clients</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Coordonnées et informations de vos clients fidèles
          </p>
        </div>
        <Button
          onClick={openCreate}
          style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white", gap: "0.5rem" }}
        >
          <Plus className="h-4 w-4" /> Ajouter un client
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total clients</span>
          <span className={styles.statValue}>{clients.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avec wilaya</span>
          <span className={styles.statValue}>{withWilaya}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avec email</span>
          <span className={styles.statValue}>{withEmail}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher par nom, téléphone, wilaya ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Users style={{ width: 40, height: 40, margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>Aucun client trouvé.</p>
          </div>
        ) : (
          paginated.map((client) => {
            const initial = client.nom.charAt(0).toUpperCase()
            return (
              <div key={client.id} className={styles.card} onClick={() => openEdit(client)}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>{initial}</div>
                  <div className={styles.info}>
                    <span className={styles.name}>{client.nom}</span>
                    {client.wilaya && (
                      <span className={styles.wilayaTag}>{client.wilaya}</span>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className={styles.cardBody}>
                  {client.telephone && (
                    <span className={styles.contactItem}>
                      <Phone className={styles.contactIcon} />
                      {client.telephone}
                    </span>
                  )}
                  {client.email && (
                    <span className={styles.contactItem}>
                      <Mail className={styles.contactIcon} />
                      {client.email}
                    </span>
                  )}
                  {client.adresse && (
                    <span className={styles.contactItem}>
                      <MapPin className={styles.contactIcon} />
                      {client.adresse}
                    </span>
                  )}
                  {client.notes && (
                    <div className={styles.notes}>
                      "{client.notes}"
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className={styles.cardFooter}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(client.id) }}
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
      <ClientModal
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
      <DeleteClientModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onDelete={handleDelete}
        deleteError={deleteError}
        onErrorClose={() => setDeleteError(null)}
      />
    </div>
  )
}
