module.exports = app => {
    const transaction = require("./transaction.controller.js");
  
    // Create a new user
    app.post("/api/transaction", transaction.transaction);
    app.post("/api/returnLead", transaction.returnLead);
    app.post("/returnIso", transaction.returnIso)

  };