module.exports = app => {
    const ppipes_ifc = require("./ppipes_ifc.controller.js");
  
    // Create a new area
    app.post("/ppipes_ifc", ppipes_ifc.create);

    // Retrieve all ppipes_ifc
    app.get("/ppipes_ifcs", ppipes_ifc.findAll);

    // Retrieve a single area with areaId
    app.get("/ppipes_ifc/:ppipes_ifcId", ppipes_ifc.findOne);

    // Update a area with areaId
    app.put("/ppipes_ifc/:ppipes_ifcId", ppipes_ifc.update);

    // Delete a area with areaId
    app.delete("/ppipes_ifc/:ppipes_ifcId", ppipes_ifc.delete);

    // Create a new area
    app.delete("/ppipes_ifcs", ppipes_ifc.deleteAll);
  };