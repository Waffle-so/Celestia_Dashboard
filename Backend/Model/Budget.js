// Dépenses budgétaires générales (packaging, publicité, salaires, etc.)
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Budget", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    categorie: {
      type: DataTypes.ENUM("packaging", "publicite", "achat_matiere", "salaire", "loyer", "autre"),
      defaultValue: "autre",
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    date_depense: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
  });
