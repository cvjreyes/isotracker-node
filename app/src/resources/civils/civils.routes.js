module.exports = app => {
    const civils = require("./civils.controller.js");
    // Create a new user
    app.get("/civils/steps", civils.civSteps)
    app.get("/civils/estimated", civils.civEstimated)
    app.get("/civils/modelled", civils.civModelled)
    app.get("/civils/types", civils.civTypes)
    app.get("/civils/weight", civils.civWeight)
    app.get("/civilsEstimatedExcel", civils.civilsEstimatedExcel)

    app.post("/submit/civils/types", civils.submitCivilTypes)
    app.post("/submit/civils/steps", civils.submitCivilSteps)
    app.post("/submit/civils/estimated", civils.submitCivilEstimated)
  };