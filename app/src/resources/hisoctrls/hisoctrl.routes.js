module.exports = app => {
    const hisoctrls = require("./hisoctrl.controller.js");
  
    // Create a new hisoctrl
    app.post("/api/hisoctrl", hisoctrls.create);

    // Retrieve all hisoctrls
    app.get("/api/hisoctrls", hisoctrls.findAll);

    // Retrieve a single hisoctrl with hisoctrlId
    app.get("/api/hisoctrl/:hisoctrlId", hisoctrls.findOne);

    // Update a hisoctrl with hisoctrlId
    app.put("/api/hisoctrl/:hisoctrlId", hisoctrls.update);

    // Delete a hisoctrl with hisoctrlId
    app.delete("/api/hisoctrl/:hisoctrlId", hisoctrls.delete);

    // Create a new hisoctrl
    app.delete("/api/hisoctrls", hisoctrls.deleteAll);
  };