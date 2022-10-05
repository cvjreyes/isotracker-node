module.exports = app => {
    const piping = require("./piping.controller.js");

    app.get("/piping/estimated", piping.pipingEstimated) //Lineas estimadas
    app.get("/piping/types", piping.pipingTypes) //Tipos del linea
    app.post("/submit/piping/estimated", piping.submitPipingEstimated) //Submit de nuevas estimaciones
    app.get("/pipingWeight", piping.pipingWeight) //Calculo del peso de las lineas
  };