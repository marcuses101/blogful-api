const express = require("express");
const path = require('path')
const xss = require("xss");
const ArticlesService = require("./articles-service");

const articlesRouter = express.Router();
const serializeArticle = article => ({
  ...article,
  title: xss(article.title),
  content: xss(article.content),
})

articlesRouter
  .route("/")
  .get(async (req, res, next) => {
    const db = req.app.get("db");
    try {
      const articles = await ArticlesService.getAllArticles(db);
      res.json(articles.map(serializeArticle));
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    const db = req.app.get("db");
    try {
      const { title, content, style, author } = req.body;
      const newArticle = { title, content, style };
      for (const [key, value] of Object.entries(newArticle)) {
        if (value == null)
          return res.status(400).json({
            error: { message: `Missing '${key}' in request body` },
          });
      }
      newArticle.author = author;
      const response = await ArticlesService.insertArticle(db, newArticle);
      res.status(201)
      .location(path.posix.join(req.originalUrl, `/${response.id}`))
      .json(response);
    } catch (error) {
      next(error);
    }
  });

articlesRouter.route("/:id").get(async (req, res, next) => {
  const knexInstance = req.app.get("db");
  try {
    const { id } = req.params;
    const article = await ArticlesService.getById(knexInstance, id);
    if (!article)
      return res.status(404).json({
        error: { message: `Article doesn't exist` },
      });
    res.json({
      id: article.id,
      author: article.author,
      style: article.style,
      title: xss(article.title),
      content: xss(article.content),
      date_published: article.date_published,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = articlesRouter;
