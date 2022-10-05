const express = require("express");
const router = express.Router();
const controller = require("../fileController/file.controller");

//Archivo general donde van todos las funciones que no entran en otro sitio (y algunas que si pero han acabado aqui)
let routes = (app) => {
  router.post("/upload", controller.upload);//Upload de una iso y attachments
  router.post("/uploadHis", controller.uploadHis);//Registro en el historial de la iso subida
  router.post("/update", controller.update);//Update de una iso y sus attachments
  router.post("/updateHis", controller.updateHis);//Registro en el historial del update
  router.get("/updateStatus", controller.updateStatus);//Select de todos los datos necesarios para general la tabla del estado del proyecto
  router.get("/api/statusFiles", controller.statusFiles);//Select de todas las isos en el proyecto para reflejarlas en la status table
  router.get("/api/historyFiles", controller.historyFiles);//Select de todas las transacciones en el proyecto para reflejarlas en la tabla del historial
  router.get("/api/modelled", controller.modelled);//Obtiene todas las lineas modeladas del proyecto
  router.post("/files", controller.getListFiles);//Recibe por post(deberia ser como parametro de un get) una bandeja(design, stress, etc) y devuelve todas las isos correspondientes
  router.get("/piStatus/:fileName", controller.piStatus)//Status de la parte de proceso/instrumentacion
  router.get("/getMaster/:fileName", controller.getMaster);//Get del archivo master de una iso
  router.get("/files/:name", controller.download);//Get de una iso con todos sus archivos
  router.post("/restore", controller.restore);//Restaurar una iso que habia sido eliminada
  router.post("/process", controller.toProcess);//Enviar una iso a procesos
  router.post("/instrument", controller.instrument);//Enviar una iso a instrumentacion
  router.post("/cancelProc", controller.cancelProc);//Cancelar una iso en procesos
  router.post("/cancelInst", controller.cancelInst);//Cancelar una iso en instrumentacion
  router.post("/filesProcInst", controller.filesProcInst);//Obtener todas las isos en proceso/instrumentacion actualmente
  router.post("/uploadProc", controller.uploadProc);//Subir archivo de proceso
  router.post("/uploadInst", controller.uploadInst);//Subir archivo de instrumentacion
  router.get("/download/:fileName", controller.download);//Descargar todos los archivos de una iso
  router.get("/getAttach/:fileName", controller.getAttach);//Comprobar si una iso tiene attachments
  router.post("/uploadReport", controller.uploadReport);//Subir archivo de dpipes manualmente
  router.get("/checkPipe/:fileName", controller.checkPipe);//Comprobar si una linea de isotracker sigue existiendo en dpipes

  router.post("/toIssue", controller.toIssue);//Emitir una iso
  router.post("/request", controller.request);//Request por parte de diseño de una nueva revision para una iso
  router.post("/newRev", controller.newRev);//Nueva revision

  router.post("/rename", controller.rename);//Renombrar una iso por parte de LOS para que coincida con el cambio en dpipes
  router.post("/unlock", controller.unlock);//Desbloquear una iso que habia sido bloqueada por no pertenecer a dpipes debido a un cambio, una vez arreglado
  router.post("/unlockAll", controller.unlockAll);//Desbloquear todas las isos que cumplen el criterio anterior
 
  router.post("/uploadEquisModelledReport", controller.uploadEquisModelledReport)//Subir archivo de equipos modelados
  router.post("/uploadEquisEstimatedReport", controller.uploadEquisEstimatedReport)//Subir archivo de equipos estimados
  router.post("/uploadInstModelledReport", controller.uploadInstModelledReport)//De aqui hasta el final del parrafo lo mismo para cada disciplina
  router.post("/uploadInstEstimatedReport", controller.uploadInstEstimatedReport)
  router.post("/uploadCivModelledReport", controller.uploadCivModelledReport)
  router.post("/uploadCivEstimatedReport", controller.uploadCivEstimatedReport)
  router.post("/uploadElecModelledReport", controller.uploadElecModelledReport)
  router.post("/uploadElecEstimatedReport", controller.uploadElecEstimatedReport)
  router.post("/uploadPipesEstimatedReport", controller.uploadPipesEstimatedReport)

  //Descarga del reporte de cada disciplina
  router.get("/downloadInstrumentationModelled", controller.downloadInstrumentationModelled)
  router.get("/downloadEquipmentModelled", controller.downloadEquipmentModelled)
  router.get("/downloadCivilModelled", controller.downloadCivilModelled)
  router.get("/downloadElectricalModelled", controller.downloadElectricalModelled)
  
  router.get("/navis", controller.navis)//Obtener datos de la tabla navisatselect

  router.post("/updateBOM", controller.updateBom)//Subit archivo BOM manualmente
  router.get("/exportModelled", controller.exportModelled)//Exportar lista de modeladas
  router.get("/exportNotModelled", controller.exportNotModelled)//Exportar lista de no modeladas
  router.get("/exportFull", controller.exportFull)//Exportar lista de todas las lineas
  router.get("/exportLineIdGroup", controller.exportLineIdGroup)//Exportar las lineas agrupadas por line id
  router.get("/exportHolds", controller.exportHolds)//Reporte de holds
  router.get("/exportHoldsNoProgress", controller.exportHoldsNoProgress)//Reporte de holds cuando el proyecto no tiene progreso
  router.get("/downloadBOM", controller.downloadBOM)//Descargar Bom table actual

  router.get("/holds", controller.holds)//Obtener los holds actuales

  router.get("/lastUser/:filename", controller.lastUser)//Obtener el ultimo usuario que efectuo un cambio sobre una iso

  router.post("/uploadNotifications", controller.uploadNotifications)//Agregar notificaciones(se usa pero creo que nadie le presta atencion)

  router.get("/pids", controller.getPids)//Obtener los PIDs del proyecto

  router.get("/timeTrack", controller.timeTrack)//Query compleja que obtiene el tiempo que ha estado cada isometrica en cada bandeja
  router.get("/exportTimeTrack", controller.exportTimeTrack)//Reporte de lo anterior

  router.get("/revision/:fileName", controller.revision)//Select de los datos actuales de la revision en issuer de una iso
  router.post("/submitRevision", controller.submitRevision)//Submit de los datos necesarios para completar una revision en issuer

  router.get("/excludeHold/:fileName", controller.excludeHold);//Excluir una iso del proceso automatico de holds
  router.post("/sendHold", controller.sendHold);//Enviar una iso a hold

  router.post("/getFilenamesByUser", controller.getFilenamesByUser)//Obtener los nombres de las isos que pertenecen a un usuario
  router.post("/createByPass", controller.createByPass)//Crear un bypass para una iso
  router.get("/getByPassData", controller.getByPassData)//Obtener los datos de todos los bypass
  router.post("/acceptByPass", controller.acceptByPass)//Aceptar un bypass
  router.post("/answerByPass", controller.answerByPass)//Responder al bypass con una de las opciones especificadas
  router.post("/rejectByPass", controller.rejectByPass)//Rechazar el bypass
  router.post("/naByPass", controller.naByPass)//Declarar el bypass no aplica
  router.post("/editByPass", controller.editByPass)//Editar un bypass existente
  router.post("/closeByPass", controller.closeByPass)//Cerrar un bypass
  router.post("/deleteByPass", controller.deleteByPass)//Eliminar un bypass
  router.get("/exportByPass", controller.exportByPass)//Obtener un reporte con todos los bypass

  router.get("/isCancellable/:filename", controller.isCancellable)//Comporbar si la nueva revision de una iso es cancelable(si aun no ha avanzado de diseño)
  router.post("/cancelRev", controller.cancelRev)//CAnclar la nueva revision
  router.get("/issuedFiles", controller.issuedFiles)//Obtener las isos emitidas
  app.use(router);
};

module.exports = routes;