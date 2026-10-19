// Catalogue articles / bijoux de la bijouterie
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Article", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // ── Infos générales ───────────────────────────────────────────────────
    nom:         { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT,   allowNull: true  },
    image:       { type: DataTypes.STRING, allowNull: true  }, // chemin ou URL de l'image

    // ── Catégorie ─────────────────────────────────────────────────────────
    categorie: {
      type: DataTypes.ENUM("bague", "collier", "bracelet", "boucles_oreilles", "pendentif", "chevillere", "autre"),
      defaultValue: "autre",
    },

    // ── Matière principale ────────────────────────────────────────────────
    matiere: {
      type: DataTypes.ENUM("argent", "or_18k", "or_blanc", "or_nordique", "acier_inoxydable", "autre"),
      defaultValue: "argent",
    },
    matiere_detail: { type: DataTypes.STRING, allowNull: true }, // précision libre (ex: "argent 925")

    // ── Mchelel (dorure / placage) ────────────────────────────────────────
    // Mchelel = couche dorée appliquée autour du bijou
    mchelel: {
      type: DataTypes.ENUM("aucun", "or_veritable", "or_nordique", "or_rose", "autre"),
      defaultValue: "aucun",
    },
    mchelel_detail: { type: DataTypes.STRING, allowNull: true }, // précision si "autre"

    // ── Pierres (gemmes / semi-précieuses) ────────────────────────────────
    // Exemples : citrine, améthyste, quartz rose, onyx, oeil de tigre...
    a_des_pierres: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    type_pierres: {
      // Tableau JSON : ["citrine", "amethyste"] — plusieurs pierres possibles
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      // Valeurs suggérées (non restrictives, le champ est libre en JSON) :
      // citrine | amethyste | quartz_rose | onyx | oeil_de_tigre | lapis_lazuli
      // turquoise | agate | cornaline | nacre | malachite | labradorite | autre
    },
    pierres_detail: { type: DataTypes.STRING, allowNull: true }, // précision libre (taille, couleur, provenance...)

    // ── Dimensions & poids ────────────────────────────────────────────────
    poids: { type: DataTypes.DECIMAL(8, 3), allowNull: true }, // en grammes

    // ── Prix ──────────────────────────────────────────────────────────────
    prix_achat: { type: DataTypes.DECIMAL(10, 2), allowNull: true,  defaultValue: 0  },
    prix_vente: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0  }, // prix final (calculé ou manuel)

    // ── Stock ──────────────────────────────────────────────────────────────
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });
