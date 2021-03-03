module.exports = app => {
    const dPipes = require("./dpipe.controller.js");
  
    // Create a new dpipe
    app.post("/api/dPipe", dPipes.create);

    // Retrieve all dpipes
    app.get("/api/dPipes", dPipes.findAll);

    // Retrieve a single dpipe with dpipeId
    app.get("/api/dPipe/:dPipeId", dPipes.findOne);

    // Update a dpipe with dpipeId
    app.put("/api/dPipe/:dPipeId", dPipes.update);

    // Delete a dpipe with dpipeId
    app.delete("/api/dPipe/:dPipeId", dPipes.delete);

    // Create a new dpipe
    app.delete("/api/dPipes", dPipes.deleteAll);
  };