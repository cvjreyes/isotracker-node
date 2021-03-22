const express = require("express");
const router = express.Router();
const controller = require("../unclaim/unclaim.controller");

let routes = (app) => {
  router.post("/unclaim", controller.singleUnclaim);


  app.use(router);
};

module.exports = routes;