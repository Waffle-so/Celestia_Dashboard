const { sequelize, CommandeClient, Client, Article, Portefeuille, PortefeuilleLog } = require("../Model");

const getPortefeuille = async (transaction) => {
  const [portefeuille] = await Portefeuille.findOrCreate({
    where: { id: 1 },
    defaults: { solde: 0, label: "Caisse principale" },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  return portefeuille;
};

const creditCommandeClientIfDelivered = async (commande, transaction) => {
  if (commande.statut !== "livre" || commande.portefeuille_credit_log_id) return;

  const montant = parseFloat(commande.prix_total) || 0;
  if (montant <= 0) return;

  const portefeuille = await getPortefeuille(transaction);
  const solde_avant = parseFloat(portefeuille.solde);
  const solde_apres = +(solde_avant + montant).toFixed(2);

  await portefeuille.update({ solde: solde_apres }, { transaction });

  // Récupérer le client pour inclure son nom dans la description
  const client = await Client.findByPk(commande.client_id, { transaction });
  const clientNom = client ? client.nom : "Client inconnu";

  const log = await PortefeuilleLog.create({
    portefeuille_id: portefeuille.id,
    type: "credit",
    montant,
    description: `Commande client livrée - ${clientNom} #${commande.id}`,
    solde_avant,
    solde_apres,
    categorie: "vente",
    notes: commande.description,
  }, { transaction });

  await commande.update({ portefeuille_credit_log_id: log.id }, { transaction });
};

// GET /api/commandes-clients
const getAllCommandesClients = async (req, res) => {
  try {
    const commandes = await CommandeClient.findAll({
      include: [{ model: Client, attributes: ["id", "nom", "telephone"] }],
      order: [["date_commande", "DESC"]],
    });
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/commandes-clients/:id
const getCommandeClientById = async (req, res) => {
  try {
    const commande = await CommandeClient.findByPk(req.params.id, {
      include: [{ model: Client }],
    });
    if (!commande) return res.status(404).json({ message: "Commande introuvable." });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/commandes-clients
const createCommandeClient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { client_id, description, quantite, prix_total, avance, statut, date_commande, date_livraison, notes, articles } = req.body;
    const reste = (parseFloat(prix_total) || 0) - (parseFloat(avance) || 0);

    const lignes = Array.isArray(articles)
      ? articles
          .map((item) => ({
            id: parseInt(item.id ?? item.article_id, 10),
            qty: parseInt(item.qty ?? item.quantite, 10),
          }))
          .filter((item) => item.id && item.qty > 0)
      : [];

    const articlesToUpdate = [];
    let prix_vente_articles = 0;
    let prix_total_achat = 0;

    for (const ligne of lignes) {
      const article = await Article.findByPk(ligne.id, { transaction });
      if (!article) {
        await transaction.rollback();
        return res.status(404).json({ message: `Article introuvable (id: ${ligne.id}).` });
      }
      if (article.stock < ligne.qty) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour « ${article.nom} » : ${article.stock} disponible(s), ${ligne.qty} demandé(s).`,
        });
      }
      articlesToUpdate.push({ article, qty: ligne.qty });
      prix_vente_articles += parseFloat(article.prix_vente || 0) * ligne.qty;
      prix_total_achat += parseFloat(article.prix_achat || 0) * ligne.qty;
    }

    const commande = await CommandeClient.create(
      {
        client_id,
        description,
        quantite,
        prix_total,
        prix_vente_articles,
        prix_total_achat,
        avance,
        reste,
        statut,
        date_commande,
        date_livraison,
        notes,
      },
      { transaction }
    );

    for (const { article, qty } of articlesToUpdate) {
      await article.update({ stock: article.stock - qty }, { transaction });
    }

    await creditCommandeClientIfDelivered(commande, transaction);

    await transaction.commit();
    res.status(201).json(commande);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// PUT /api/commandes-clients/:id
const updateCommandeClient = async (req, res) => {
  try {
    const commande = await CommandeClient.findByPk(req.params.id);
    if (!commande) return res.status(404).json({ message: "Commande introuvable." });

    const prix_total = req.body.prix_total ?? commande.prix_total;
    const avance = req.body.avance ?? commande.avance;
    const reste = (parseFloat(prix_total) - parseFloat(avance)).toFixed(2);

    await commande.update({ ...req.body, reste });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

const updateCommandeClientWithWallet = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const commande = await CommandeClient.findByPk(req.params.id, { transaction });
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ message: "Commande introuvable." });
    }

    const prix_total = req.body.prix_total ?? commande.prix_total;
    const avance = req.body.avance ?? commande.avance;
    const reste = (parseFloat(prix_total) - parseFloat(avance)).toFixed(2);

    await commande.update({ ...req.body, reste }, { transaction });
    await creditCommandeClientIfDelivered(commande, transaction);

    await transaction.commit();
    res.json(commande);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: "Erreur lors de la mise a jour", error: error.message });
  }
};

// DELETE /api/commandes-clients/:id
const deleteCommandeClient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const commande = await CommandeClient.findByPk(req.params.id, { transaction });
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ message: "Commande introuvable." });
    }

    // Si la commande a un mouvement de caisse associé, le supprimer et ajuster le solde
    if (commande.portefeuille_credit_log_id) {
      const log = await PortefeuilleLog.findByPk(commande.portefeuille_credit_log_id, { transaction });
      if (log) {
        const portefeuille = await getPortefeuille(transaction);
        const solde_actuel = parseFloat(portefeuille.solde);
        
        // Si c'était un crédit, on le déduit du solde
        if (log.type === "credit") {
          const nouveau_solde = +(solde_actuel - parseFloat(log.montant)).toFixed(2);
          await portefeuille.update({ solde: nouveau_solde }, { transaction });
        }
        
        await log.destroy({ transaction });
      }
    }

    await commande.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Commande client supprimée avec succès." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = {
  getAllCommandesClients,
  getCommandeClientById,
  createCommandeClient,
  updateCommandeClient: updateCommandeClientWithWallet,
  deleteCommandeClient,
};
