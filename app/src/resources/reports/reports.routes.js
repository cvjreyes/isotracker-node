const express = require("express");
const router = express.Router();
const controller = require("../reports/reports.controller");

let routes = (app) => {
    router.get("/downloadHistory", controller.downloadHistory); //Reporte historial
    router.get("/downloadStatus", controller.downloadStatus); //Reporte status
    router.get("/downloadPI", controller.downloadPI); //Reporte procesos/instrumentacion
    router.get("/downloadIssued", controller.downloadIssued); //Reporte emitidas
    router.get("/downloadStatus3D", controller.downloadStatus3D); //Reporte status e3d
    router.get("/downloadModelled", controller.downloadModelled); //Reporte modeladas
    app.use(router);
};

module.exports = routes;