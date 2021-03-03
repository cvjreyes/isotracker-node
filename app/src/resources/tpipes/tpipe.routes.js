module.exports = app => {
    const tpipe = require("./tpipe.controller.js");
  
    // Create a new area
    app.post("/api/tpipe", tpipe.create);

    // Retrieve all tpipe
    app.get("/api/tpipes", tpipe.findAll);

    // Retrieve a single area with areaId
    app.get("/api/tpipe/:tpipeId", tpipe.findOne);

    // Update a area with areaId
    app.put("/api/tpipe/:tpipeId", tpipe.update);

    // Delete a area with areaId
    app.delete("/api/tpipe/:tpipeId", tpipe.delete);

    // Create a new area
    app.delete("/api/tpipes", tpipe.deleteAll);
  };