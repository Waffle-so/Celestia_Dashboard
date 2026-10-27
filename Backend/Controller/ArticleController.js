const { Article, Collection } = require("../Model");
const { deleteImageFromStorage, deleteImagesFromStorage, uploadImageToStorage } = require("../utils/supabase");

// GET /api/articles
const getAllArticles = async (req, res) => {
  try {
    const where = {};
    if (req.query.collection_id) {
      where.collection_id = req.query.collection_id;
    }
    if (req.query.categorie) {
      where.categorie = req.query.categorie;
    }
    if (req.query.en_promo === "true") {
      where.en_promo = true;
    }

    const articles = await Article.findAll({
      where,
      order: [["nom", "ASC"]],
      include: [
        {
          model: Collection,
          as: "collection",
          attributes: ["id", "nom", "slug"],
        },
      ],
    });

    const categories = articles
      .map((article) => article.categorie)
      .filter((categorie, index, self) => self.indexOf(categorie) === index);

    const result = { articles, categories };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/articles/bestsellers
const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const articles = await Article.findAll({
      order: [
        ["ventes_total", "DESC"],
        ["nom", "ASC"],
      ],
      limit,
      include: [
        {
          model: Collection,
          as: "collection",
          attributes: ["id", "nom", "slug"],
        },
      ],
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/articles/offres
const getOffres = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { en_promo: true },
      order: [["nom", "ASC"]],
      include: [
        {
          model: Collection,
          as: "collection",
          attributes: ["id", "nom", "slug"],
        },
      ],
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/articles/:id
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        {
          model: Collection,
          as: "collection",
        },
      ],
    });
    if (!article) return res.status(404).json({ message: "Article introuvable." });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/articles
const createArticle = async (req, res) => {
  try {
    const body = { ...req.body };
    // Assurer un tableau d'au plus 5 images
    if (body.images) {
      body.images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    }
    const article = await Article.create(body);
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// PUT /api/articles/:id
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article introuvable." });

    const body = { ...req.body };
    const oldImages = Array.isArray(article.images) ? article.images : [];

    if (body.images !== undefined) {
      body.images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];

      // Détecter toutes les images supprimées du tableau
      const removedImages = oldImages.filter((img) => !body.images.includes(img));
      if (removedImages.length > 0) {
        console.log(`[Articles] 🗑️ ${removedImages.length} image(s) retirée(s) de l'article #${article.id}, suppression de Supabase Storage...`);
        for (const imgUrl of removedImages) {
          await deleteImageFromStorage(imgUrl);
        }
      }
    }

    // Si une image principale legacy (article.image) était stockée et n'est plus présente
    if (article.image && (!body.images || !body.images.includes(article.image)) && body.image !== article.image) {
      await deleteImageFromStorage(article.image).catch(() => {});
    }

    await article.update(body);
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE /api/articles/:id
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article introuvable." });

    // Nettoyer toutes les images de Supabase Storage
    const toDelete = [];
    if (Array.isArray(article.images)) {
      toDelete.push(...article.images);
    }
    if (article.image && !toDelete.includes(article.image)) {
      toDelete.push(article.image);
    }

    if (toDelete.length > 0) {
      console.log(`[Articles] 🗑️ Suppression de ${toDelete.length} image(s) de Supabase Storage pour l'article #${article.id}`);
      for (const imgUrl of toDelete) {
        await deleteImageFromStorage(imgUrl).catch(() => {});
      }
    }

    await article.destroy();
    res.json({ message: "Article supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

const getAllCategorie = async (req, res) => {
  try {
    const categories = await Article.findAll({ attributes: ["categorie"], distinct: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/articles/upload-image — upload une image vers Supabase Storage et retourne l'URL publique
const uploadImage = async (req, res) => {
  try {
    const { file, fileName } = req.body;
    if (!file) {
      return res.status(400).json({ message: "Fichier d'image manquant (base64 requis)." });
    }

    const result = await uploadImageToStorage(file, fileName);
    if (result.error) {
      return res.status(500).json({ message: "Erreur Supabase Storage", error: result.error });
    }

    res.json({ url: result.publicUrl, filePath: result.filePath });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'upload", error: error.message });
  }
};

// POST /api/articles/delete-storage-image — supprime directement un fichier de Supabase Storage
const deleteStorageImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL de l'image requise." });
    }

    const result = await deleteImageFromStorage(url);
    if (result.error) {
      return res.status(500).json({ message: "Erreur Supabase Storage", error: result.error });
    }

    res.json({ message: "Image supprimée de Supabase Storage avec succès.", result });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

// DELETE /api/articles/:id/image — supprime une image du tableau + du Supabase Storage
const deleteArticleImage = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article introuvable." });

    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "URL de l'image requise." });

    const images = Array.isArray(article.images) ? article.images : [];
    const updatedImages = images.filter((img) => img !== url);

    await deleteImageFromStorage(url);
    await article.update({ images: updatedImages });
    res.json({ message: "Image supprimée.", images: updatedImages });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

module.exports = {
  getAllArticles,
  getBestSellers,
  getOffres,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getAllCategorie,
  uploadImage,
  deleteStorageImage,
  deleteArticleImage,
};


