module.exports = app => {
    const isocontrol = require("./isocontrol.controller.js");
    // Create a new user
    app.get("/getBom", isocontrol.getBom) //Select de la bomtable
    app.get("/getNotModelled", isocontrol.getNotModelled) //Select de las no modeladas
    app.get("/isocontrolWeights", isocontrol.isocontrolWeights) //Calculo del peso
    app.get("/getIsocontrolFull", isocontrol.getIsocontrolFull) //Select de todo
    app.get("/isoControlGroupLineId", isocontrol.isoControlGroupLineId) //Select de todo agrupado por lineid
  };