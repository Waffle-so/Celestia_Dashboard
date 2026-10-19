"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import styles from "../../Style/Clients.module.css"
import wilayasData from "../wilayas.json"
import { type Client, type ClientFormState } from "./actions"

export type ClientModalProps = {
  isOpen: boolean
  onClose: () => void
  editing: Client | null
  form: ClientFormState
  setField: (k: string, v: string) => void
  modalError: string | null
  setModalError: (err: string | null) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ClientModal({
  isOpen,
  onClose,
  editing,
  form,
  setField,
  modalError,
  setModalError,
  onSubmit,
}: ClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Modifier : ${editing.nom}` : "Créer une fiche client"}
      description={editing ? "Mettez à jour les coordonnées de ce client." : "Saisissez les coordonnées du client pour le suivi de ses commandes."}
      className="sm:max-w-xl"
      errorMessage={modalError}
      errorType="error"
      onErrorClose={() => setModalError(null)}
      footer={
        <>
          <Button
            type="submit"
            form="client-form"
            style={{ borderRadius: "8px", backgroundColor: "#18181b", color: "white" }}
          >
            {editing ? "Enregistrer les modifications" : "Créer la fiche"}
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
      <form id="client-form" onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* SECTION: Identité */}
          <div className={styles.formSectionTitle}>Identité</div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nom complet *</label>
            <input
              className={styles.formInput}
              placeholder="Ex: Amine Brahimi"
              value={form.nom}
              onChange={(e) => setField("nom", e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Téléphone</label>
              <input
                className={styles.formInput}
                placeholder="Ex: 0550 123 456"
                value={form.telephone}
                onChange={(e) => setField("telephone", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                className={styles.formInput}
                placeholder="client@mail.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
          </div>

          {/* SECTION: Adresse */}
          <div className={styles.formSectionTitle}>Localisation</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Wilaya</label>
              <select
                className={styles.formSelect}
                value={form.wilaya}
                onChange={(e) => setField("wilaya", e.target.value)}
              >
                <option value="">-- Choisir une wilaya --</option>
                {wilayasData.map((w) => (
                  <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Adresse</label>
              <input
                className={styles.formInput}
                placeholder="Adresse précise..."
                value={form.adresse}
                onChange={(e) => setField("adresse", e.target.value)}
              />
            </div>
          </div>

          {/* SECTION: Notes */}
          <div className={styles.formSectionTitle}>Notes & Préférences</div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes / Remarques</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Tailles de doigt, préférences, allergies métal..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>

        </div>
      </form>
    </Modal>
  )
}

export type DeleteClientModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  deleteError: string | null
  onErrorClose: () => void
}

export function DeleteClientModal({
  isOpen,
  onClose,
  onDelete,
  deleteError,
  onErrorClose,
}: DeleteClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer le client"
      description="Cette action est irréversible. Le client et toutes ses commandes associées seront définitivement supprimés."
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
        Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses commandes associées seront également supprimées.
      </p>
    </Modal>
  )
}
