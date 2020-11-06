const path = require("path");
const express = require("express");
const xss = require("xss");
const UsersService = require("./users-service");

const usersRouter = express.Router();
const serializeUser = (user) => ({
  id: user.id,
  fullname: xss(user.fullname),
  username: xss(user.username),
  nickname: xss(user.nickname),
  date_created: user.date_created,
});

usersRouter
  .route("/")
  .get(async (req, res, next) => {
    try {
      const users = await UsersService.getAllUsers(req.app.get("db"));
      res.json(users.map(serializeUser));
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const { fullname, username, password, nickname } = req.body;
      const newUser = { fullname, username };

      for (const [key, value] of Object.entries(newUser)) {
        if (value == null) {
          return res.status(400).json({
            error: { message: `Missing '${key}' in request body` },
          });
        }
      }

      newUser.nickname = nickname;
      newUser.password = password;

      const user = await UsersService.insertUser(req.app.get("db"), newUser);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${user.id}`))
        .json(serializeUser(user));
    } catch (error) {
      next(error);
    }
  });

usersRouter
  .route("/:user_id")
  .all(async (req, res, next) => {
    try {
      const user = await UsersService.getUserById(
        req.app.get("db"),
        req.params.user_id
      );
      if (!user)
        return res
          .status(404)
          .json({ error: { message: `User doesn't exist` } });
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  })
  .get((req, res, next) => {
    try {
      res.json(serializeUser(req.user));
    } catch (error) {
      next(error);
    }
  })
  .patch(async (req, res, next) => {
    try {
      const { fullname, username, password, nickname } = req.body;
      const userToUpdate = { fullname, username, password, nickname };
      if (Object.values(userToUpdate).filter(Boolean).length === 0)
       return res.status(400).json({
          error: {
            message: `Request body must contain either 'fullname', 'username', 'password' or 'nickname'`,
          },
        });

      await UsersService.updateUser(
        req.app.get("db"),
        req.params.user_id,
        userToUpdate
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  })
  .delete(async(req,res,next)=>{
    try {
      const {user_id} = req.params;
      await UsersService.deleteUser(req.app.get('db'), user_id)
      res.status(204).end();
    } catch (error) {
      next(error)
    }
  });

module.exports = usersRouter;
