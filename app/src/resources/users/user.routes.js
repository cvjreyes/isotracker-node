module.exports = app => {
    const users = require("./user.controller.js");
  
    // Create a new user
    app.post("/api/user", users.create);

    // Retrieve all users
    app.get("/api/users", users.findAll);

    // Retrieve a single user with userId
    app.get("/api/user/:userId", users.findOne);

    // Retrieve a single user with email
    app.get("/api/userEmail/:userEmail", users.findOneByEmail);

    // Retrieve a single user with username
    app.post("/api/findByEmail", users.findOneByUsername);

    // Update a user with userId
    app.put("/api/user/:userId", users.update);

    // Delete a user with userId
    app.delete("/api/user/:userId", users.delete);

    // Create a new user
    app.delete("/api/users", users.deleteAll);
  };