const { Article } = require("../Model");

// GET /api/articles
const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [["nom", "ASC"]] });
    const categories = articles.map((article) => article.categorie).filter((categorie, index, self) => self.indexOf(categorie) === index);
    const result = { articles, categories };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /api/articles/:id
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article introuvable." });
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /api/articles
const createArticle = async (req, res) => {
  try {
    const article = await Article.create(req.body);
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
    await article.update(req.body);
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
    await article.destroy();
    res.json({ message: "Article supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

const getAllCategorie = async (req, res) => {
  try {
    console.log("categories pret");
    const categories = await Article.findAll({ attributes: ["categorie"], distinct: true });
    res.json(categories);
    console.log("categories", categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle, getAllCategorie };
