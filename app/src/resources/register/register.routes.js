module.exports = app => {
    const register = require("./register.controller.js");

    app.post("/register", register.registerUser);
    
  };