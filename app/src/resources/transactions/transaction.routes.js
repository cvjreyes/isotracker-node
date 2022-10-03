module.exports = app => {
    const transaction = require("./transaction.controller.js");
  
    app.post("/api/transaction", transaction.transaction); //Nueva transaccion
    app.post("/api/returnLead", transaction.returnLead); //Retorno a un lider
    app.post("/api/returnLeadStress", transaction.returnLeadStress); //retorno del lider de soporte al lider de stress
    app.post("/returnIso", transaction.returnIso); //Retorno de una iso
    app.post("/returnToLOS", transaction.returnToLOS); //Retorno de emitida a LOS
    
  };
  