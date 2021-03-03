module.exports = app => {
    const isostatus = require("./isostatus.controller.js");
  
    // Create a new user
    app.post("/api/isostatus", isostatus.create);

    // Retrieve all isostatus
    app.get("/api/isostatus", isostatus.findAll);

    // Retrieve a single user with isostatusId
    app.get("/api/isostatus/:isostatusId", isostatus.findOne);

    // Update a user with isostatusId
    app.put("/api/isostatus/:isostatusId", isostatus.update);

    // Delete a user with isostatusId
    app.delete("/api/isostatus/:isostatusId", isostatus.delete);

    // Create a new user
    app.delete("/api/isostatus", isostatus.deleteAll);
  };