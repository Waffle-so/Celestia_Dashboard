const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const DATABASE_NAME = process.env.DB_NAME;
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;
const DATABASE_HOST = process.env.DB_HOST;
const DATABASE_PORT = process.env.DB_PORT;

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1";

const sequelize = new Sequelize(
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
  {
    host: DATABASE_HOST,
    port: DATABASE_PORT,
    dialect: "postgres",
    dialectOptions: isRemote ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      clientMinMessages: "ignore",
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false,
  }
);

// Vérification de la connexion
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connexion à la base de données réussie.");
  })
  .catch((err) => {
    console.error("❌ Impossible de se connecter à la base de données:", err);
  });

module.exports = { sequelize, DataTypes };
