const { Collection, Article } = require("../Model");
const { deleteImageFromStorage } = require("../utils/supabase");

// GET /api/collections
const getAllCollections = async (req, res) => {
  try {
    const includeArticles = req.query.include_articles === "true";
    const where = {};
    if (req.query.active_only === "true") {
      where.is_active = true;
    }

    const collections = await Collection.findAll({
      where,
      order: [
        ["ordre", "ASC"],
        ["nom", "ASC"],
      ],
      include: includeArticles
        ? [{ model: Article, as: "articles" }]
        : [{ model: Article, as: "articles", attributes: ["id"] }],
    });

    // Formater la réponse pour inclure le nombre d'articles
    const result = collections.map((col) => {
      const data = col.toJSON();
      data.nombre_articles = Array.isArray(data.articles) ? data.articles.length : 0;
      if (!includeArticles) {
        delete data.articles;
      }
      return data;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/collections/:id
const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findByPk(req.params.id, {
      include: [{ model: Article, as: "articles" }],
    });
    if (!collection) return res.status(404).json({ message: "Collection introuvable." });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/collections
const createCollection = async (req, res) => {
  try {
    const { nom, slug, description, image, is_active, ordre } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: "Le nom de la collection est requis." });
    }

    const formattedSlug = slug
      ? slug.trim().toLowerCase().replace(/\s+/g, "-")
      : nom.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const collection = await Collection.create({
      nom: nom.trim(),
      slug: formattedSlug,
      description: description || null,
      image: image || null,
      is_active: is_active !== undefined ? is_active : true,
      ordre: parseInt(ordre, 10) || 0,
    });

    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// PUT /api/collections/:id
const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findByPk(req.params.id);
    if (!collection) return res.status(404).json({ message: "Collection introuvable." });

    const { nom, slug, description, image, is_active, ordre } = req.body;
    const updateData = {};
    if (nom !== undefined) updateData.nom = nom.trim();
    if (slug !== undefined) updateData.slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) {
      updateData.image = image;
      if (collection.image && collection.image !== image) {
        await deleteImageFromStorage(collection.image).catch(() => {});
      }
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (ordre !== undefined) updateData.ordre = parseInt(ordre, 10) || 0;

    await collection.update(updateData);
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE /api/collections/:id
const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findByPk(req.params.id);
    if (!collection) return res.status(404).json({ message: "Collection introuvable." });

    // Nettoyer l'image de la collection dans Supabase Storage si présente
    if (collection.image) {
      await deleteImageFromStorage(collection.image).catch(() => {});
    }

    // Détacher d'abord les articles liés à cette collection (les mettre à collection_id: null)
    await Article.update({ collection_id: null }, { where: { collection_id: collection.id } });

    await collection.destroy();
    res.json({ message: "Collection supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
