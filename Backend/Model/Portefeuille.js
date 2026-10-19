// Portefeuille — solde courant de la bijouterie (une seule ligne en BDD)
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Portefeuille", {
    id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    solde: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    // On peut ajouter un label si un jour on veut gérer plusieurs caisses
    label: { type: DataTypes.STRING, allowNull: true, defaultValue: "Caisse principale" },
  });
