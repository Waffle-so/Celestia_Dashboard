"use client"

import * as React from "react"
import { Plus, X, Upload, Sparkles, Folder, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import styles from "../../Style/Articles.module.css"
import pierresData from "../pierres.json"
import {
  type Article,
  type ArticleFormState,
  type SelectedStone,
  type Collection,
  CATEGORIES,
  MATIERES,
  MCHEELS,
  getImageUrl,
  uploadArticleImage,
  deleteStorageImage,
} from "./actions"

type ArticleModalProps = {
  isOpen: boolean
  onClose: () => void
  editing: Article | null
  form: ArticleFormState
  setField: (k: string, v: any) => void
  setForm: React.Dispatch<React.SetStateAction<ArticleFormState>>
  modalError: string | null
  setModalError: (err: string | null) => void
  onSubmit: (e: React.FormEvent) => void
  selectedCatIdx: number
  setSelectedCatIdx: (idx: number) => void
  selectedStoneIdx: number
  setSelectedStoneIdx: (idx: number) => void
  stoneCarat: string
  setStoneCarat: (val: string) => void
  collections?: Collection[]
}

export function ArticleModal({
  isOpen,
  onClose,
  editing,
  form,
  setField,
  setForm,
  modalError,
  setModalError,
  onSubmit,
  selectedCatIdx,
  setSelectedCatIdx,
  selectedStoneIdx,
  setSelectedStoneIdx,
  stoneCarat,
  setStoneCarat,
  collections = [],
}: ArticleModalProps) {
  const [uploading, setUploading] = React.useState(false)

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const currentImages = form.images || []
    const remainingSlots = 5 - currentImages.length
    if (remainingSlots <= 0) {
      setModalError("Vous avez déjà atteint le maximum de 5 images pour cet article.")
      return
    }

    const selectedList = Array.from(files).slice(0, remainingSlots)
    setUploading(true)
    setModalError(null)

    try {
      const newUrls: string[] = []
      for (const file of selectedList) {
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const base64 = await base64Promise
        const uploadedUrl = await uploadArticleImage(base64, file.name)
        newUrls.push(uploadedUrl)
      }

      const updated = [...currentImages, ...newUrls].slice(0, 5)
      setField("images", updated)
      if (!form.image && updated.length > 0) {
        setField("image", updated[0])
      }
    } catch (err: any) {
      setModalError(err.message || "Erreur lors de l'upload vers Supabase Storage.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleRemoveImage = async (indexToRemove: number) => {
    const targetUrl = (form.images || [])[indexToRemove]
    const updated = (form.images || []).filter((_, idx) => idx !== indexToRemove)
    setField("images", updated)
    if (form.image === targetUrl) {
      setField("image", updated[0] || "")
    }

    // Supprimer immédiatement le fichier physique dans Supabase Storage
    if (targetUrl) {
      await deleteStorageImage(targetUrl)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Modifier : ${editing.nom}` : "Nouvel article"}
      description={editing ? "Mettez à jour les informations de cet article." : "Remplissez les informations pour créer un nouveau bijou."}
      className="sm:max-w-2xl"
      errorMessage={modalError}
      errorType="error"
      onErrorClose={() => setModalError(null)}
      footer={
        <>
          <Button
            type="submit"
            form="article-form"
            disabled={uploading}
            style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white" }}
          >
            {editing ? "Enregistrer les modifications" : "Créer l'article"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            style={{ borderRadius: "8px", color: "#71717a" }}
          >
            Annuler
          </Button>
        </>
      }
    >
      <form id="article-form" onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* SECTION: Infos générales */}
          <div className={styles.formSectionTitle}>Informations générales</div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nom de l'article *</label>
            <input className={styles.formInput} placeholder="Ex: Bague solitaire argent" value={form.nom} onChange={(e) => setField("nom", e.target.value)} required />
          </div>

          {/* SECTION: Images (Supabase Storage - max 5) */}
          <div className={styles.formGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                Photos de l'article (Max 5)
              </label>
              <span style={{ fontSize: "0.75rem", color: (form.images?.length || 0) >= 5 ? "#ef4444" : "#a1a1aa", fontWeight: 500 }}>
                {(form.images?.length || 0)}/5 images
              </span>
            </div>

            {/* Bouton d'upload vers Supabase */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "0.5rem",
                  background: (form.images?.length || 0) >= 5 ? "rgba(255,255,255,0.05)" : "rgba(59, 130, 246, 0.12)",
                  color: (form.images?.length || 0) >= 5 ? "#71717a" : "#3b82f6",
                  cursor: (form.images?.length || 0) >= 5 || uploading ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  border: "1px dashed rgba(59, 130, 246, 0.35)",
                }}
              >
                <Upload style={{ width: 16, height: 16 }} />
                {uploading ? "Upload vers Supabase en cours..." : "Téléverser des photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={(form.images?.length || 0) >= 5 || uploading}
                  style={{ display: "none" }}
                  onChange={handleFilesSelect}
                />
              </label>
              <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                Stockées automatiquement dans Supabase Storage
              </span>
            </div>

            {/* Galerie d'aperçu des miniatures */}
            {(form.images && form.images.length > 0) ? (
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                {form.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: 68,
                      height: 68,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: idx === 0 ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.15)",
                      backgroundColor: "#18181b",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Image ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {idx === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(59, 130, 246, 0.9)",
                          color: "white",
                          fontSize: "8px",
                          textAlign: "center",
                          fontWeight: 700,
                          padding: "1px 0",
                        }}
                      >
                        Principale
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        background: "rgba(0,0,0,0.75)",
                        color: "#ef4444",
                        border: "none",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Supprimer cette image"
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "#71717a", fontStyle: "italic" }}>
                Aucune image importée. L'image par défaut sera utilisée.
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.formTextarea} placeholder="Décrivez le bijou..." value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>

          {/* SECTION: Catégorie, Collection & Matière */}
          <div className={styles.formSectionTitle}>Catégorie, Collection & Matière</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Catégorie</label>
              <select className={styles.formSelect} value={form.categorie} onChange={(e) => setField("categorie", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Collection</label>
              <select
                className={styles.formSelect}
                value={form.collection_id || ""}
                onChange={(e) => setField("collection_id", e.target.value)}
              >
                <option value="">Aucune collection</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id.toString()}>{col.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Matière principale</label>
              <select className={styles.formSelect} value={form.matiere} onChange={(e) => setField("matiere", e.target.value)}>
                {MATIERES.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Précision matière</label>
              <input className={styles.formInput} placeholder="Ex: argent 925" value={form.matiere_detail} onChange={(e) => setField("matiere_detail", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mchelel (dorure)</label>
              <select className={styles.formSelect} value={form.mchelel} onChange={(e) => setField("mchelel", e.target.value)}>
                {MCHEELS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          {form.mchelel !== "aucun" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Précision mchelel</label>
              <input className={styles.formInput} placeholder="Détails dorure..." value={form.mchelel_detail} onChange={(e) => setField("mchelel_detail", e.target.value)} />
            </div>
          )}

          {/* SECTION: Pierres */}
          <div className={styles.formSectionTitle}>Pierres & Gemmes</div>
          <div className={styles.formGroup}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "#3f3f46" }}>
              <input type="checkbox" checked={form.a_des_pierres} onChange={(e) => setField("a_des_pierres", e.target.checked)} style={{ width: 16, height: 16, borderRadius: 4 }} />
              Cet article contient des pierres
            </label>
          </div>
          {form.a_des_pierres && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* List of currently selected stones */}
              {form.type_pierres && form.type_pierres.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.75rem", backgroundColor: "#f4f4f5", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
                  {form.type_pierres.map((stone, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "white", border: "1px solid #d4d4d8", fontSize: "0.8rem", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                      <span style={{ fontWeight: 600, color: "#27272a" }}>{stone.label}</span>
                      {stone.carat && <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700, backgroundColor: "#ecfdf5", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{stone.carat} ct</span>}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.type_pierres.filter((_, idx) => idx !== index);
                          setField("type_pierres", updated);
                        }}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#a1a1aa", marginLeft: "0.25rem", display: "flex", alignItems: "center" }}
                      >
                        <X className="h-3 w-3 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new stone form block */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: "0.75rem" }}>Catégorie</label>
                    <select
                      className={styles.formSelect}
                      value={selectedCatIdx}
                      onChange={(e) => {
                        setSelectedCatIdx(parseInt(e.target.value));
                        setSelectedStoneIdx(0);
                        setStoneCarat("");
                      }}
                    >
                      {pierresData.map((cat, idx) => (
                        <option key={idx} value={idx}>{cat.categorie}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: "0.75rem" }}>Nom de la Pierre</label>
                    <select
                      className={styles.formSelect}
                      value={selectedStoneIdx}
                      onChange={(e) => setSelectedStoneIdx(parseInt(e.target.value))}
                    >
                      {pierresData[selectedCatIdx]?.pierres.map((stone, idx) => (
                        <option key={idx} value={idx}>{stone.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                  {pierresData[selectedCatIdx]?.categorie !== "Pierre ordinaire" ? (
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.formLabel} style={{ fontSize: "0.75rem" }}>Poids en Carat (ct)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 0.5 (Optionnel)"
                        className={styles.formInput}
                        value={stoneCarat}
                        onChange={(e) => setStoneCarat(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}></div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const cat = pierresData[selectedCatIdx];
                      const stone = cat.pierres[selectedStoneIdx];
                      if (!stone) return;

                      const alreadyExists = form.type_pierres.some((p) => p.id === stone.id);
                      if (alreadyExists) {
                        setModalError("Cette pierre a déjà été ajoutée.");
                        return;
                      }

                      const newStone: SelectedStone = {
                        id: stone.id,
                        label: stone.label,
                        categorie: cat.categorie,
                        carat: stoneCarat ? parseFloat(stoneCarat) : undefined,
                      };

                      setForm((f) => ({ ...f, type_pierres: [...f.type_pierres, newStone] }));
                      setStoneCarat("");
                    }}
                    style={{ gap: "0.4rem", borderRadius: "6px", height: "42px" }}
                  >
                    <Plus className="h-4 w-4" /> Ajouter
                  </Button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Détails supplémentaires pierres</label>
                <input className={styles.formInput} placeholder="Taille, couleur, provenance..." value={form.pierres_detail} onChange={(e) => setField("pierres_detail", e.target.value)} />
              </div>
            </div>
          )}

          {/* SECTION: Prix & Stock */}
          <div className={styles.formSectionTitle}>Prix & Stock</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prix d'achat (DA)</label>
              <input className={styles.formInput} type="number" min="0" step="0.01" placeholder="0" value={form.prix_achat} onChange={(e) => setField("prix_achat", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Poids (g)</label>
              <input className={styles.formInput} type="number" min="0" step="0.001" placeholder="0.000" value={form.poids} onChange={(e) => setField("poids", e.target.value)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prix de vente (DA) *</label>
              <input className={styles.formInput} type="number" min="0" step="0.01" placeholder="0" value={form.prix_vente} onChange={(e) => setField("prix_vente", e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Stock</label>
              <input className={styles.formInput} type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
            </div>
          </div>

          {/* SECTION: Offres & Promotions */}
          <div
            style={{
              background: "rgba(234, 179, 8, 0.06)",
              border: "1px solid rgba(234, 179, 8, 0.25)",
              borderRadius: "0.5rem",
              padding: "0.85rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#eab308",
              }}
            >
              <input
                type="checkbox"
                checked={form.en_promo || false}
                onChange={(e) => setField("en_promo", e.target.checked)}
                style={{ accentColor: "#eab308", width: 16, height: 16 }}
              />
              🏷️ Mettre en promotion / Offre spéciale
            </label>

            {form.en_promo && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.25rem", flexWrap: "wrap" }}>
                <label className={styles.formLabel} style={{ marginBottom: 0, whiteSpace: "nowrap" }}>
                  Prix promotionnel (DA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 8500"
                  value={form.prix_promo || ""}
                  onChange={(e) => setField("prix_promo", e.target.value)}
                  className={styles.formInput}
                  style={{ maxWidth: "200px" }}
                  required={form.en_promo}
                />
              </div>
            )}
          </div>


        </div>
      </form>
    </Modal>
  )
}

type DeleteArticleModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  deleteError: string | null
  onErrorClose: () => void
}

export function DeleteArticleModal({
  isOpen,
  onClose,
  onDelete,
  deleteError,
  onErrorClose,
}: DeleteArticleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer l'article"
      description="Cette action est irréversible. L'article sera définitivement supprimé du catalogue."
      errorMessage={deleteError}
      errorType="error"
      onErrorClose={onErrorClose}
      footer={
        <>
          <Button
            onClick={onDelete}
            style={{ borderRadius: "8px", backgroundColor: "#ef4444", color: "white" }}
          >
            Supprimer
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ borderRadius: "8px", color: "#71717a" }}
          >
            Annuler
          </Button>
        </>
      }
    >
      <p style={{ fontSize: "0.875rem", color: "#52525b" }}>
        Êtes-vous sûr de vouloir supprimer cet article ? Il ne pourra pas être restauré.
      </p>
    </Modal>
  )
}
