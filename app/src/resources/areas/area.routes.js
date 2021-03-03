module.exports = app => {
    const areas = require("./area.controller.js");
  
    // Create a new area
    app.post("/api/area", areas.create);

    // Retrieve all areas
    app.get("/api/areas", areas.findAll);

    // Retrieve a single area with areaId
    app.get("/api/area/:areaId", areas.findOne);

    // Update a area with areaId
    app.put("/api/area/:areaId", areas.update);

    // Delete a area with areaId
    app.delete("/api/area/:areaId", areas.delete);

    // Create a new area
    app.delete("/api/areas", areas.deleteAll);
  };