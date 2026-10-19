"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/Modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  operationType: "credit" | "debit"
  modalError: string | null
  setModalError: (err: string | null) => void
  montant: string
  setMontant: (val: string) => void
  description: string
  setDescription: (val: string) => void
  categorie: string
  setCategorie: (val: string) => void
  notes: string
  setNotes: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function TransactionModal({
  isOpen,
  onClose,
  operationType,
  modalError,
  setModalError,
  montant,
  setMontant,
  description,
  setDescription,
  categorie,
  setCategorie,
  notes,
  setNotes,
  onSubmit,
}: TransactionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={operationType === "credit" ? "Ajouter des fonds" : "Retirer des fonds"}
      description="Saisissez les détails de l'opération financière pour mettre à jour la caisse."
      errorMessage={modalError}
      errorType="error"
      onErrorClose={() => setModalError(null)}
      footer={
        <>
          <Button
            type="submit"
            form="transaction-form"
            className={`rounded-[8px] border-none font-medium px-6 ${
              operationType === "credit"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            Confirmer l&apos;opération
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800 rounded-[8px] font-medium"
          >
            Annuler
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="montant" className="text-sm font-medium text-zinc-700">Montant (DA)</Label>
          <Input
            id="montant"
            type="number"
            placeholder="0.00"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium text-zinc-700">Description / Libellé</Label>
          <Input
            id="description"
            placeholder="Ex: Vente bague or, achat packaging..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categorie" className="text-sm font-medium text-zinc-700">Catégorie</Label>
          <Select value={categorie} onValueChange={(val) => setCategorie(val || "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {operationType === "credit" ? (
                <>
                  <SelectItem value="vente">Vente client</SelectItem>
                  <SelectItem value="autre">Autre apport</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="achat">Achat matières</SelectItem>
                  <SelectItem value="publicite">Publicité / Ads</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="salaire">Salaire</SelectItem>
                  <SelectItem value="loyer">Loyer</SelectItem>
                  <SelectItem value="autre">Autre dépense</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm font-medium text-zinc-700">Notes (Optionnel)</Label>
          <Input
            id="notes"
            placeholder="Remarques complémentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  )
}
