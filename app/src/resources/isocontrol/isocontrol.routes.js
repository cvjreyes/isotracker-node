module.exports = app => {
    const isocontrol = require("./isocontrol.controller.js");
    // Create a new user
    app.get("/getBom", isocontrol.getBom)
    app.get("/getNotModelled", isocontrol.getNotModelled)
    app.get("/isocontrolWeights", isocontrol.isocontrolWeights)
    app.get("/getIsocontrolFull", isocontrol.getIsocontrolFull)
    app.get("/isoControlGroupLineId", isocontrol.isoControlGroupLineId)
  };