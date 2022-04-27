module.exports = app => {
    const electrical = require("./electrical.controller.js");
    // Create a new user
    app.get("/electrical/estimated", electrical.elecEstimated)
    app.get("/electrical/steps", electrical.elecSteps)
    app.get("/electrical/modelled", electrical.elecModelled)
    app.get("/electrical/types", electrical.elecTypes)
    app.get("/electrical/weight", electrical.elecWeight)
    app.get("/elecsEstimatedExcel", electrical.elecsEstimatedExcel)

    app.post("/submit/electrical/types", electrical.submitElecTypes)
    app.post("/submit/electrical/steps", electrical.submitElecSteps)
    app.post("/submit/electrical/estimated", electrical.submitElecEstimated)
  };