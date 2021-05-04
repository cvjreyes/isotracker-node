const express = require("express");
const router = express.Router();
const controller = require("../unclaim/unclaim.controller");

let routes = (app) => {
  router.post("/unclaim", controller.singleUnclaim);
  router.post("/unclaimProc", controller.singleUnclaimProc);
  router.post("/unclaimInst", controller.singleUnclaimInst);
  router.post("/forceUnclaim", controller.forceUnclaim);

  app.use(router);
};

module.exports = routes;