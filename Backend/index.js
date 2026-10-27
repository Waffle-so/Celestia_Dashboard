const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize, syncModels } = require("./Model/index.js");
const Routes = require("./routes/routes.js");

dotenv.config();

const app = express();

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: "25mb" }));
app.use(bodyParser.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ── Route de santé ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "✅ Celestia Command Backend actif !", version: "1.0.0" });
});

// ── Fichiers statiques (Uploads) ─────────────────────────────────────────────
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes API ───────────────────────────────────────────────────────────────
app.use("/api", Routes);

// ── Initialisation ───────────────────────────────────────────────────────────
const initializeServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie.");

    const syncSuccess = await syncModels();
    if (!syncSuccess) {
      console.warn("⚠️ Synchronisation des modèles échouée.");
      return;
    }
    console.log("🚀 Celestia Command est prêt.");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
  }
};

app.listen(process.env.PORT || 5000, async () => {
  console.log(`✅ Serveur démarré sur http://localhost:${process.env.PORT || 5000}`);
  await initializeServer();
});
