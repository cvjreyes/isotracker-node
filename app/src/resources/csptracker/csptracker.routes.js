const express = require("express");
const router = express.Router();
const controller = require("../csptracker/csptracker.controller");

let routes = (app) => {
  router.get("/csptracker", controller.csptracker);
  router.post("/readye3d", controller.readye3d);
  router.post("/cancelreadye3d", controller.cancelReadye3d);
  router.post("/uploadDrawing", controller.uploadDrawing);
  router.post("/uploadDrawingDB", controller.uploadDrawingDB);
  router.post("/updateDrawing", controller.updateDrawing)
  router.post("/editCSP", controller.editCSP)
  router.post("/exitEditCSP", controller.exitEditCSP)
  router.get("/getDrawing/:fileName", controller.getDrawing)
  app.use(router);
};

module.exports = routes;