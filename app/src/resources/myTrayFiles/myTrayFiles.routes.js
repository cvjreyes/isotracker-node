module.exports = app => {
    const myTrayFiles = require("./myTrayFiles.controller.js");

    app.post("/api/myTrayFiles/myFiles", myTrayFiles.getFilesByTray);//Select de las isos que ha claimeado el usuario
    
  };