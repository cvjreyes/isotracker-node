module.exports = app => {
  const misoctrls = require("./misoctrl.controller.js");

  // Create a new misoctrl
  app.post("/misoctrl", misoctrls.create);

  // Retrieve all misoctrls
  app.get("/misoctrls", misoctrls.findAll);

  // Retrieve a single misoctrl with misoctrlId
  app.get("/misoctrl/:misoctrlId", misoctrls.findOne);

  // Update a misoctrl with misoctrlId
  app.put("/misoctrl/:misoctrlId", misoctrls.update);

  // Delete a misoctrl with misoctrlId
  app.delete("/misoctrl/:misoctrlId", misoctrls.delete);

  // Create a new misoctrl
  app.delete("/misoctrls", misoctrls.deleteAll);
};