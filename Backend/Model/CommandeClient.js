// Commandes passées par les clients (bijoux sur commande)
module.exports = (sequelize, DataTypes) =>
  sequelize.define("CommandeClient", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // client_id est défini via la relation belongsTo dans Model/index.js
    description: { type: DataTypes.TEXT, allowNull: false },
    quantite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    prix_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    prix_vente_articles: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    prix_total_achat: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    avance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    reste: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    statut: {
      type: DataTypes.ENUM("en_cours", "pret", "livre", "annule"),
      defaultValue: "en_cours",
    },
    date_commande: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    date_livraison: { type: DataTypes.DATEONLY, allowNull: true },
    portefeuille_credit_log_id: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  });
