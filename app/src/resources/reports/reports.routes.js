const express = require("express");
const router = express.Router();
const controller = require("../reports/reports.controller");

let routes = (app) => {
    router.get("/downloadHistory", controller.downloadHistory);
    router.get("/downloadStatus", controller.downloadStatus);
    router.get("/downloadPI", controller.downloadPI);
    router.get("/downloadIssued", controller.downloadIssued);
    router.get("/downloadStatus3D", controller.downloadStatus3D);
    router.get("/downloadModelled", controller.downloadModelled);
    app.use(router);
};

module.exports = routes;