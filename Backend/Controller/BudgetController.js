const { Budget } = require("../Model");

// GET /api/budget
const getAllDepenses = async (req, res) => {
  try {
    const depenses = await Budget.findAll({ order: [["date_depense", "DESC"]] });
    res.json(depenses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/budget/stats — total par catégorie
const getStats = async (req, res) => {
  try {
    const { Op, fn, col, literal } = require("sequelize");
    const stats = await Budget.findAll({
      attributes: [
        "categorie",
        [fn("SUM", col("montant")), "total"],
        [fn("COUNT", col("id")), "nb_depenses"],
      ],
      group: ["categorie"],
      order: [[literal("total"), "DESC"]],
    });
    const totalGeneral = await Budget.sum("montant");
    res.json({ stats, totalGeneral: totalGeneral || 0 });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/budget/:id
const getDepenseById = async (req, res) => {
  try {
    const depense = await Budget.findByPk(req.params.id);
    if (!depense) return res.status(404).json({ message: "Dépense introuvable." });
    res.json(depense);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/budget
const createDepense = async (req, res) => {
  try {
    const { categorie, description, montant, date_depense, notes } = req.body;
    const depense = await Budget.create({ categorie, description, montant, date_depense, notes });
    res.status(201).json(depense);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// PUT /api/budget/:id
const updateDepense = async (req, res) => {
  try {
    const depense = await Budget.findByPk(req.params.id);
    if (!depense) return res.status(404).json({ message: "Dépense introuvable." });
    await depense.update(req.body);
    res.json(depense);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE /api/budget/:id
const deleteDepense = async (req, res) => {
  try {
    const depense = await Budget.findByPk(req.params.id);
    if (!depense) return res.status(404).json({ message: "Dépense introuvable." });
    await depense.destroy();
    res.json({ message: "Dépense supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = { getAllDepenses, getDepenseById, getStats, createDepense, updateDepense, deleteDepense };
