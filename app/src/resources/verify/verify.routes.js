const express = require("express");
const router = express.Router();
const controller = require("../verify/verify.controller");

let routes = (app) => {
  router.post("/verify", controller.verify); //Verify para enviar al lider
  router.post("/cancelVerify", controller.cancelVerify); //Cancelar verify


  app.use(router);
};

module.exports = routes;