const express = require("express");
const router = express.Router();
const controller = require("../verify/verify.controller");

let routes = (app) => {
  router.post("/verify", controller.verify);
  router.post("/cancelVerify", controller.cancelVerify);


  app.use(router);
};

module.exports = routes;