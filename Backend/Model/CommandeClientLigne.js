// Lignes de commande client : enregistre exactement quel article/bague a été acheté
module.exports = (sequelize, DataTypes) =>
  sequelize.define("CommandeClientLigne", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    commande_client_id: { type: DataTypes.INTEGER, allowNull: false },
    article_id: { type: DataTypes.INTEGER, allowNull: true }, // Peut être null si bijou sur-mesure ou supprimé
    nom: { type: DataTypes.STRING, allowNull: false }, // Snapshot du nom de l'article au moment de la vente
    quantite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    prix_unitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  });
