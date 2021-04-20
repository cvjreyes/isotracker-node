const express = require("express");
const router = express.Router();
const controller = require("../unclaim/unclaim.controller");

let routes = (app) => {
  router.post("/unclaim", controller.singleUnclaim);
  router.post("/unclaimProc", controller.singleUnclaimProc);
  router.post("/unclaimInst", controller.singleUnclaimInst);

  app.use(router);
};

module.exports = routes;