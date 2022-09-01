module.exports = app => {
    const pipectrls = require("./pipectrls.controller.js");

    app.get("/getPipesByStatus/:status", pipectrls.getPipesByStatus);
    app.post("/claimPipes", pipectrls.claimPipes)
    app.post("/unclaimPipes", pipectrls.unclaimPipes)
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
    app.get("/estimatedPipingWeight", pipectrls.estimatedPipingWeight)
    app.get("/estimatedPipingCustomWeight", pipectrls.estimatedPipingCustomWeight)
    app.get("/isocontrolProgress", pipectrls.isocontrolProgress)
    app.get("/isocontrolEstimated", pipectrls.isocontrolEstimated)
    app.get("/isocontrolForecast", pipectrls.isocontrolForecast)
    app.post("/submitEstimatedForecastIFD", pipectrls.submitEstimatedForecastIFD)
  };