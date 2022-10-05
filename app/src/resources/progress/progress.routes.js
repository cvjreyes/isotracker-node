module.exports = app => {
    const progress = require("./progress.controller.js");

    // Retrieve all tpipe
    app.get("/gpipes", progress.gpipes); //Progeso tuberias
    app.get("/gequips", progress.gequips); //Progreso equipos
    app.get("/ginsts", progress.ginsts) //Progreso instrumentos
    app.get("/gcivils", progress.gcivils) //Progreso civiles
    app.get("/gelecs", progress.gelecs) //Progreso electricidad
    app.get("/gcurve", progress.gcurve) //Datos para la grafica de progreso

    app.post("/submit/equipments/progress", progress.submitEquipProgress) //Submit progreso equipos
    app.post("/submit/instrumentation/progress", progress.submitInstProgress) //Submit progreso instrumentos
    app.post("/submit/civils/progress", progress.submitCivilProgress) //Submit progreso civiles
    app.post("/submit/electrical/progress", progress.submitElecProgress) //Submit progreso electricidad
    app.post("/submit/piping/progress", progress.submitPipingProgress) //Submit progreso tuberias
    app.get("/currentProgress", progress.currentProgress); //Progreso actual de isotracker respecto a las lineas modeladas
    app.get("/getMaxProgress", progress.getMaxProgress); //100% de progreso
    app.get("/currentProgressISO", progress.currentProgressISO); //Progreso actual de isotracker respecto a las isos subidas
  };