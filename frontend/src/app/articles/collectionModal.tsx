"use client"

import * as React from "react"
import { Plus, Trash2, FolderPlus, Layers, CheckCircle2, AlertCircle } from "lucide-react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import {
  type Collection,
  createCollection,
  deleteCollection,
} from "./actions"

type CollectionModalProps = {
  isOpen: boolean
  onClose: () => void
  collections: Collection[]
  onCollectionsChange: () => void
}

export function CollectionModal({
  isOpen,
  onClose,
  collections,
  onCollectionsChange,
}: CollectionModalProps) {
  const [nom, setNom] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) {
      setError("Le nom de la collection est requis.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await createCollection({
      nom: nom.trim(),
      description: description.trim() || undefined,
    })

    setLoading(false)
    if (!res.success) {
      setError(res.error || "Erreur lors de la création")
    } else {
      setNom("")
      setDescription("")
      setSuccess("Collection créée avec succès !")
      onCollectionsChange()
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleDelete = async (id: number, nomCol: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer la collection « ${nomCol} » ? Les articles associés ne seront pas supprimés mais détachés de la collection.`)) {
      return
    }

    setLoading(true)
    setError(null)
    const res = await deleteCollection(id)
    setLoading(false)

    if (!res.success) {
      setError(res.error || "Erreur lors de la suppression")
    } else {
      onCollectionsChange()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gérer les Collections"
      description="Organisez vos bijoux en collections pour le catalogue et votre futur site vitrine."
      className="sm:max-w-xl"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Formulaire d'ajout rapide */}
        <form
          onSubmit={handleCreate}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0.75rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FolderPlus style={{ width: 16, height: 16, color: "var(--primary, #3b82f6)" }} />
            Nouvelle collection
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <AlertCircle style={{ width: 14, height: 14 }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ color: "#10b981", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} /> {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Ex: Bagues Solitaires, Été 2025..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(0,0,0,0.2)",
                color: "inherit",
                fontSize: "0.875rem",
              }}
              required
            />
            <Button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Plus style={{ width: 16, height: 16 }} />
              Ajouter
            </Button>
          </div>

          <input
            type="text"
            placeholder="Description facultative (ex: Bagues serties d'oxydes ou de pierres précieuses)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(0,0,0,0.15)",
              color: "inherit",
              fontSize: "0.8rem",
            }}
          />
        </form>

        {/* Liste des collections existantes */}
        <div>
          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#a1a1aa", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Layers style={{ width: 14, height: 14 }} />
            Collections existantes ({collections.length})
          </div>

          {collections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#71717a", fontSize: "0.875rem" }}>
              Aucune collection créée pour le moment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
              {collections.map((col) => (
                <div
                  key={col.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{col.nom}</div>
                    {col.description && (
                      <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{col.description}</div>
                    )}
                    <div style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "2px" }}>
                      {col.nombre_articles || 0} article(s) lié(s)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(col.id, col.nom)}
                    disabled={loading}
                    title="Supprimer la collection"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "0.35rem",
                      borderRadius: "0.35rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.8,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
