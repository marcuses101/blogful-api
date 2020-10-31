const express = require("express");
const ArticlesService = require("./articles-service");

const articlesRouter = express.Router();

articlesRouter
  .route("/")
  .get(async (req, res, next) => {
    const db = req.app.get("db");
    try {
      const articles = await ArticlesService.getAllArticles(db);
      res.json(articles);
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    const db = req.app.get("db");
    try {
      const {title, content, style} = req.body;
      const newArticle = {title, content, style}
      for (const [key, value] of Object.entries(newArticle)){
        if(value==null) return res.status(400).json({
          error:{message: `Missing '${key}' in request body`}
        })
      }
      const response = await ArticlesService.insertArticle(db, newArticle);
      res.status(201).location(`/articles/${response.id}`).json(response);
    } catch (error) {
      next(error);
    }
  });

articlesRouter
.route("/:id")
.get(async (req, res, next) => {
  const knexInstance = req.app.get("db");
  try {
    const { id } = req.params;
    const article = await ArticlesService.getById(knexInstance, id);
    if (!article)
      return res.status(404).json({
        error: { message: `Article doesn't exist` },
      });
    res.json(article);
  } catch (error) {
    next(error);
  }
});

module.exports = articlesRouter;
