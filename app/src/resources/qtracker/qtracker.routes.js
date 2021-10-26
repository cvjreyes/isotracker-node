module.exports = app => {
    const qtracker = require("./qtracker.controller.js");

    app.post("/qtracker/requestNWC", qtracker.requestNWC)
    app.post("/qtracker/requestNVN", qtracker.requestNVN)
    app.post("/qtracker/requestNRI", qtracker.requestNRI)
    app.post("/qtracker/requestNRB", qtracker.requestNRB)
    app.post("/qtracker/requestNRIDS", qtracker.requestNRIDS)
    app.post("/qtracker/requestRR", qtracker.requestRR)
    app.post("/qtracker/uploadAttach", qtracker.uploadAttach)

    app.get("/qtracker/getNWC", qtracker.getNWC)
    app.get("/qtracker/getNVN", qtracker.getNVN)

  };