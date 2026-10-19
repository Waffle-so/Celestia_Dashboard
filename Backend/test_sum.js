require('dotenv').config();
const { Article, sequelize } = require('./Model/index.js');

async function test() {
  try {
    await sequelize.authenticate();
    console.log("DB Authenticated");
    const val = await Article.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.literal('"prix_vente" * "stock"')), "valeur_stock"]
      ],
      raw: true
    });
    console.log("Val:", val.valeur_stock);
  } catch (e) {
    console.error("Error with alternative:", e.message);
  }
}

test();
