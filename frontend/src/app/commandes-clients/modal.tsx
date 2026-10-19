"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import styles from "../../Style/CommandesClients.module.css"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import {
  type Client,
  type Article,
  type SelectedBijouItem,
  type CommandeClient,
  type CommandeClientFormState,
  CATEGORIES,
  getArticleStock,
} from "./actions"

export type CommandeClientModalProps = {
  isOpen: boolean
  onClose: () => void
  editing: CommandeClient | null
  form: CommandeClientFormState
  setField: (k: string, v: any) => void
  clients: Client[]
  modalError: string | null
  setModalError: (err: string | null) => void
  onSubmit: (e: React.FormEvent) => void
  selectedBijoux: SelectedBijouItem[]
  addBijou: (art: Article) => void
  removeBijou: (id: number) => void
  updateBijouQty: (id: number, qty: number) => void
  bijouSearch: string
  setBijouSearch: (v: string) => void
  bijouCategoryFilter: string
  setBijouCategoryFilter: (v: string) => void
  showBijouDropdown: boolean
  setShowBijouDropdown: (v: boolean) => void
  bijouRef: React.RefObject<HTMLDivElement | null>
  filteredBijoux: Article[]
  calculatedReste: number
}

export function CommandeClientModal({
  isOpen,
  onClose,
  editing,
  form,
  setField,
  clients,
  modalError,
  setModalError,
  onSubmit,
  selectedBijoux,
  addBijou,
  removeBijou,
  updateBijouQty,
  bijouSearch,
  setBijouSearch,
  bijouCategoryFilter,
  setBijouCategoryFilter,
  showBijouDropdown,
  setShowBijouDropdown,
  bijouRef,
  filteredBijoux,
  calculatedReste,
}: CommandeClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Modifier la Commande n° ${editing.id}` : "Enregistrer une commande client"}
      description={editing ? "Mettez à jour les informations et le statut de cette commande." : "Saisissez les détails de la commande personnalisée d'un client."}
      className="sm:max-w-xl"
      errorMessage={modalError}
      errorType="error"
      onErrorClose={() => setModalError(null)}
      footer={
        <>
          <Button
            type="submit"
            form="order-form"
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
      <form id="order-form" onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* SECTION: Client et Description */}
          <div className={styles.formSectionTitle}>Client & Description</div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sélectionner un client *</label>
            <select
              className={styles.formSelect}
              value={form.client_id}
              onChange={(e) => setField("client_id", e.target.value)}
              required
            >
              <option value="">-- Choisir un client dans la liste --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.nom} ({c.telephone || "Pas de numéro"})</option>
              ))}
            </select>
          </div>

          {/* Multi-Bijou Selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Bijoux du catalogue (optionnel)</label>
            <div ref={bijouRef} className={styles.catalogPicker}>
              <div className={styles.catalogControls}>
                <input
                  className={styles.formInput}
                  placeholder="Rechercher un bijou à ajouter..."
                  value={bijouSearch}
                  onFocus={() => setShowBijouDropdown(true)}
                  onChange={(e) => { setBijouSearch(e.target.value); setShowBijouDropdown(true) }}
                />
                <select
                  className={styles.formSelect}
                  value={bijouCategoryFilter}
                  onChange={(e) => {
                    setBijouCategoryFilter(e.target.value)
                    setShowBijouDropdown(true)
                  }}
                  onFocus={() => setShowBijouDropdown(true)}
                >
                  <option value="all">Toutes les catégories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              {showBijouDropdown && (
                <div className={styles.catalogDropdown}>
                  {filteredBijoux.length === 0 ? (
                    <div style={{ padding: "0.75rem 1rem", color: "#71717a", fontSize: "0.82rem" }}>Aucun bijou trouvé.</div>
                  ) : (
                    filteredBijoux.map((art) => {
                      const stock = getArticleStock(art)
                      const alreadyIn = selectedBijoux.some((i) => i.article.id === art.id)
                      const outOfStock = stock <= 0
                      return (
                        <div
                          key={art.id}
                          onClick={() => !outOfStock && addBijou(art)}
                          className={[
                            styles.catalogOption,
                            alreadyIn ? styles.catalogOptionSelected : "",
                            outOfStock ? styles.catalogOptionDisabled : "",
                          ].filter(Boolean).join(" ")}
                        >
                          <div className={styles.catalogOptionText}>
                            <span className={styles.catalogOptionName}>{art.nom}</span>
                            <span className={styles.catalogOptionMeta}>
                              {[
                                art.categorie && art.categorie.replace("_", " "),
                                art.reference && `Réf: ${art.reference}`,
                                art.matiere || art.type_metal,
                                art.prix_vente && `${art.prix_vente?.toLocaleString("fr-DZ")} DA`,
                                `Stock: ${stock}`,
                              ].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          {outOfStock
                            ? <span className={`${styles.catalogPill} ${styles.catalogPillDanger}`}>Rupture</span>
                            : alreadyIn
                              ? <span className={`${styles.catalogPill} ${styles.catalogPillSuccess}`}>+1</span>
                              : <span className={styles.catalogPill}>Ajouter</span>
                          }
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart — selected bijoux */}
          {selectedBijoux.length > 0 && (
            <div className={styles.catalogCart}>
              {selectedBijoux.map((item) => (
                <div key={item.article.id} className={styles.catalogCartItem}>
                  <div className={styles.catalogCartInfo}>
                    <div className={styles.catalogCartName}>
                      {item.article.nom}
                      {item.article.reference && <span style={{ color: "#71717a", fontWeight: 400 }}> — {item.article.reference}</span>}
                    </div>
                    {item.article.prix_vente && (
                      <div className={styles.catalogCartMeta}>
                        {item.article.prix_vente.toLocaleString("fr-DZ")} DA × {item.qty} = {(item.article.prix_vente * item.qty).toLocaleString("fr-DZ")} DA
                        {" · "}Stock: {getArticleStock(item.article)}
                      </div>
                    )}
                  </div>
                  {/* Qty stepper */}
                  <div className={styles.qtyStepper}>
                    <button type="button" onClick={() => updateBijouQty(item.article.id, item.qty - 1)}
                      style={{ width: 24, height: 24, borderRadius: "4px", border: "1px solid #d4d4d8", background: "white", cursor: "pointer", fontSize: "1rem", lineHeight: 1, color: "#52525b" }}>−</button>
                    <span style={{ minWidth: "1.5rem", textAlign: "center", fontWeight: 700, fontSize: "0.875rem" }}>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateBijouQty(item.article.id, item.qty + 1)}
                      disabled={item.qty >= getArticleStock(item.article)}
                      style={{ width: 24, height: 24, borderRadius: "4px", border: "1px solid #d4d4d8", background: "white", cursor: item.qty >= getArticleStock(item.article) ? "not-allowed" : "pointer", opacity: item.qty >= getArticleStock(item.article) ? 0.4 : 1, fontSize: "1rem", lineHeight: 1, color: "#52525b" }}
                    >+</button>
                  </div>
                  <button type="button" onClick={() => removeBijou(item.article.id)}
                    className={styles.catalogRemoveButton}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {/* Cart total */}
              <div className={styles.catalogCartTotal}>
                <span>{selectedBijoux.reduce((acc, i) => acc + i.qty, 0)} pièce(s)</span>
                <span>{selectedBijoux.reduce((acc, i) => acc + (i.article.prix_vente || 0) * i.qty, 0).toLocaleString("fr-DZ")} DA</span>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description *</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Ex: Bague argent, taille 54, gravure intérieure 'A&M'..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              required
            />
          </div>

          {/* SECTION: Prix & Quantités */}
          <div className={styles.formSectionTitle}>Prix & Quantités</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantité totale *</label>
              <input
                type="number"
                min="1"
                className={styles.formInput}
                value={form.quantite}
                onChange={(e) => setField("quantite", e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prix total (DA) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.formInput}
                value={form.prix_total}
                onChange={(e) => setField("prix_total", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Acompte versé (DA) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.formInput}
                value={form.avance}
                onChange={(e) => setField("avance", e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reste à payer (Calculé)</label>
              <div style={{
                height: "42px",
                padding: "0 0.875rem",
                borderRadius: "8px",
                border: "1px solid #d4d4d8",
                backgroundColor: "#f4f4f5",
                fontSize: "0.875rem",
                color: "#71717a",
                display: "flex",
                alignItems: "center",
                fontWeight: 600
              }}>
                {calculatedReste.toLocaleString("fr-DZ")} DA
              </div>
            </div>
          </div>

          {/* SECTION: Statut & Dates */}
          <div className={styles.formSectionTitle}>Statut & Planification</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Statut</label>
              <select
                className={styles.formSelect}
                value={form.statut}
                onChange={(e) => setField("statut", e.target.value)}
              >
                <option value="en_cours">En cours de fabrication</option>
                <option value="pret">Prête / En boutique</option>
                <option value="livre">Livrée & payée</option>
                <option value="annule">Annulée</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date de livraison prévue</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date_livraison}
                onChange={(e) => setField("date_livraison", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes / Remarques</label>
            <input
              className={styles.formInput}
              placeholder="Détails supplémentaires..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>

        </div>
      </form>
    </Modal>
  )
}

export type DeleteCommandeClientModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  deleteError: string | null
  onErrorClose: () => void
}

export function DeleteCommandeClientModal({
  isOpen,
  onClose,
  onDelete,
  deleteError,
  onErrorClose,
}: DeleteCommandeClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer la commande"
      description="Cette action est irréversible. La commande client sera définitivement supprimée."
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
        Êtes-vous sûr de vouloir supprimer cette commande client ? Elle ne pourra pas être restaurée.
      </p>
    </Modal>
  )
}
