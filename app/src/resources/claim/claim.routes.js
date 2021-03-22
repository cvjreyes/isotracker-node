const express = require("express");
const router = express.Router();
const controller = require("../claim/claim.controller");

let routes = (app) => {
  router.post("/claim", controller.singleClaim);


  app.use(router);
};

module.exports = routes;