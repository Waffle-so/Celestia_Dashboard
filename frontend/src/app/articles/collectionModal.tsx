"use client"

import * as React from "react"
import { Plus, Trash2, FolderPlus, Layers, CheckCircle2, AlertCircle, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import {
  type Collection,
  createCollection,
  updateCollection,
  deleteCollection,
  uploadCollectionImage,
  deleteCollectionStorageImage,
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
  const [newImage, setNewImage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingColId, setLoadingColId] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64 = await base64Promise
      const url = await uploadCollectionImage(base64, file.name)
      setNewImage(url)
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload de l'image.")
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  const handleRemoveNewImage = async () => {
    if (!newImage) return
    const urlToDelete = newImage
    setNewImage(null)
    await deleteCollectionStorageImage(urlToDelete)
  }

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
      image: newImage || undefined,
    })

    setLoading(false)
    if (!res.success) {
      setError(res.error || "Erreur lors de la création")
    } else {
      setNom("")
      setDescription("")
      setNewImage(null)
      setSuccess("Collection créée avec succès !")
      onCollectionsChange()
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleUploadForExistingCollection = async (col: Collection, file: File) => {
    setLoadingColId(col.id)
    setError(null)
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const base64 = await base64Promise
      const uploadedUrl = await uploadCollectionImage(base64, file.name)

      const res = await updateCollection(col.id, { image: uploadedUrl })
      if (!res.success) {
        setError(res.error || "Erreur lors de l'attribution de la photo.")
      } else {
        onCollectionsChange()
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload vers Supabase Storage.")
    } finally {
      setLoadingColId(null)
    }
  }

  const handleRemoveCollectionImage = async (col: Collection) => {
    if (!col.image) return
    if (!confirm(`Supprimer la photo de la collection « ${col.nom} » ?`)) return

    setLoadingColId(col.id)
    setError(null)
    try {
      const oldUrl = col.image
      await deleteCollectionStorageImage(oldUrl)
      const res = await updateCollection(col.id, { image: null as any })
      if (!res.success) {
        setError(res.error || "Erreur lors de la suppression de la photo.")
      } else {
        onCollectionsChange()
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression de la photo.")
    } finally {
      setLoadingColId(null)
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

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
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

            {/* Bouton photo pour la nouvelle collection */}
            {newImage ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", position: "relative" }}>
                <img
                  src={newImage}
                  alt="Aperçu"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "0.375rem",
                    objectFit: "cover",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveNewImage}
                  title="Supprimer la photo"
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px dashed rgba(255, 255, 255, 0.25)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#93c5fd",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
                title="Ajouter une photo à cette nouvelle collection"
              >
                <Plus style={{ width: 14, height: 14 }} />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleUploadNewImage}
                />
              </label>
            )}

            <Button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              {loading ? (
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              ) : (
                <Plus style={{ width: 16, height: 16 }} />
              )}
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
                    gap: "0.75rem",
                  }}
                >
                  {/* Partie gauche : Photo (ou icône) + Informations */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                    {col.image ? (
                      <img
                        src={col.image}
                        alt={col.nom}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "0.375rem",
                          objectFit: "cover",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "0.375rem",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px dashed rgba(255, 255, 255, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#71717a",
                          flexShrink: 0,
                        }}
                        title="Aucune photo attribuée"
                      >
                        <ImageIcon style={{ width: 18, height: 18, opacity: 0.5 }} />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {col.nom}
                      </div>
                      {col.description && (
                        <div style={{ fontSize: "0.75rem", color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {col.description}
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "2px" }}>
                        {col.nombre_articles || 0} article(s) lié(s)
                      </div>
                    </div>
                  </div>

                  {/* Partie droite : Gestion photo (+ pour ajouter, supprimer si déjà attribuée) + Supprimer collection */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    {col.image ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveCollectionImage(col)}
                        disabled={loadingColId === col.id}
                        title="Supprimer la photo attribuée"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          background: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          borderRadius: "0.375rem",
                          padding: "0.35rem 0.55rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: loadingColId === col.id ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {loadingColId === col.id ? (
                          <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
                        ) : (
                          <X style={{ width: 13, height: 13 }} />
                        )}
                        <span>Photo</span>
                      </button>
                    ) : (
                      <label
                        title="Attribuer une photo à cette collection"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          background: "rgba(59, 130, 246, 0.12)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          color: "#60a5fa",
                          borderRadius: "0.375rem",
                          padding: "0.35rem 0.55rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: loadingColId === col.id ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {loadingColId === col.id ? (
                          <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
                        ) : (
                          <Plus style={{ width: 13, height: 13 }} />
                        )}
                        <span>Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={loadingColId === col.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadForExistingCollection(col, file)
                            e.target.value = ""
                          }}
                        />
                      </label>
                    )}

                    {/* Séparateur vertical */}
                    <div style={{ width: 1, height: 18, background: "rgba(255, 255, 255, 0.1)" }} />

                    {/* Supprimer collection */}
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
                        opacity: 0.75,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
                    >
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
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
