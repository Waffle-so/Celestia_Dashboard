"use client"

import * as React from "react"
import { Plus, Trash2, X } from "lucide-react"
import styles from "../../Style/Fournisseurs.module.css"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import pierresData from "../pierres.json"
import {
  type SelectedStone,
  type Commande,
  type CommandeLigne,
  type CommandeFormState,
  type LigneFormState,
} from "./actions"

export type CommandeModalProps = {
  isOpen: boolean
  onClose: () => void
  editing: Commande | null
  form: CommandeFormState
  setField: (k: string, v: any) => void
  modalError: string | null
  setModalError: (err: string | null) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CommandeModal({
  isOpen,
  onClose,
  editing,
  form,
  setField,
  modalError,
  setModalError,
  onSubmit,
}: CommandeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Modifier commande #${editing.id}` : "Nouvelle commande"}
      description={editing ? "Mettez à jour les informations de cette commande." : "Saisissez les détails de la commande fournisseur."}
      className="sm:max-w-xl"
      errorMessage={modalError}
      errorType="error"
      onErrorClose={() => setModalError(null)}
      footer={
        <>
          <Button
            type="submit"
            form="fournisseur-form"
            style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white" }}
          >
            {editing ? "Enregistrer les modifications" : "Créer la commande"}
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
      <form id="fournisseur-form" onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* SECTION: Type */}
          <div className={styles.formSectionTitle}>Type de commande</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type de commande</label>
              <select
                className={styles.formSelect}
                value={form.type_commande}
                onChange={(e) => setField("type_commande", e.target.value)}
              >
                <option value="produit_marque">Produit de notre marque</option>
                <option value="personnalisee">Commande personnalisée</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select
                className={styles.formSelect}
                value={form.statut}
                onChange={(e) => setField("statut", e.target.value)}
              >
                <option value="en_attente">En attente de réception</option>
                <option value="arrivee">Déjà arrivée</option>
              </select>
            </div>
          </div>

          {/* SECTION: Détails */}
          <div className={styles.formSectionTitle}>Détails de la commande</div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description bijoux</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Ex: 5 bagues argent 925 avec citrines, taille 54..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          {/* SECTION: Dates */}
          <div className={styles.formSectionTitle}>Dates</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date d'achat</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date_achat}
                onChange={(e) => setField("date_achat", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date de réception prévue</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date_reception}
                onChange={(e) => setField("date_reception", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes / Remarques</label>
            <input
              className={styles.formInput}
              placeholder="Informations supplémentaires..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>

        </div>
      </form>
    </Modal>
  )
}

export type DeleteCommandeModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  deleteError: string | null
  onErrorClose: () => void
}

export function DeleteCommandeModal({
  isOpen,
  onClose,
  onDelete,
  deleteError,
  onErrorClose,
}: DeleteCommandeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer la commande"
      description="Cette action est irréversible. La commande fournisseur sera définitivement supprimée."
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
        Êtes-vous sûr de vouloir supprimer cette commande fournisseur ? Elle ne pourra pas être restaurée.
      </p>
    </Modal>
  )
}

export type LignesCommandeModalProps = {
  isOpen: boolean
  onClose: () => void
  selectedCommande: Commande | null
  lignes: CommandeLigne[]
  ligneForm: LigneFormState
  setLigneForm: React.Dispatch<React.SetStateAction<LigneFormState>>
  ligneError: string | null
  setLigneError: (err: string | null) => void
  articles: any[]
  onAddLigne: (e: React.FormEvent) => void
  onDeleteLigne: (ligneId: number) => void
  selectedCatIdx: number
  setSelectedCatIdx: (idx: number) => void
  selectedStoneIdx: number
  setSelectedStoneIdx: (idx: number) => void
  stoneCarat: string
  setStoneCarat: (val: string) => void
  collections?: any[]
}

export function LignesCommandeModal({
  isOpen,
  onClose,
  selectedCommande,
  lignes,
  ligneForm,
  setLigneForm,
  ligneError,
  setLigneError,
  articles,
  onAddLigne,
  onDeleteLigne,
  selectedCatIdx,
  setSelectedCatIdx,
  selectedStoneIdx,
  setSelectedStoneIdx,
  stoneCarat,
  setStoneCarat,
  collections = [],
}: LignesCommandeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lignes de commande - #${selectedCommande?.id}`}
      description="Gérez les articles de cette commande fournisseur. Sélectionnez un article existant ou créez-en un nouveau."
      className="sm:max-w-4xl"
      errorMessage={ligneError}
      errorType="error"
      onErrorClose={() => setLigneError(null)}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            style={{ borderRadius: "8px", color: "#71717a" }}
          >
            Fermer
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Formulaire d'ajout de ligne */}
        <form onSubmit={onAddLigne} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", backgroundColor: "#f4f4f5", borderRadius: "8px" }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>Ajouter une ligne</div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Article existant (optionnel)</label>
              <select
                className={styles.formSelect}
                value={ligneForm.article_id}
                onChange={(e) => {
                  setLigneForm((f) => ({ ...f, article_id: e.target.value }))
                  const selectedArticle = articles.find(a => a.id === parseInt(e.target.value))
                  if (selectedArticle) {
                    setLigneForm((f) => ({ ...f, nom: selectedArticle.nom }))
                  }
                }}
              >
                <option value="">-- Créer un nouvel article --</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.nom} ({article.categorie})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nom du bijou *</label>
              <input
                className={styles.formInput}
                placeholder="Nom du bijou"
                value={ligneForm.nom}
                onChange={(e) => setLigneForm((f) => ({ ...f, nom: e.target.value }))}
                disabled={!!ligneForm.article_id}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Catégorie</label>
              <select
                className={styles.formSelect}
                value={ligneForm.categorie}
                onChange={(e) => setLigneForm((f) => ({ ...f, categorie: e.target.value as any }))}
              >
                <option value="bague">Bague</option>
                <option value="collier">Collier</option>
                <option value="bracelet">Bracelet</option>
                <option value="boucles_oreilles">Boucles d'oreilles</option>
                <option value="pendentif">Pendentif</option>
                <option value="chevillere">Chevillère</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Collection</label>
              <select
                className={styles.formSelect}
                value={ligneForm.collection_id || ""}
                onChange={(e) => setLigneForm((f) => ({ ...f, collection_id: e.target.value }))}
              >
                <option value="">Aucune collection</option>
                {collections.map((col: any) => (
                  <option key={col.id} value={col.id.toString()}>{col.nom}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Matière</label>
              <select
                className={styles.formSelect}
                value={ligneForm.matiere}
                onChange={(e) => setLigneForm((f) => ({ ...f, matiere: e.target.value as any }))}
              >
                <option value="argent">Argent</option>
                <option value="or_18k">Or 18K</option>
                <option value="or_blanc">Or blanc</option>
                <option value="or_nordique">Or nordique</option>
                <option value="acier_inoxydable">Acier inoxydable</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Précision matière</label>
              <input
                className={styles.formInput}
                placeholder="Ex: argent 925"
                value={ligneForm.matiere_detail}
                onChange={(e) => setLigneForm((f) => ({ ...f, matiere_detail: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mchelel (dorure)</label>
              <select
                className={styles.formSelect}
                value={ligneForm.mchelel}
                onChange={(e) => setLigneForm((f) => ({ ...f, mchelel: e.target.value as any }))}
              >
                <option value="aucun">Aucun</option>
                <option value="or_veritable">Or véritable</option>
                <option value="or_nordique">Or nordique</option>
                <option value="or_rose">Or rose</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          {ligneForm.mchelel !== "aucun" && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Précision mchelel</label>
              <input
                className={styles.formInput}
                placeholder="Détails dorure..."
                value={ligneForm.mchelel_detail}
                onChange={(e) => setLigneForm((f) => ({ ...f, mchelel_detail: e.target.value }))}
              />
            </div>
          )}

          {/* SECTION: Pierres */}
          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b", marginTop: "0.5rem" }}>Pierres & Gemmes</div>
          <div className={styles.formGroup}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", color: "#3f3f46" }}>
              <input
                type="checkbox"
                checked={ligneForm.a_des_pierres}
                onChange={(e) => setLigneForm((f) => ({ ...f, a_des_pierres: e.target.checked }))}
                style={{ width: 16, height: 16, borderRadius: 4 }}
              />
              Cet article contient des pierres
            </label>
          </div>
          {ligneForm.a_des_pierres && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* List of currently selected stones */}
              {ligneForm.type_pierres && ligneForm.type_pierres.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e4e4e7" }}>
                  {ligneForm.type_pierres.map((stone, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "#f4f4f5", border: "1px solid #d4d4d8", fontSize: "0.8rem", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                      <span style={{ fontWeight: 600, color: "#27272a" }}>{stone.label}</span>
                      {stone.carat && <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700, backgroundColor: "#ecfdf5", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{stone.carat} ct</span>}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = ligneForm.type_pierres.filter((_, idx) => idx !== index);
                          setLigneForm((f) => ({ ...f, type_pierres: updated }));
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
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "white", border: "1px solid #e4e4e7", borderRadius: "8px" }}>
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

                      const alreadyExists = ligneForm.type_pierres.some((p) => p.id === stone.id);
                      if (alreadyExists) {
                        setLigneError("Cette pierre a déjà été ajoutée.");
                        return;
                      }

                      const newStone: SelectedStone = {
                        id: stone.id,
                        label: stone.label,
                        categorie: cat.categorie,
                        carat: stoneCarat ? parseFloat(stoneCarat) : undefined,
                      };

                      setLigneForm((f) => ({ ...f, type_pierres: [...f.type_pierres, newStone] }));
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
                <input
                  className={styles.formInput}
                  placeholder="Taille, couleur, provenance..."
                  value={ligneForm.pierres_detail}
                  onChange={(e) => setLigneForm((f) => ({ ...f, pierres_detail: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b", marginTop: "0.5rem" }}>Prix & Quantité</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantité</label>
              <input
                type="number"
                min="1"
                className={styles.formInput}
                value={ligneForm.quantite}
                onChange={(e) => setLigneForm((f) => ({ ...f, quantite: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prix achat unitaire (DA)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.formInput}
                value={ligneForm.prix_achat_unitaire}
                onChange={(e) => setLigneForm((f) => ({ ...f, prix_achat_unitaire: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prix vente (DA)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.formInput}
                value={ligneForm.prix_vente}
                onChange={(e) => setLigneForm((f) => ({ ...f, prix_vente: e.target.value }))}
              />
            </div>
          </div>

          <Button
            type="submit"
            style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white", alignSelf: "flex-start" }}
          >
            Ajouter la ligne
          </Button>
        </form>

        {/* Liste des lignes existantes */}
        {lignes.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b", marginBottom: "0.75rem" }}>
              Lignes de commande ({lignes.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {lignes.map((ligne) => (
                <div
                  key={ligne.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    backgroundColor: "white",
                    border: "1px solid #e4e4e7",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "#18181b" }}>
                      {ligne.nom}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "0.25rem" }}>
                      {ligne.categorie} • {ligne.matiere} • {ligne.quantite} × {parseFloat(ligne.prix_achat_unitaire.toString()).toLocaleString("fr-DZ")} DA
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#18181b" }}>
                      {parseFloat(ligne.prix_total.toString()).toLocaleString("fr-DZ")} DA
                    </div>
                    <button
                      onClick={() => onDeleteLigne(ligne.id)}
                      style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lignes.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#71717a", fontSize: "0.875rem" }}>
            Aucune ligne de commande pour le moment.
          </div>
        )}
      </div>
    </Modal>
  )
}
