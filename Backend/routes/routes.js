const express = require("express");
const router = express.Router();

// ── Cache Middlewares ───────────────────────────────────────────────────────
const { cacheMiddleware, invalidateMiddleware } = require("../utils/cache");

// ── Controllers ─────────────────────────────────────────────────────────────
const CommandeController = require("../Controller/CommandeController");
const CommandeLigneController = require("../Controller/CommandeLigneController");
const CommandeClientController = require("../Controller/CommandeClientController");
const ClientController = require("../Controller/ClientController");
const ArticleController = require("../Controller/ArticleController");
const CollectionController = require("../Controller/CollectionController");
const BudgetController = require("../Controller/BudgetController");
const PortefeuilleController = require("../Controller/PortefeuilleController");
const DashboardController = require("../Controller/DashboardController");

/* =====================================================
   DASHBOARD
   ===================================================== */
router.get("/dashboard", cacheMiddleware("dashboard"), DashboardController.getStats);
router.get("/dashboard/profits-by-date", cacheMiddleware("dashboard"), DashboardController.getProfitsByDate);

/* =====================================================
   PORTEFEUILLE (Caisse / Wallet)
   ===================================================== */
router.get("/portefeuille", cacheMiddleware("portefeuille"), PortefeuilleController.getSolde);
router.get("/portefeuille/logs", cacheMiddleware("portefeuille"), PortefeuilleController.getLogs);
router.post("/portefeuille/credit", invalidateMiddleware("portefeuille", "dashboard"), PortefeuilleController.credit);
router.post("/portefeuille/debit", invalidateMiddleware("portefeuille", "dashboard"), PortefeuilleController.debit);
router.delete("/portefeuille/logs/:id", invalidateMiddleware("portefeuille", "dashboard"), PortefeuilleController.deleteLog);

/* =====================================================
   COMMANDES FOURNISSEUR / ARTISAN
   ===================================================== */
router.get("/commandes", cacheMiddleware("commandes"), CommandeController.getAllCommandes);
router.get("/commandes/:id", cacheMiddleware("commandes"), CommandeController.getCommandeById);
router.post("/commandes", invalidateMiddleware("commandes", "dashboard"), CommandeController.createCommande);
router.put("/commandes/:id", invalidateMiddleware("commandes", "dashboard"), CommandeController.updateCommande);
router.delete("/commandes/:id", invalidateMiddleware("commandes", "dashboard"), CommandeController.deleteCommande);
router.put(
  "/commandes/:id/arrivee",
  invalidateMiddleware("commandes", "articles", "portefeuille", "dashboard"),
  CommandeController.marquerCommandeArrivee
);

/* =====================================================
   LIGNES DE COMMANDE FOURNISSEUR
   ===================================================== */
router.get("/commandes/:commandeId/lignes", cacheMiddleware("commandes"), CommandeLigneController.getLignesByCommande);
router.get("/commandes-lignes/:id", cacheMiddleware("commandes"), CommandeLigneController.getLigneById);
router.post("/commandes-lignes", invalidateMiddleware("commandes", "dashboard"), CommandeLigneController.createLigne);
router.delete("/commandes-lignes/:id", invalidateMiddleware("commandes", "dashboard"), CommandeLigneController.deleteLigne);

/* =====================================================
   CLIENTS
   ===================================================== */
router.get("/clients", cacheMiddleware("clients"), ClientController.getAllClients);
router.get("/clients/:id", cacheMiddleware("clients"), ClientController.getClientById);
router.post("/clients", invalidateMiddleware("clients"), ClientController.createClient);
router.put("/clients/:id", invalidateMiddleware("clients", "commandes-clients"), ClientController.updateClient);
router.delete("/clients/:id", invalidateMiddleware("clients", "commandes-clients"), ClientController.deleteClient);

/* =====================================================
   COMMANDES CLIENTS
   ===================================================== */
router.get("/commandes-clients", cacheMiddleware("commandes-clients"), CommandeClientController.getAllCommandesClients);
router.get("/commandes-clients/:id", cacheMiddleware("commandes-clients"), CommandeClientController.getCommandeClientById);
router.post(
  "/commandes-clients",
  invalidateMiddleware("commandes-clients", "articles", "portefeuille", "dashboard"),
  CommandeClientController.createCommandeClient
);
router.put(
  "/commandes-clients/:id",
  invalidateMiddleware("commandes-clients", "articles", "portefeuille", "dashboard"),
  CommandeClientController.updateCommandeClient
);
router.delete(
  "/commandes-clients/:id",
  invalidateMiddleware("commandes-clients", "articles", "portefeuille", "dashboard"),
  CommandeClientController.deleteCommandeClient
);

/* =====================================================
   COLLECTIONS (Pour catalogue & site vitrine)
   ===================================================== */
router.get("/collections", cacheMiddleware("collections"), CollectionController.getAllCollections);
router.get("/collections/:id", cacheMiddleware("collections"), CollectionController.getCollectionById);
router.post("/collections", invalidateMiddleware("collections", "articles"), CollectionController.createCollection);
router.put("/collections/:id", invalidateMiddleware("collections", "articles"), CollectionController.updateCollection);
router.delete("/collections/:id", invalidateMiddleware("collections", "articles"), CollectionController.deleteCollection);

/* =====================================================
   ARTICLES / CATALOGUE BIJOUX
   ===================================================== */
router.get("/articles", cacheMiddleware("articles"), ArticleController.getAllArticles);
router.get("/articles/bestsellers", cacheMiddleware("articles"), ArticleController.getBestSellers);
router.get("/articles/offres", cacheMiddleware("articles"), ArticleController.getOffres);
router.get("/articles/categories", cacheMiddleware("articles"), ArticleController.getAllCategorie);
router.post("/articles/upload-image", ArticleController.uploadImage);
router.get("/articles/:id", cacheMiddleware("articles"), ArticleController.getArticleById);
router.post("/articles", invalidateMiddleware("articles", "collections", "dashboard"), ArticleController.createArticle);
router.put("/articles/:id", invalidateMiddleware("articles", "collections", "dashboard"), ArticleController.updateArticle);
router.delete("/articles/:id", invalidateMiddleware("articles", "collections", "dashboard"), ArticleController.deleteArticle);
// Supprime directement une image de Supabase Storage
router.post("/articles/delete-storage-image", ArticleController.deleteStorageImage);
// Supprime une image précise du tableau d'images d'un article + du Supabase Storage
router.delete("/articles/:id/image", invalidateMiddleware("articles"), ArticleController.deleteArticleImage);

/* =====================================================
   BUDGET / DÉPENSES
   ===================================================== */
router.get("/budget", cacheMiddleware("budget"), BudgetController.getAllDepenses);
router.get("/budget/stats", cacheMiddleware("budget"), BudgetController.getStats);
router.get("/budget/:id", cacheMiddleware("budget"), BudgetController.getDepenseById);
router.post("/budget", invalidateMiddleware("budget", "portefeuille", "dashboard"), BudgetController.createDepense);
router.put("/budget/:id", invalidateMiddleware("budget", "portefeuille", "dashboard"), BudgetController.updateDepense);
router.delete("/budget/:id", invalidateMiddleware("budget", "portefeuille", "dashboard"), BudgetController.deleteDepense);

module.exports = router;

