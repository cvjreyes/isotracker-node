module.exports = app => {
    const instrumentation = require("./instrumentation.controller.js");
    // Create a new user
    app.get("/instrumentation/steps", instrumentation.instSteps)
    app.get("/instrumentation/estimated", instrumentation.instEstimated)
    app.get("/instrumentation/weight", instrumentation.instWeight)
    app.get("/instrumentation/modelled", instrumentation.instModelled)
    app.get("/instrumentation/types", instrumentation.instTypes)  
    app.get("/instsEstimatedExcel", instrumentation.instsEstimatedExcel)

    app.post("/submit/instrumentation/types", instrumentation.submitInstTypes)
    app.post("/submit/instrumentation/steps", instrumentation.submitInstSteps)
    app.post("/submit/instrumentation/estimated", instrumentation.submitInstEstimated)
  };