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
  router.post("/updateDrawingDB", controller.updateDrawingDB)
  router.post("/editCSP", controller.editCSP)
  router.post("/exitEditCSP", controller.exitEditCSP)
  router.get("/getDrawing/:fileName", controller.getDrawing)
  router.get("/getListsData", controller.getListsData)
  router.post("/submitCSP", controller.submitCSP)
  router.get("/tags", controller.tags)
  router.post("/requestSP", controller.requestSP)
  router.get("/csptrackerRequests/:email", controller.csptrackerRequests)
  router.post("/markAsRead", controller.markAsRead)
  router.post("/markAsUnread", controller.markAsUnread)
  router.post("/rejectRequest", controller.rejectRequest)
  router.post("/acceptRequest", controller.acceptRequest)
  router.post("/deleteCSPNotification", controller.deleteCSPNotification)
  app.use(router);
};

module.exports = routes;