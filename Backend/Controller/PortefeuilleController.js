const { Portefeuille, PortefeuilleLog } = require("../Model");

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPortefeuille = async () => {
  const [p] = await Portefeuille.findOrCreate({
    where: { id: 1 },
    defaults: { solde: 0, label: "Caisse principale" },
  });
  return p;
};

// GET /api/portefeuille — solde actuel
const getSolde = async (req, res) => {
  try {
    const portefeuille = await getPortefeuille();
    res.json(portefeuille);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/portefeuille/logs — historique complet
const getLogs = async (req, res) => {
  try {
    const logs = await PortefeuilleLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: parseInt(req.query.limit) || 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/portefeuille/credit — ajouter de l'argent
const credit = async (req, res) => {
  try {
    const { montant, description, categorie, notes } = req.body;
    if (!montant || parseFloat(montant) <= 0)
      return res.status(400).json({ message: "Montant invalide." });

    const portefeuille = await getPortefeuille();
    const solde_avant = parseFloat(portefeuille.solde);
    const solde_apres = +(solde_avant + parseFloat(montant)).toFixed(2);

    await portefeuille.update({ solde: solde_apres });

    const log = await PortefeuilleLog.create({
      portefeuille_id: portefeuille.id,
      type: "credit",
      montant: parseFloat(montant),
      description: description || "Crédit manuel",
      solde_avant,
      solde_apres,
      categorie: categorie || "autre",
      notes,
    });

    res.status(201).json({ portefeuille: { ...portefeuille.toJSON(), solde: solde_apres }, log });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/portefeuille/debit — retirer de l'argent
const debit = async (req, res) => {
  try {
    const { montant, description, categorie, notes } = req.body;
    if (!montant || parseFloat(montant) <= 0)
      return res.status(400).json({ message: "Montant invalide." });

    const portefeuille = await getPortefeuille();
    const solde_avant = parseFloat(portefeuille.solde);

    if (parseFloat(montant) > solde_avant)
      return res.status(400).json({ message: "Solde insuffisant.", solde_actuel: solde_avant });

    const solde_apres = +(solde_avant - parseFloat(montant)).toFixed(2);

    await portefeuille.update({ solde: solde_apres });

    const log = await PortefeuilleLog.create({
      portefeuille_id: portefeuille.id,
      type: "debit",
      montant: parseFloat(montant),
      description: description || "Débit manuel",
      solde_avant,
      solde_apres,
      categorie: categorie || "autre",
      notes,
    });

    res.status(201).json({ portefeuille: { ...portefeuille.toJSON(), solde: solde_apres }, log });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// DELETE /api/portefeuille/logs/:id — supprimer un log (et annule l'opération sur le solde)
const deleteLog = async (req, res) => {
  try {
    const log = await PortefeuilleLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ message: "Log introuvable." });

    // Annulation : on inverse l'opération sur le solde
    const portefeuille = await getPortefeuille();
    const solde_actuel = parseFloat(portefeuille.solde);
    let nouveau_solde;

    if (log.type === "credit") {
      nouveau_solde = +(solde_actuel - parseFloat(log.montant)).toFixed(2);
    } else {
      nouveau_solde = +(solde_actuel + parseFloat(log.montant)).toFixed(2);
    }

    await portefeuille.update({ solde: nouveau_solde });
    await log.destroy();

    res.json({ message: "Log supprimé et opération annulée.", nouveau_solde });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { getSolde, getLogs, credit, debit, deleteLog };
