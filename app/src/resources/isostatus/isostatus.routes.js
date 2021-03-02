module.exports = app => {
    const isostatus = require("./isostatus.controller.js");
  
    // Create a new user
    app.post("/isostatus", isostatus.create);

    // Retrieve all isostatus
    app.get("/isostatus", isostatus.findAll);

    // Retrieve a single user with isostatusId
    app.get("/isostatus/:isostatusId", isostatus.findOne);

    // Update a user with isostatusId
    app.put("/isostatus/:isostatusId", isostatus.update);

    // Delete a user with isostatusId
    app.delete("/isostatus/:isostatusId", isostatus.delete);

    // Create a new user
    app.delete("/isostatus", isostatus.deleteAll);
  };