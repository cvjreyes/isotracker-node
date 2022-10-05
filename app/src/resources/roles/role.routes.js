module.exports = app => {
    const role = require("./role.controller.js");

    // Retrieve all tpipe
    app.get("/api/roles", role.findAll); //get de todos los roles
    app.get("/api/getroles/:username", role.findRolesByUsername); //Get de los roles de un usuario por username
    app.post("/api/roles/user", role.findByUser); //Get de los roles de un usuario por email
    app.get("/api/roles/acronyms", role.getAcronyms); //Get de los acronimos de todos los roles
  };