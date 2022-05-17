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
  router.get("/api/historyFiles", controller.historyFiles);
  router.get("/api/modelled", controller.modelled);
  router.post("/files", controller.getListFiles);
  router.get("/piStatus/:fileName", controller.piStatus)
  router.get("/getMaster/:fileName", controller.getMaster);
  router.get("/files/:name", controller.download);
  router.post("/restore", controller.restore);
  router.post("/process", controller.toProcess);
  router.post("/instrument", controller.instrument);
  router.post("/cancelProc", controller.cancelProc);
  router.post("/cancelInst", controller.cancelInst);
  router.post("/filesProcInst", controller.filesProcInst);
  router.post("/uploadProc", controller.uploadProc);
  router.post("/uploadInst", controller.uploadInst);
  router.get("/download/:fileName", controller.download);
  router.get("/getAttach/:fileName", controller.getAttach);
  router.post("/uploadReport", controller.uploadReport);
  router.get("/checkPipe/:fileName", controller.checkPipe);

  router.post("/rename", controller.rename);
  router.post("/unlock", controller.unlock);
  router.post("/unlockAll", controller.unlockAll);
 
  router.post("/uploadEquisModelledReport", controller.uploadEquisModelledReport)
  router.post("/uploadEquisEstimatedReport", controller.uploadEquisEstimatedReport)
  router.post("/uploadInstModelledReport", controller.uploadInstModelledReport)
  router.post("/uploadInstEstimatedReport", controller.uploadInstEstimatedReport)
  router.post("/uploadCivModelledReport", controller.uploadCivModelledReport)
  router.post("/uploadCivEstimatedReport", controller.uploadCivEstimatedReport)
  router.post("/uploadElecModelledReport", controller.uploadElecModelledReport)
  router.post("/uploadElecEstimatedReport", controller.uploadElecEstimatedReport)
  router.post("/uploadPipesEstimatedReport", controller.uploadPipesEstimatedReport)
  router.get("/downloadInstrumentationModelled", controller.downloadInstrumentationModelled)
  router.get("/downloadEquipmentModelled", controller.downloadEquipmentModelled)
  router.get("/downloadCivilModelled", controller.downloadCivilModelled)
  router.get("/downloadElectricalModelled", controller.downloadElectricalModelled)
  
  router.get("/navis", controller.navis)

  router.post("/updateBOM", controller.updateBom)
  router.get("/exportModelled", controller.exportModelled)
  router.get("/exportNotModelled", controller.exportNotModelled)
  router.get("/exportFull", controller.exportFull)
  router.get("/exportLineIdGroup", controller.exportLineIdGroup)
  router.get("/exportHolds", controller.exportHolds)
  router.get("/exportHoldsNoProgress", controller.exportHoldsNoProgress)
  router.get("/downloadBOM", controller.downloadBOM)

  router.get("/holds", controller.holds)

  router.get("/lastUser/:filename", controller.lastUser)

  router.post("/uploadNotifications", controller.uploadNotifications)

  router.get("/pids", controller.getPids)

  router.get("/timeTrack", controller.timeTrack)
  router.get("/exportTimeTrack", controller.exportTimeTrack)

  router.get("/revision/:fileName", controller.revision)
  router.post("/submitRevision", controller.submitRevision)

  router.get("/excludeHold/:fileName", controller.excludeHold);
  router.post("/sendHold", controller.sendHold);

  router.post("/getFilenamesByUser", controller.getFilenamesByUser)
  router.post("/createByPass", controller.createByPass)
  router.get("/getByPassData", controller.getByPassData)
  router.post("/acceptByPass", controller.acceptByPass)
  router.post("/answerByPass", controller.answerByPass)
  router.post("/rejectByPass", controller.rejectByPass)
  router.post("/naByPass", controller.naByPass)
  router.post("/editByPass", controller.editByPass)
  router.post("/closeByPass", controller.closeByPass)
  router.post("/deleteByPass", controller.deleteByPass)
  router.get("/exportByPass", controller.exportByPass)
  app.use(router);
};

module.exports = routes;