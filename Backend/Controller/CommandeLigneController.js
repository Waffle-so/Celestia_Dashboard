const { CommandeLigne, Article, Commande } = require("../Model");

// Fonction pour recalculer le prix_total d'une commande à partir de ses lignes
const recalculateCommandeTotal = async (commandeId) => {
  try {
    const lignes = await CommandeLigne.findAll({
      where: { commande_id: commandeId },
      raw: true
    });
    const prix_total = lignes.reduce((sum, ligne) => sum + parseFloat(ligne.prix_total || 0), 0);
    await Commande.update({ prix_total }, { where: { id: commandeId } });
  } catch (error) {
    console.error("Erreur lors du recalcul du prix_total de la commande:", error);
  }
};

// GET /api/commandes/:commandeId/lignes
const getLignesByCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const lignes = await CommandeLigne.findAll({
      where: { commande_id: commandeId },
      include: [
        { model: Article, as: "article" },
        { model: Article, as: "articleCree" },
      ],
    });
    res.json(lignes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/commandes-lignes/:id
const getLigneById = async (req, res) => {
  try {
    const ligne = await CommandeLigne.findByPk(req.params.id, {
      include: [
        { model: Article, as: "article" },
        { model: Article, as: "articleCree" },
      ],
    });
    if (!ligne) return res.status(404).json({ message: "Ligne introuvable." });
    res.json(ligne);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/commandes-lignes
const createLigne = async (req, res) => {
  try {
    const {
      commande_id,
      article_id,
      nom,
      description,
      categorie,
      collection_id,
      matiere,
      matiere_detail,
      mchelel,
      mchelel_detail,
      a_des_pierres,
      type_pierres,
      pierres_detail,
      poids,
      quantite,
      prix_achat_unitaire,
      prix_vente,
    } = req.body;

    const prix_total = (parseFloat(prix_achat_unitaire) || 0) * (parseInt(quantite) || 1);

    const ligne = await CommandeLigne.create({
      commande_id,
      article_id: article_id || null,
      nom,
      description,
      categorie,
      collection_id: collection_id || null,
      matiere,
      matiere_detail,
      mchelel,
      mchelel_detail,
      a_des_pierres: a_des_pierres || false,
      type_pierres: a_des_pierres ? type_pierres : [],
      pierres_detail,
      poids,
      quantite,
      prix_achat_unitaire,
      prix_vente,
      prix_total,
    });

    // Recalculer le prix_total de la commande
    await recalculateCommandeTotal(commande_id);

    res.status(201).json(ligne);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};


// DELETE /api/commandes-lignes/:id
const deleteLigne = async (req, res) => {
  try {
    const ligne = await CommandeLigne.findByPk(req.params.id);
    if (!ligne) return res.status(404).json({ message: "Ligne introuvable." });

    const commandeId = ligne.commande_id;
    await ligne.destroy();

    // Recalculer le prix_total de la commande
    await recalculateCommandeTotal(commandeId);

    res.json({ message: "Ligne supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = {
  getLignesByCommande,
  getLigneById,
  createLigne,
  deleteLigne,
};
