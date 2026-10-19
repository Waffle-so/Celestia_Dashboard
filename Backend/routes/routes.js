const express = require("express");
const router = express.Router();

// ── Controllers ─────────────────────────────────────────────────────────────
const CommandeController = require("../Controller/CommandeController");
const CommandeLigneController = require("../Controller/CommandeLigneController");
const CommandeClientController = require("../Controller/CommandeClientController");
const ClientController = require("../Controller/ClientController");
const ArticleController = require("../Controller/ArticleController");
const BudgetController = require("../Controller/BudgetController");
const PortefeuilleController = require("../Controller/PortefeuilleController");
const DashboardController = require("../Controller/DashboardController");

/* =====================================================
   DASHBOARD
   ===================================================== */
router.get("/dashboard", DashboardController.getStats);
router.get("/dashboard/profits-by-date", DashboardController.getProfitsByDate);

/* =====================================================
   PORTEFEUILLE (Caisse / Wallet)
   ===================================================== */
router.get("/portefeuille", PortefeuilleController.getSolde);
router.get("/portefeuille/logs", PortefeuilleController.getLogs);
router.post("/portefeuille/credit", PortefeuilleController.credit);
router.post("/portefeuille/debit", PortefeuilleController.debit);
router.delete("/portefeuille/logs/:id", PortefeuilleController.deleteLog);

/* =====================================================
   COMMANDES FOURNISSEUR / ARTISAN
   ===================================================== */
router.get("/commandes", CommandeController.getAllCommandes);
router.get("/commandes/:id", CommandeController.getCommandeById);
router.post("/commandes", CommandeController.createCommande);
router.put("/commandes/:id", CommandeController.updateCommande);
router.delete("/commandes/:id", CommandeController.deleteCommande);
router.put("/commandes/:id/arrivee", CommandeController.marquerCommandeArrivee);

/* =====================================================
   LIGNES DE COMMANDE FOURNISSEUR
   ===================================================== */
router.get("/commandes/:commandeId/lignes", CommandeLigneController.getLignesByCommande);
router.get("/commandes-lignes/:id", CommandeLigneController.getLigneById);
router.post("/commandes-lignes", CommandeLigneController.createLigne);
router.delete("/commandes-lignes/:id", CommandeLigneController.deleteLigne);

/* =====================================================
   CLIENTS
   ===================================================== */
router.get("/clients", ClientController.getAllClients);
router.get("/clients/:id", ClientController.getClientById);
router.post("/clients", ClientController.createClient);
router.put("/clients/:id", ClientController.updateClient);
router.delete("/clients/:id", ClientController.deleteClient);

/* =====================================================
   COMMANDES CLIENTS
   ===================================================== */
router.get("/commandes-clients", CommandeClientController.getAllCommandesClients);
router.get("/commandes-clients/:id", CommandeClientController.getCommandeClientById);
router.post("/commandes-clients", CommandeClientController.createCommandeClient);
router.put("/commandes-clients/:id", CommandeClientController.updateCommandeClient);
router.delete("/commandes-clients/:id", CommandeClientController.deleteCommandeClient);

/* =====================================================
   ARTICLES / CATALOGUE BIJOUX
   ===================================================== */
router.get("/articles", ArticleController.getAllArticles);
router.get("/articles/:id", ArticleController.getArticleById);
router.post("/articles", ArticleController.createArticle);
router.put("/articles/:id", ArticleController.updateArticle);
router.delete("/articles/:id", ArticleController.deleteArticle);
router.get("/articles/categories", ArticleController.getAllCategorie);

/* =====================================================
   BUDGET / DÉPENSES
   ===================================================== */
router.get("/budget", BudgetController.getAllDepenses);
router.get("/budget/stats", BudgetController.getStats);
router.get("/budget/:id", BudgetController.getDepenseById);
router.post("/budget", BudgetController.createDepense);
router.put("/budget/:id", BudgetController.updateDepense);
router.delete("/budget/:id", BudgetController.deleteDepense);



module.exports = router;
