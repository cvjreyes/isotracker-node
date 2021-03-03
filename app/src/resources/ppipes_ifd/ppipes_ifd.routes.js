module.exports = app => {
    const ppipes_ifd = require("./ppipes_ifd.controller.js");
  
    // Create a new area
    app.post("/api/ppipes_ifd", ppipes_ifd.create);

    // Retrieve all ppipes_ifd
    app.get("/api/ppipes_ifds", ppipes_ifd.findAll);

    // Retrieve a single area with areaId
    app.get("/api/ppipes_ifd/:ppipes_ifdId", ppipes_ifd.findOne);

    // Update a area with areaId
    app.put("/api/ppipes_ifd/:ppipes_ifdId", ppipes_ifd.update);

    // Delete a area with areaId
    app.delete("/api/ppipes_ifd/:ppipes_ifdId", ppipes_ifd.delete);

    // Create a new area
    app.delete("/api/ppipes_ifds", ppipes_ifd.deleteAll);
  };