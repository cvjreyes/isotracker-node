module.exports = app => {
    const pipectrls = require("./pipectrls.controller.js");

    app.get("/getPipesByStatus/:status", pipectrls.getPipesByStatus);
    
  };