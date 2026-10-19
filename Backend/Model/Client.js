// Fiche client de la bijouterie
module.exports = (sequelize, DataTypes) =>
  sequelize.define("Client", {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nom:       { type: DataTypes.STRING, allowNull: false },
    telephone: { type: DataTypes.STRING, allowNull: true  },
    email:     { type: DataTypes.STRING, allowNull: true  },
    adresse:   { type: DataTypes.TEXT,   allowNull: true  },
    wilaya:    { type: DataTypes.STRING, allowNull: true  }, // ex: "Alger", "Oran"...
    notes:     { type: DataTypes.TEXT,   allowNull: true  },
  });
