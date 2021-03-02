module.exports = app => {
    const areas = require("./area.controller.js");
  
    // Create a new area
    app.post("/area", areas.create);

    // Retrieve all areas
    app.get("/areas", areas.findAll);

    // Retrieve a single area with areaId
    app.get("/areas/:areaId", areas.findOne);

    // Update a area with areaId
    app.put("/areas/:areaId", areas.update);

    // Delete a area with areaId
    app.delete("/areas/:areaId", areas.delete);

    // Create a new area
    app.delete("/areas", areas.deleteAll);
  };