// Modèle Collection pour regrouper les articles / bijoux
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Collection", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: true }, // ex: "ete-2025", "bagues-solitaires"
    description: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true }, // URL image de couverture (Supabase Storage)
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, // Visible sur le site public ?
    ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Ordre d'affichage
  });
