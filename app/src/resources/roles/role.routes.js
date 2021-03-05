module.exports = app => {
    const role = require("./role.controller.js");

    // Retrieve all tpipe
    app.get("/api/roles", role.findAll);
  };