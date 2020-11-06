const path = require("path");
const express = require("express");
const xss = require("xss");
const CommentsService = require("./comments-service");

const commentsRouter = express.Router();
const serializeComment = (comment) => ({
  ...comment,
  text: xss(comment.text),
});

commentsRouter
  .route("/")
  .get(async (req, res, next) => {
    try {
      const comments = await CommentsService.getAllComments(req.app.get("db"));
      res.json(comments.map(serializeComment));
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const { text, article_id, user_id, date_commented } = req.body;
      const newComment = { text, article_id, user_id };
      for (const [key, value] of Object.entries(newComment)) {
        if (value === null) {
          return res.status(400).json({
            error: { message: `Missing '${key} in request body'` },
          });
        }
      }
      newComment.date_commented = date_commented;
      const comment = await CommentsService.insertComment(
        req.app.get("db"),
        newComment
      );
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${comment.id}`))
        .json(serializeComment(comment));
    } catch (error) {
      next(error);
    }
  });

commentsRouter
  .route("/:comment_id")
  .all(async (req, res, next) => {
    try {
      const { comment_id: id } = req.params;
      const comment = await CommentsService.getCommentById(
        req.app.get("db"),
        id
      );
      if (!comment)
        return res.status(404).json({
          error: { message: `Comment doesn't exist` },
        });
      req.comment = serializeComment(comment);
      next();
    } catch (error) {
      next(error);
    }
  })
  .get((req, res) => {
    res.json(req.comment);
  })
  .patch(async (req, res, next) => {
    try {
      const {text, date_commented} = req.body;
      const commentToUpdate = {text, date_commented};
      if (Object.values(commentToUpdate).filter(Boolean).length === 0){
        return res.status(400).json({
          error:{message: `Request body must contain either 'text' or 'date_commented'`}
        })
      }
      await CommentsService.updateComment(
        req.app.get('db'),
        req.params.comment_id,
        commentToUpdate
      )
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      await CommentsService.deleteComment(
        req.app.get("db"),
        req.params.comment_id
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

module.exports = commentsRouter;
