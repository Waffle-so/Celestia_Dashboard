const { sequelize, DataTypes } = require("../DB/db_connection");

// ── Import des modèles ──────────────────────────────────────────────────────
const Commande          = require("./Commande")(sequelize, DataTypes);
const CommandeLigne     = require("./CommandeLigne")(sequelize, DataTypes);
const Client            = require("./Client")(sequelize, DataTypes);
const CommandeClient    = require("./CommandeClient")(sequelize, DataTypes);
const Article           = require("./Article")(sequelize, DataTypes);
const Budget            = require("./Budget")(sequelize, DataTypes);
const Portefeuille      = require("./Portefeuille")(sequelize, DataTypes);
const PortefeuilleLog   = require("./PortefeuilleLog")(sequelize, DataTypes);

/* =========================
   Relations
========================= */

// Un client peut avoir plusieurs commandes clients
Client.hasMany(CommandeClient, { foreignKey: "client_id", onDelete: "CASCADE" });
CommandeClient.belongsTo(Client, { foreignKey: "client_id" });

// Une commande fournisseur contient plusieurs lignes de bijoux
Commande.hasMany(CommandeLigne, { foreignKey: "commande_id", onDelete: "CASCADE" });
CommandeLigne.belongsTo(Commande, { foreignKey: "commande_id" });

// Une ligne de commande peut référencer un article existant
Article.hasMany(CommandeLigne, { foreignKey: "article_id", as: "lignesCommande" });
CommandeLigne.belongsTo(Article, { foreignKey: "article_id", as: "article" });

// Une ligne de commande peut créer un nouvel article
Article.hasMany(CommandeLigne, { foreignKey: "article_cree_id", as: "lignesCreation" });
CommandeLigne.belongsTo(Article, { foreignKey: "article_cree_id", as: "articleCree" });

// Un portefeuille a plusieurs logs
Portefeuille.hasMany(PortefeuilleLog, { foreignKey: "portefeuille_id", onDelete: "CASCADE" });
PortefeuilleLog.belongsTo(Portefeuille, { foreignKey: "portefeuille_id" });

// Une commande client peut être liée à un mouvement de caisse (crédit)
CommandeClient.belongsTo(PortefeuilleLog, { foreignKey: "portefeuille_credit_log_id", as: "creditLog", constraints: false });
PortefeuilleLog.hasOne(CommandeClient, { foreignKey: "portefeuille_credit_log_id", as: "commandeClient", constraints: false });

// Une commande fournisseur peut être liée à un mouvement de caisse (débit)
Commande.belongsTo(PortefeuilleLog, { foreignKey: "portefeuille_debit_log_id", as: "debitLog", constraints: false });
PortefeuilleLog.hasOne(Commande, { foreignKey: "portefeuille_debit_log_id", as: "commandeFournisseur", constraints: false });

/* =========================
   Sync (crée / met à jour les tables automatiquement)
========================= */
const syncSequences = async () => {
  const tables = [
    "Clients",
    "Articles",
    "Commandes",
    "CommandeLignes",
    "CommandeClients",
    "Portefeuilles",
    "PortefeuilleLogs",
    "Budgets",
  ];
  for (const table of tables) {
    try {
      await sequelize.query(`
        DO $$
        DECLARE
          seq_name text;
          max_val integer;
        BEGIN
          seq_name := pg_get_serial_sequence('"${table}"', 'id');
          IF seq_name IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM "%s"', '${table}') INTO max_val;
            IF max_val > 0 THEN
              PERFORM setval(seq_name, max_val);
            END IF;
          END IF;
        END $$;
      `);
    } catch (_) {
      // Ignorer si la table n'a pas de séquence serial
    }
  }
};

const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Modèles synchronisés avec la base de données.");

    // Recaler les séquences auto-increment sur les données existantes
    await syncSequences();

    // Initialiser le portefeuille s'il n'existe pas encore
    const [portefeuille, created] = await Portefeuille.findOrCreate({
      where: { id: 1 },
      defaults: { solde: 0, label: "Caisse principale" },
    });
    if (created) console.log("💰 Portefeuille initialisé (solde: 0 DA).");

    return true;
  } catch (error) {
    console.error("❌ Erreur de synchronisation des modèles:", error);
    return false;
  }
};

module.exports = {
  sequelize,
  syncModels,
  Commande,
  CommandeLigne,
  Client,
  CommandeClient,
  Article,
  Budget,
  Portefeuille,
  PortefeuilleLog,
};
