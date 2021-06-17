module.exports = app => {
    const progress = require("./progress.controller.js");

    // Retrieve all tpipe
    app.get("/gpipes", progress.gpipes);
    app.get("/gequips", progress.gequips);
    app.get("/ginsts", progress.ginsts)
    app.get("/gcivils", progress.gcivils)
  };