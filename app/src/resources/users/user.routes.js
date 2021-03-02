module.exports = app => {
    const users = require("./user.controller.js");
  
    // Create a new user
    app.post("/user", users.create);

    // Retrieve all users
    app.get("/users", users.findAll);

    // Retrieve a single user with userId
    app.get("/users/:userId", users.findOne);

    // Update a user with userId
    app.put("/users/:userId", users.update);

    // Delete a user with userId
    app.delete("/users/:userId", users.delete);

    // Create a new user
    app.delete("/users", users.deleteAll);
  };