const { sequelize, Commande, CommandeLigne, Article, Portefeuille, PortefeuilleLog } = require("../Model");

const getPortefeuille = async (transaction) => {
  const [portefeuille] = await Portefeuille.findOrCreate({
    where: { id: 1 },
    defaults: { solde: 0, label: "Caisse principale" },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  return portefeuille;
};

// GET /api/commandes
const getAllCommandes = async (req, res) => {
  try {
    const commandes = await Commande.findAll({
      order: [["date_commande", "DESC"]],
      include: [{ model: CommandeLigne, as: "CommandeLignes" }],
    });
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/commandes/:id
const getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [{ model: CommandeLigne, as: "CommandeLignes" }],
    });
    if (!commande) return res.status(404).json({ message: "Commande introuvable." });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/commandes
const createCommande = async (req, res) => {
  try {
    const { reference, fournisseur, description, quantite, prix_unitaire, statut, date_commande, date_reception, notes } = req.body;
    const prix_total = (parseFloat(prix_unitaire) || 0) * (parseInt(quantite) || 1);
    const commande = await Commande.create({
      reference, fournisseur, description, quantite, prix_unitaire, prix_total,
      statut, date_commande, date_reception, notes,
    });
    res.status(201).json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};

const createCommandeWithBudget = async (req, res) => {
  try {
    const {
      type_commande,
      description,
      quantite,
      poids,
      prix_unitaire,
      prix_total,
      statut,
      date_achat,
      date_commande,
      date_reception,
      notes,
    } = req.body;

    const qte = parseInt(quantite) || 0;
    const prixUnitaire = parseFloat(prix_unitaire) || 0;
    const prixTotal = parseFloat(prix_total) || 0;

    // Note: Le débit du portefeuille se fera lors du passage en statut "arrivee"
    // via l'endpoint PUT /api/commandes/:id/arrivee

    const commande = await Commande.create({
      type_commande,
      description,
      quantite: qte,
      poids,
      prix_unitaire: prixUnitaire,
      prix_total: prixTotal,
      statut: statut || "en_attente",
      date_achat,
      date_commande,
      date_reception,
      notes,
    });

    res.status(201).json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la creation", error: error.message });
  }
};

// PUT /api/commandes/:id
const updateCommande = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id);
    if (!commande) return res.status(404).json({ message: "Commande introuvable." });

    const { quantite, prix_unitaire } = req.body;
    const prix_total = quantite && prix_unitaire
      ? (parseFloat(prix_unitaire) * parseInt(quantite))
      : commande.prix_total;

    await commande.update({ ...req.body, prix_total });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE /api/commandes/:id
const deleteCommande = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const commande = await Commande.findByPk(req.params.id, { transaction });
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ message: "Commande introuvable." });
    }

    // Si la commande a un mouvement de caisse associé, le supprimer et ajuster le solde
    if (commande.portefeuille_debit_log_id) {
      const log = await PortefeuilleLog.findByPk(commande.portefeuille_debit_log_id, { transaction });
      if (log) {
        const portefeuille = await getPortefeuille(transaction);
        const solde_actuel = parseFloat(portefeuille.solde);
        
        // Si c'était un débit, on le remet dans le solde
        if (log.type === "debit") {
          const nouveau_solde = +(solde_actuel + parseFloat(log.montant)).toFixed(2);
          await portefeuille.update({ solde: nouveau_solde }, { transaction });
        }
        
        await log.destroy({ transaction });
      }
    }

    await commande.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Commande supprimée avec succès." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

// PUT /api/commandes/:id/arrivee
const marquerCommandeArrivee = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [{ model: CommandeLigne, as: "CommandeLignes" }],
      transaction,
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ message: "Commande introuvable." });
    }

    if (commande.statut === "arrivee") {
      await transaction.rollback();
      return res.status(400).json({ message: "Cette commande est déjà marquée comme arrivée." });
    }

    if (commande.stock_applique) {
      await transaction.rollback();
      return res.status(400).json({ message: "Le stock a déjà été appliqué pour cette commande." });
    }

    const lignes = await CommandeLigne.findAll({
      where: { commande_id: commande.id },
      transaction,
    });

    if (lignes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Cette commande n'a aucune ligne." });
    }

    // Calculer le total de la commande
    const prix_total = lignes.reduce((sum, ligne) => sum + parseFloat(ligne.prix_total), 0);

    // Débiter le portefeuille
    const portefeuille = await getPortefeuille(transaction);
    const solde_avant = parseFloat(portefeuille.solde);

    if (prix_total > solde_avant) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Solde budget insuffisant pour cette commande fournisseur.",
        solde_actuel: solde_avant,
        montant_commande: prix_total,
      });
    }

    const solde_apres = +(solde_avant - prix_total).toFixed(2);

    // Créer le log de débit
    const portefeuilleLog = await PortefeuilleLog.create({
      portefeuille_id: portefeuille.id,
      type: "debit",
      montant: prix_total,
      description: `Commande fournisseur`,
      solde_avant,
      solde_apres,
      categorie: "achat",
      notes: commande.notes,
    }, { transaction });

    // Mettre à jour le solde du portefeuille
    await portefeuille.update({ solde: solde_apres }, { transaction });

    // Traiter chaque ligne de commande
    for (const ligne of lignes) {
      if (ligne.article_id) {
        // Article existant: mettre à jour le stock
        const article = await Article.findByPk(ligne.article_id, { transaction });
        if (article) {
          const nouveauStock = parseInt(article.stock) + parseInt(ligne.quantite);
          await article.update(
            { 
              stock: nouveauStock,
              prix_achat: ligne.prix_achat_unitaire, // Mettre à jour le prix d'achat actuel
            },
            { transaction }
          );
        }
      } else {
        // Nouvel article: le créer
        const nouvelArticle = await Article.create({
          nom: ligne.nom,
          description: ligne.description,
          categorie: ligne.categorie,
          matiere: ligne.matiere,
          matiere_detail: ligne.matiere_detail,
          mchelel: ligne.mchelel,
          mchelel_detail: ligne.mchelel_detail,
          a_des_pierres: ligne.a_des_pierres || false,
          type_pierres: ligne.a_des_pierres ? ligne.type_pierres : [],
          pierres_detail: ligne.pierres_detail,
          poids: ligne.poids,
          prix_achat: ligne.prix_achat_unitaire,
          prix_vente: ligne.prix_vente,
          stock: ligne.quantite,
        }, { transaction });

        // Lier la ligne à l'article créé
        await ligne.update({ article_cree_id: nouvelArticle.id }, { transaction });
      }
    }

    // Mettre à jour la commande
    await commande.update({
      statut: "arrivee",
      portefeuille_debit_log_id: portefeuilleLog.id,
      stock_applique: true,
      date_reception: req.body.date_reception || new Date(),
    }, { transaction });

    await transaction.commit();

    // Récupérer la commande mise à jour avec ses lignes
    const commandeMiseAJour = await Commande.findByPk(req.params.id, {
      include: [{ model: CommandeLigne, as: "CommandeLignes" }],
    });

    res.json(commandeMiseAJour);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Erreur lors du marquage comme arrivée", error: error.message });
  }
};

module.exports = {
  getAllCommandes,
  getCommandeById,
  createCommande: createCommandeWithBudget,
  updateCommande,
  deleteCommande,
  marquerCommandeArrivee,
};
