const express = require("express");
const router = express.Router();
const controller = require("../claim/claim.controller");

let routes = (app) => {
  router.post("/claim", controller.singleClaim);
  router.post("/claimProc", controller.singleClaimProc);
  router.post("/claimInst", controller.singleClaimInst);
  router.post("/forceClaim", controller.forceClaim);

  app.use(router);
};

module.exports = routes;