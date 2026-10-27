// Catalogue articles / bijoux de la bijouterie
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Article", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // ── Infos générales ───────────────────────────────────────────────────
    nom:         { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT,   allowNull: true  },
    // ── Images (stockées dans Supabase Storage) ───────────────────────────
    // Tableau JSON d'URLs publiques — max 5 images
    // ex: ["https://xxx.supabase.co/storage/v1/object/public/articles/img1.jpg", ...]
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Image principale (champ virtuel rétro-compatible sans colonne SQL)
    image: {
      type: DataTypes.VIRTUAL,
      get() {
        const imgs = this.getDataValue("images");
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
        return null;
      },
      set(val) {
        if (!val) return;
        const current = this.getDataValue("images") || [];
        if (!current.includes(val)) {
          this.setDataValue("images", [val, ...current].slice(0, 5));
        }
      },
    },

    // ── Catégorie & Collection ───────────────────────────────────────────
    categorie: {
      type: DataTypes.ENUM("bague", "collier", "bracelet", "boucles_oreilles", "pendentif", "chevillere", "autre"),
      defaultValue: "autre",
    },
    collection_id: { type: DataTypes.INTEGER, allowNull: true }, // Clé étrangère vers Collection

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

    // ── Prix & Offres ──────────────────────────────────────────────────────
    prix_achat: { type: DataTypes.DECIMAL(10, 2), allowNull: true,  defaultValue: 0  },
    prix_vente: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0  }, // prix final (calculé ou manuel)
    en_promo:   { type: DataTypes.BOOLEAN,        allowNull: false, defaultValue: false }, // En offre / promotion ?
    prix_promo: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Prix réduit si en_promo

    // ── Stock ──────────────────────────────────────────────────────────────
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // ── Ventes (best sellers) ─────────────────────────────────────────────
    // Incrémenté automatiquement à chaque vente — ne jamais décrementer manuellement
    ventes_total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });
