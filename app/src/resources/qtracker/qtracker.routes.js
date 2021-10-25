module.exports = app => {
    const qtracker = require("./qtracker.controller.js");

    app.post("/qtracker/requestNWC", qtracker.requestNWC)
    app.post("/qtracker/uploadAttach", qtracker.uploadAttach)

  };