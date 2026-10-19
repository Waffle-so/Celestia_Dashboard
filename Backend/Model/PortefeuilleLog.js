// PortefeuilleLog — historique de chaque mouvement de caisse
module.exports = (sequelize, DataTypes) =>
  sequelize.define("PortefeuilleLog", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // type d'opération
    type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
      // credit = on ajoute de l'argent (recette, vente...)
      // debit  = on retire de l'argent (dépense, achat...)
    },

    montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false }, // motif de l'opération
    solde_avant: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // solde AVANT l'opération
    solde_apres: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // solde APRÈS

    // Catégorie libre pour filtrer les logs
    categorie: {
      type: DataTypes.ENUM("vente", "achat", "publicite", "packaging", "salaire", "loyer", "autre"),
      defaultValue: "autre",
    },

    notes: { type: DataTypes.TEXT, allowNull: true },
  });
