const { Client } = require("../Model");

// GET /api/clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({ order: [["nom", "ASC"]] });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/clients/:id
const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: "Client introuvable." });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/clients
const createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error("❌ Erreur createClient:", error);
    res.status(500).json({ message: "Erreur lors de la création", error: error.message, detail: error.parent ? error.parent.detail : undefined });
  }
};

// PUT /api/clients/:id
const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: "Client introuvable." });
    await client.update(req.body);
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: "Client introuvable." });
    await client.destroy();
    res.json({ message: "Client supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient };
