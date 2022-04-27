module.exports = app => {
    const progress = require("./progress.controller.js");

    // Retrieve all tpipe
    app.get("/gpipes", progress.gpipes);
    app.get("/gequips", progress.gequips);
    app.get("/ginsts", progress.ginsts)
    app.get("/gcivils", progress.gcivils)
    app.get("/gelecs", progress.gelecs)
    app.get("/gcurve", progress.gcurve)

    app.post("/submit/equipments/progress", progress.submitEquipProgress)
    app.post("/submit/instrumentation/progress", progress.submitInstProgress)
    app.post("/submit/civils/progress", progress.submitCivilProgress)
    app.post("/submit/electrical/progress", progress.submitElecProgress)
    app.post("/submit/piping/progress", progress.submitPipingProgress)
    app.get("/currentProgress", progress.currentProgress);
    app.get("/getMaxProgress", progress.getMaxProgress);
    app.get("/currentProgressISO", progress.currentProgressISO);
  };