
//Este modulo gestiona lo relacionado con civil dentro de 3dtracker. Los mismos comentarios se aplican a electrical y equipments
module.exports = app => {
    const civils = require("./civils.controller.js");

    app.get("/civils/steps", civils.civSteps)//Steps de civil
    app.get("/civils/estimated", civils.civEstimated)//Estimacion de civil
    app.get("/civils/modelled", civils.civModelled)//Civil modelado
    app.get("/civils/types", civils.civTypes)//Tipos de civil
    app.get("/civils/weight", civils.civWeight)//Peso actual de civil
    app.get("/civilsEstimatedExcel", civils.civilsEstimatedExcel)//Datos para el likeExcel de civil

    app.post("/submit/civils/types", civils.submitCivilTypes)//Post de tipos de civil
    app.post("/submit/civils/steps", civils.submitCivilSteps)//Post de steps de civil
    app.post("/submit/civils/estimated", civils.submitCivilEstimated)//Post de estimaciones de civil
  };