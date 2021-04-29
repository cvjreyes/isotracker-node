const express = require("express");
const router = express.Router();
const controller = require("../fileController/file.controller");

let routes = (app) => {
  router.post("/upload", controller.upload);
  router.post("/uploadHis", controller.uploadHis);
  router.post("/update", controller.update);
  router.post("/updateHis", controller.updateHis);
  router.get("/updateStatus", controller.updateStatus);
  router.get("/api/statusFiles", controller.statusFiles);
  router.get("/api/historyFiles", controller.historyFiles)
  router.post("/files", controller.getListFiles);
  router.get("/piStatus/:fileName", controller.piStatus)
  router.get("/getMaster/:fileName", controller.getMaster);
  router.get("/files/:name", controller.download);
  router.post("/restore", controller.restore);
  router.post("/process", controller.toProcess);
  router.post("/instrument", controller.instrument);
  router.post("/filesProcInst", controller.filesProcInst);
  router.post("/uploadProc", controller.uploadProc);
  router.post("/uploadInst", controller.uploadInst);
  router.get("/download/:fileName", controller.download);
  router.get("/getAttach/:fileName", controller.getAttach);
  router.get("/downloadHistory", controller.downloadHistory);
  router.post("/uploadReport", controller.uploadReport);
  router.get("/checkPipe/:fileName", controller.checkPipe);

  app.use(router);
};

module.exports = routes;