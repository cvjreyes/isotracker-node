const express = require("express");
const router = express.Router();
const controller = require("../claim/claim.controller");

let routes = (app) => {
  router.post("/claim", controller.singleClaim);//Claim de una iso
  router.post("/claimProc", controller.singleClaimProc);//Claim de una iso por parte de procesos
  router.post("/claimInst", controller.singleClaimInst);//Claim de una iso por parte de insturmentos
  router.post("/forceClaim", controller.forceClaim);//Claim forzado por parte de LOS

  app.use(router);
};

module.exports = routes;