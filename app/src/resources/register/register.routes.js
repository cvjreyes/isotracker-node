module.exports = app => {
    const register = require("./register.controller.js");

    app.post("/register", register.registerUser); //Registro por parte de un usario. Actualmente no se utiliza ya que es el lider el que crea los users
    
  };