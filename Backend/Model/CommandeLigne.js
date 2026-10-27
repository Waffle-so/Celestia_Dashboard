// Lignes de commande fournisseur : article existant ou bijou a creer a l'arrivee
module.exports = (sequelize, DataTypes) =>
  sequelize.define("CommandeLigne", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    article_id: { type: DataTypes.INTEGER, allowNull: true },
    article_cree_id: { type: DataTypes.INTEGER, allowNull: true },

    nom: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    categorie: {
      type: DataTypes.ENUM("bague", "collier", "bracelet", "boucles_oreilles", "pendentif", "chevillere", "autre"),
      defaultValue: "autre",
    },
    collection_id: { type: DataTypes.INTEGER, allowNull: true }, // Collection assignée lors de la commande fournisseur
    matiere: {
      type: DataTypes.ENUM("argent", "or_18k", "or_blanc", "or_nordique", "acier_inoxydable", "autre"),
      defaultValue: "argent",
    },
    matiere_detail: { type: DataTypes.STRING, allowNull: true },
    mchelel: {
      type: DataTypes.ENUM("aucun", "or_veritable", "or_nordique", "or_rose", "autre"),
      defaultValue: "aucun",
    },
    mchelel_detail: { type: DataTypes.STRING, allowNull: true },
    
    // ── Pierres (gemmes / semi-précieuses) ────────────────────────────────
    a_des_pierres: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    type_pierres: {
      // Tableau JSON : [{id, label, categorie, carat}]
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    pierres_detail: { type: DataTypes.STRING, allowNull: true },
    
    poids: { type: DataTypes.DECIMAL(8, 3), allowNull: true },

    quantite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    prix_achat_unitaire: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    prix_vente: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    prix_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  });
