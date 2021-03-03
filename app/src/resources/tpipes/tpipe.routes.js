module.exports = app => {
    const tpipe = require("./tpipe.controller.js");
  
    // Create a new area
    app.post("/tpipe", tpipe.create);

    // Retrieve all tpipe
    app.get("/tpipes", tpipe.findAll);

    // Retrieve a single area with areaId
    app.get("/tpipe/:tpipeId", tpipe.findOne);

    // Update a area with areaId
    app.put("/tpipe/:tpipeId", tpipe.update);

    // Delete a area with areaId
    app.delete("/tpipe/:tpipeId", tpipe.delete);

    // Create a new area
    app.delete("/tpipes", tpipe.deleteAll);
  };