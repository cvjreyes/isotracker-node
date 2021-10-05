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
  router.get("/downloadHistory", controller.downloadHistory);
  router.get("/downloadStatus", controller.downloadStatus);
  router.get("/downloadPI", controller.downloadPI);
  router.get("/downloadIssued", controller.downloadIssued);
  router.get("/downloadStatus3D", controller.downloadStatus3D);
  router.get("/downloadModelled", controller.downloadModelled);
  router.post("/uploadReport", controller.uploadReport);
  router.get("/checkPipe/:fileName", controller.checkPipe);
  router.get("/currentProgress", controller.currentProgress);
  router.get("/getMaxProgress", controller.getMaxProgress);
  router.get("/currentProgressISO", controller.currentProgressISO);
  router.post("/toIssue", controller.toIssue);
  router.post("/request", controller.request);
  router.post("/newRev", controller.newRev);
  router.post("/rename", controller.rename);
  router.post("/unlock", controller.unlock);
  router.get("/equipments/estimated", controller.equipEstimated)
  router.get("/equipments/modelled", controller.equipModelled)
  router.post("/uploadEquisModelledReport", controller.uploadEquisModelledReport)
  router.post("/uploadEquisEstimatedReport", controller.uploadEquisEstimatedReport)
  router.get("/equipments/steps", controller.equipSteps)
  router.get("/equipments/weight", controller.equipWeight)
  router.get("/equipments/types", controller.equipTypes)
  router.get("/instrumentation/steps", controller.instSteps)
  router.get("/instrumentation/estimated", controller.instEstimated)
  router.get("/instrumentation/weight", controller.instWeight)
  router.get("/instrumentation/modelled", controller.instModelled)
  router.get("/instrumentation/types", controller.instTypes)
  router.get("/civils/steps", controller.civSteps)
  router.get("/civils/estimated", controller.civEstimated)
  router.get("/civils/modelled", controller.civModelled)
  router.get("/civils/types", controller.civTypes)
  router.get("/civils/weight", controller.civWeight)
  router.get("/electrical/estimated", controller.elecEstimated)
  router.get("/electrical/steps", controller.elecSteps)
  router.get("/electrical/modelled", controller.elecModelled)
  router.get("/electrical/types", controller.elecTypes)
  router.get("/electrical/weight", controller.elecWeight)
  router.post("/uploadInstModelledReport", controller.uploadInstModelledReport)
  router.post("/uploadInstEstimatedReport", controller.uploadInstEstimatedReport)
  router.post("/uploadCivModelledReport", controller.uploadCivModelledReport)
  router.post("/uploadCivEstimatedReport", controller.uploadCivEstimatedReport)
  router.post("/uploadElecModelledReport", controller.uploadElecModelledReport)
  router.post("/uploadElecEstimatedReport", controller.uploadElecEstimatedReport)
  router.post("/uploadPipesEstimatedReport", controller.uploadPipesEstimatedReport)
  router.get("/piping/estimated", controller.pipingEstimated)
  router.get("/piping/types", controller.pipingTypes)
  router.get("/downloadInstrumentationModelled", controller.downloadInstrumentationModelled)
  router.get("/downloadEquipmentModelled", controller.downloadEquipmentModelled)
  router.get("/downloadCivilModelled", controller.downloadCivilModelled)
  router.get("/downloadElectricalModelled", controller.downloadElectricalModelled)
  router.get("/navis", controller.navis)

  router.post("/submit/equipments/types", controller.submitEquipTypes)
  router.post("/submit/equipments/steps", controller.submitEquipSteps)
  router.post("/submit/equipments/estimated", controller.submitEquipEstimated)
  router.post("/submit/instrumentation/types", controller.submitInstTypes)
  router.post("/submit/instrumentation/steps", controller.submitInstSteps)
  router.post("/submit/instrumentation/estimated", controller.submitInstEstimated)
  router.post("/submit/civils/types", controller.submitCivilTypes)
  router.post("/submit/civils/steps", controller.submitCivilSteps)
  router.post("/submit/civils/estimated", controller.submitCivilEstimated)
  router.post("/submit/electrical/types", controller.submitElecTypes)
  router.post("/submit/electrical/steps", controller.submitElecSteps)
  router.post("/submit/electrical/estimated", controller.submitElecEstimated)
  router.post("/submit/piping/estimated", controller.submitPipingEstimated)

  router.get("/getBom", controller.getBom)
  router.post("/updateBOM", controller.updateBom)
  router.get("/getNotModelled", controller.getNotModelled)
  router.get("/isocontrolWeights", controller.isocontrolWeights)
  router.get("/exportModelled", controller.exportModelled)
  router.get("/exportNotModelled", controller.exportNotModelled)
  router.get("/getIsocontrolFull", controller.getIsocontrolFull)
  router.get("/exportFull", controller.exportFull)
  router.get("/isoControlGroupLineId", controller.isoControlGroupLineId)
  router.get("/exportLineIdGroup", controller.exportLineIdGroup)

  app.use(router);
};

module.exports = routes;