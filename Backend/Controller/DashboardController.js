const {
  Commande,
  CommandeClient,
  Client,
  Article,
  Budget,
  Portefeuille,
  PortefeuilleLog,
  sequelize,
} = require("../Model");
const { Op, fn, col, literal } = require("sequelize");

// GET /api/dashboard — toutes les stats en une seule requête
const getStats = async (req, res) => {
  try {
    // ── Portefeuille ───────────────────────────────────────────────────────
    const portefeuille = await Portefeuille.findByPk(1);
    const solde_actuel = parseFloat(portefeuille?.solde || 0);

    // ── Commandes fournisseur ──────────────────────────────────────────────
    const totalCommandes       = await Commande.count();
    const commandesEnAttente   = await Commande.count({ where: { statut: "en_attente" } });
    const commandesRecues      = await Commande.count({ where: { statut: "arrivee" } });
    const montantTotalCommandes = (await Commande.sum("prix_total")) || 0;
    const totalAchats          = (await Commande.sum("prix_total", { where: { statut: "arrivee" } })) || 0;

    // ── Commandes clients ──────────────────────────────────────────────────
    const totalCommandesClients  = await CommandeClient.count();
    const commandesEnCours       = await CommandeClient.count({ where: { statut: "en_cours" } });
    const commandesPret          = await CommandeClient.count({ where: { statut: "pret" } });
    const commandesLivrees       = await CommandeClient.count({ where: { statut: "livre" } });
    const resteAEncaisser        = (await CommandeClient.sum("reste")) || 0;
    const totalEncaisse          = (await CommandeClient.sum("avance")) || 0;
    const totalVentes            = (await CommandeClient.sum("prix_total", { where: { statut: "livre" } })) || 0;

    // ── Articles / stock ───────────────────────────────────────────────────
    const totalArticles     = await Article.count();
    const articlesEnStock   = (await Article.sum("stock")) || 0;

    const rawValeurStock = await Article.findOne({
      attributes: [
        [fn("SUM", literal('"prix_vente" * "stock"')), "valeur_stock"]
      ],
      raw: true
    });
    const valeurStock       = parseFloat(rawValeurStock?.valeur_stock || 0);

    // Total prix d'achat des articles en stock (stock > 0 uniquement — pas de rupture)
    const rawPrixAchatStock = await Article.findOne({
      attributes: [
        [fn("SUM", literal('"prix_achat" * "stock"')), "prix_achat_stock"]
      ],
      where: { stock: { [Op.gt]: 0 } },
      raw: true
    });
    const totalPrixAchatStock = parseFloat(rawPrixAchatStock?.prix_achat_stock || 0);

    // Argent total possédé (stock + portefeuille)
    const argentTotalPossede = totalPrixAchatStock + solde_actuel;

    const stockFaible       = await Article.count({ where: { stock: { [Op.lte]: 3 } } }); // alertes stock bas

    // ── Clients ────────────────────────────────────────────────────────────
    const totalClients = await Client.count();

    // ── Budget / dépenses générales ────────────────────────────────────────
    // IMPORTANT : on exclut la catégorie "achat_matiere" car les achats fournisseurs
    // sont déjà trackés dans la table Commande — évite le double comptage.
    const categoriesGenerales = { [Op.notIn]: ["achat_matiere"] };
    const totalDepenses = (await Budget.sum("montant", { where: { categorie: categoriesGenerales } })) || 0;
    const depensesParCategorie = await Budget.findAll({
      attributes: ["categorie", [fn("SUM", col("montant")), "total"]],
      where: { categorie: categoriesGenerales },
      group: ["categorie"],
      raw: true,
    });

    // ── Marge bénéficiaire ─────────────────────────────────────────────────
    // Marge = (Prix total des commandes clients livrées - Prix total achat des commandes clients livrées) - Dépenses générales
    const { period, dateFrom, dateTo } = req.query;
    let whereClause = { statut: "livre" };
    let depensesWhereClause = {};

    // Filtrer par période si spécifié
    if (period === "today") {
      const today = new Date().toISOString().split('T')[0];
      whereClause.date_livraison = { [Op.eq]: today };
      depensesWhereClause.date_depense = { [Op.eq]: today };
    } else if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      whereClause.date_livraison = { [Op.gte]: weekAgo.toISOString().split('T')[0] };
      depensesWhereClause.date_depense = { [Op.gte]: weekAgo.toISOString().split('T')[0] };
    } else if (period === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      whereClause.date_livraison = { [Op.gte]: monthAgo.toISOString().split('T')[0] };
      depensesWhereClause.date_depense = { [Op.gte]: monthAgo.toISOString().split('T')[0] };
    } else if (dateFrom && dateTo) {
      whereClause.date_livraison = { [Op.between]: [dateFrom, dateTo] };
      depensesWhereClause.date_depense = { [Op.between]: [dateFrom, dateTo] };
    }

    const commandesClientsLivreesForMarge = await CommandeClient.findAll({
      attributes: ["prix_total", "prix_total_achat"],
      where: whereClause,
      raw: true
    });

    const totalVentesLivrees = commandesClientsLivreesForMarge.reduce((sum, cmd) => sum + parseFloat(cmd.prix_total || 0), 0);
    const totalAchatLivrees = commandesClientsLivreesForMarge.reduce((sum, cmd) => sum + parseFloat(cmd.prix_total_achat || 0), 0);

    // Filtrer les dépenses générales selon la même période (toujours sans achat_matiere)
    let totalDepensesFiltered = totalDepenses;
    if (Object.keys(depensesWhereClause).length > 0) {
      totalDepensesFiltered = (await Budget.sum("montant", {
        where: { ...depensesWhereClause, categorie: categoriesGenerales }
      })) || 0;
    }

    const margeBeneficiaire = totalVentesLivrees - totalAchatLivrees - totalDepensesFiltered;

    // ── ROI Global ─────────────────────────────────────────────────────────
    // ROI = (Bénéfice Net / Total investi fournisseurs) × 100
    // On utilise totalAchats (commandes fournisseur arrivées) comme base d'investissement
    const roiGlobal = totalAchats > 0 ? ((margeBeneficiaire / totalAchats) * 100) : 0;

    // ── Derniers mouvements portefeuille (5 derniers) ──────────────────────
    const derniersLogs = await PortefeuilleLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });

    // ── Commandes clients récentes (5 dernières) ───────────────────────────
    const dernieresCommandesClients = await CommandeClient.findAll({
      include: [{ model: Client, attributes: ["nom", "telephone"] }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    res.json({
      portefeuille: { solde_actuel },
      commandes_fournisseur: {
        total: totalCommandes,
        en_attente: commandesEnAttente,
        recues: commandesRecues,
        montant_total: montantTotalCommandes,
      },
      commandes_clients: {
        total: totalCommandesClients,
        en_cours: commandesEnCours,
        pret: commandesPret,
        livrees: commandesLivrees,
        reste_a_encaisser: resteAEncaisser,
        total_encaisse: totalEncaisse,
      },
      articles: {
        total: totalArticles,
        unites_en_stock: articlesEnStock,
        valeur_stock: valeurStock,
        total_prix_achat: totalPrixAchatStock,
        alertes_stock_faible: stockFaible,
      },
      argent_total_possede: argentTotalPossede,
      clients: { total: totalClients },
      budget: {
        total_depenses: totalDepenses,
        par_categorie: depensesParCategorie,
      },
      marge_beneficiaire: margeBeneficiaire,
      roi_global: parseFloat(roiGlobal.toFixed(2)),
      total_investi_fournisseurs: totalAchats,
      derniers_logs: derniersLogs,
      dernieres_commandes_clients: dernieresCommandesClients,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// GET /api/dashboard/profits-by-date — bénéfices par date
const getProfitsByDate = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysCount = days === "all" ? null : parseInt(days) || 30;
    const startDate = daysCount ? new Date() : null;
    if (startDate) {
      startDate.setDate(startDate.getDate() - daysCount);
    }

    // Récupérer les commandes clients livrées avec date_livraison
    const commandesClientsLivrees = await CommandeClient.findAll({
      attributes: ["id", "prix_total", "date_livraison", "date_commande"],
      where: {
        statut: "livre"
      },
      raw: true
    });

    // Récupérer les commandes fournisseurs arrivées avec date_reception
    const commandesFournisseursArrivees = await Commande.findAll({
      attributes: ["id", "prix_total", "date_reception", "date_commande"],
      where: {
        statut: "arrivee"
      },
      raw: true
    });

    // Récupérer les dépenses générales
    const depenses = await Budget.findAll({
      attributes: ["id", "montant", "date_depense"],
      raw: true
    });

    // Créer un map pour stocker les données par date
    const profitsByDate = {};

    // Trouver la date la plus ancienne parmi toutes les données si "all"
    let minDate = startDate;
    if (!minDate) {
      const allDates = [
        ...commandesClientsLivrees.map(c => c.date_livraison || c.date_commande),
        ...commandesFournisseursArrivees.map(c => c.date_reception || c.date_commande),
        ...depenses.map(d => d.date_depense)
      ].filter(d => d).sort();
      if (allDates.length > 0) {
        minDate = new Date(allDates[0]);
      } else {
        minDate = new Date();
      }
    }

    // Calculer le nombre de jours entre minDate et aujourd'hui
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - minDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Initialiser toutes les dates dans la période
    const actualDaysCount = daysCount || diffDays;
    for (let i = 0; i < actualDaysCount; i++) {
      const date = new Date(minDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      profitsByDate[dateStr] = {
        date: dateStr,
        ventes: 0,
        achats: 0,
        depenses: 0,
        benefice: 0
      };
    }

    // Ajouter les ventes (utiliser date_livraison si disponible, sinon date_commande)
    commandesClientsLivrees.forEach(cmd => {
      const dateStr = cmd.date_livraison || cmd.date_commande;
      if (dateStr && profitsByDate[dateStr]) {
        const prixTotal = parseFloat(cmd.prix_total) || 0;
        const prixAchat = parseFloat(cmd.prix_total_achat) || 0;
        profitsByDate[dateStr].ventes += prixTotal;
        profitsByDate[dateStr].achats += prixAchat;
      }
    });

    // Les achats sont déjà inclus dans prix_total_achat des commandes clients

    // Ajouter les dépenses
    depenses.forEach(dep => {
      if (dep.date_depense && profitsByDate[dep.date_depense]) {
        profitsByDate[dep.date_depense].depenses += parseFloat(dep.montant);
      }
    });

    // Calculer le bénéfice pour chaque date
    Object.values(profitsByDate).forEach(data => {
      data.benefice = data.ventes - data.achats - data.depenses;
    });

    // Convertir en tableau et trier par date
    const result = Object.values(profitsByDate).sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  getStats,
  getProfitsByDate,
};
