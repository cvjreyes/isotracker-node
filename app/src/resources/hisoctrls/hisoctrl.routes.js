module.exports = app => {
    const hisoctrls = require("./hisoctrl.controller.js");
  
    // Create a new hisoctrl
    app.post("/hisoctrl", hisoctrls.create);

    // Retrieve all hisoctrls
    app.get("/hisoctrls", hisoctrls.findAll);

    // Retrieve a single hisoctrl with hisoctrlId
    app.get("/hisoctrls/:hisoctrlId", hisoctrls.findOne);

    // Update a hisoctrl with hisoctrlId
    app.put("/hisoctrls/:hisoctrlId", hisoctrls.update);

    // Delete a hisoctrl with hisoctrlId
    app.delete("/hisoctrls/:hisoctrlId", hisoctrls.delete);

    // Create a new hisoctrl
    app.delete("/hisoctrls", hisoctrls.deleteAll);
  };