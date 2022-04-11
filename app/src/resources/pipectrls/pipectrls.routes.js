module.exports = app => {
    const pipectrls = require("./pipectrls.controller.js");

    app.get("/getPipesByStatus/:status", pipectrls.getPipesByStatus);
    app.post("/claimPipes", pipectrls.claimPipes)
    app.get("/pipingMyTray/:email", pipectrls.pipingMyTray)
    app.post("/nextStep", pipectrls.nextStep)
    app.post("/sendValves", pipectrls.sendValves)
    app.post("/sendInstruments", pipectrls.sendInstruments)
    app.post("/sendNA", pipectrls.sendNA)
    app.post("/cancelValves", pipectrls.cancelValves)
    app.post("/cancelInstruments", pipectrls.cancelInstruments)
    app.post("/cancelNA", pipectrls.cancelNA)
    app.post("/returnPipes", pipectrls.returnPipes)
    app.get("/getDeletedPipes", pipectrls.getDeletedPipes)
    app.post("/deletePipes", pipectrls.deletePipes)
    app.post("/restorePipes", pipectrls.restorePipes)
  };