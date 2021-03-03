module.exports = app => {
  const misoctrls = require("./misoctrl.controller.js");

  // Create a new misoctrl
  app.post("/api/misoctrl", misoctrls.create);

  // Retrieve all misoctrls
  app.get("/api/misoctrls", misoctrls.findAll);

  // Retrieve a single misoctrl with misoctrlId
  app.get("/api/misoctrl/:misoctrlId", misoctrls.findOne);

  // Update a misoctrl with misoctrlId
  app.put("/api/misoctrl/:misoctrlId", misoctrls.update);

  // Delete a misoctrl with misoctrlId
  app.delete("/api/misoctrl/:misoctrlId", misoctrls.delete);

  // Create a new misoctrl
  app.delete("/api/misoctrls", misoctrls.deleteAll);
};