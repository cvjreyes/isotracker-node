const express = require("express");
const router = express.Router();
const controller = require("../unclaim/unclaim.controller");

let routes = (app) => {
  router.post("/unclaim", controller.singleUnclaim); //Unclaim de una iso
  router.post("/unclaimProc", controller.singleUnclaimProc); //Unclaim de procesos
  router.post("/unclaimInst", controller.singleUnclaimInst); //Unclaim de instrumentos
  router.post("/forceUnclaim", controller.forceUnclaim); //Unclaim forzado por parte de LOS

  app.use(router);
};

module.exports = routes;