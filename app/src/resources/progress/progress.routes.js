module.exports = app => {
    const progress = require("./progress.controller.js");

    // Retrieve all tpipe
    app.get("/gpipes", progress.gpipes);
  };