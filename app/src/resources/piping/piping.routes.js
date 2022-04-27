module.exports = app => {
    const piping = require("./piping.controller.js");

    app.get("/piping/estimated", piping.pipingEstimated)
    app.get("/piping/types", piping.pipingTypes)
    app.post("/submit/piping/estimated", piping.submitPipingEstimated)
    app.get("/pipingWeight", piping.pipingWeight)
  };