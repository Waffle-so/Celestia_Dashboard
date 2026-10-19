// Commandes fournisseur / artisan (achats matières premières, bijoux...)
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Commande", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // ── Type de commande ──────────────────────────────────────────────────
    type_commande: {
      type: DataTypes.ENUM("produit_marque", "personnalisee"),
      defaultValue: "produit_marque",
      // produit_marque  = produit standard de notre catalogue
      // personnalisee   = commande sur-mesure pour un client
    },

    description: { type: DataTypes.TEXT, allowNull: true },

    // ── Quantité & poids ──────────────────────────────────────────────────
    quantite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    poids: { type: DataTypes.DECIMAL(8, 3), allowNull: true }, // poids total reçu (grammes)

    // ── Prix ──────────────────────────────────────────────────────────────
    prix_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    // ── Statut & dates ────────────────────────────────────────────────────
    statut: {
      type: DataTypes.ENUM("en_attente", "arrivee"),
      defaultValue: "en_attente",
    },
    date_achat: { type: DataTypes.DATEONLY, allowNull: true }, // date d'achat effective
    date_commande: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    date_reception: { type: DataTypes.DATEONLY, allowNull: true }, // date réception prévue / réelle

    notes: { type: DataTypes.TEXT, allowNull: true },

    // ── Tracking portefeuille & stock ─────────────────────────────────────
    portefeuille_debit_log_id: { type: DataTypes.INTEGER, allowNull: true }, // lien vers le log de débit
    stock_applique: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // stock mis à jour ?
  });
