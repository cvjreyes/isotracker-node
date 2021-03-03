module.exports = app => {
    const dPipes = require("./dpipe.controller.js");
  
    // Create a new dpipe
    app.post("/dPipe", dPipes.create);

    // Retrieve all dpipes
    app.get("/dPipes", dPipes.findAll);

    // Retrieve a single dpipe with dpipeId
    app.get("/dPipe/:dPipeId", dPipes.findOne);

    // Update a dpipe with dpipeId
    app.put("/dPipe/:dPipeId", dPipes.update);

    // Delete a dpipe with dpipeId
    app.delete("/dPipe/:dPipeId", dPipes.delete);

    // Create a new dpipe
    app.delete("/dPipes", dPipes.deleteAll);
  };