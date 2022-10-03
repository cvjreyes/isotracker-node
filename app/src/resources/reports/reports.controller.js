const fs = require("fs");
const bodyParser = require('body-parser')
const sql = require("../../db.js");
var format = require('date-format');

const downloadHistory = async (req, res) => {
  sql.query("SELECT filename, `from`, `to`, created_at, comments, user FROM hisoctrls", (err, results) => {
    if (!results[0]) {
      res.status(401).send("El historial esta vacio")
    } else {
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const downloadStatus = async (req, res) => {
  sql.query("SELECT isoid, deleted, onhold, issued, `from`, `to`, role, verifydesign FROM misoctrls ORDER BY isoid ASC", (err, results) => { //Datos de todas las isos
    let delhold = results
    if (process.env.NODE_PROGRESS == "1") { //Si hay progreso se tiene en cuenta dpipes
      sql.query("SELECT misoctrls.isoid, deleted, onhold, issued, `from`, `to`, role,  misoctrls.created_at, misoctrls.updated_at, code, revision, verifydesign, claimed FROM misoctrls JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id ORDER BY misoctrls.isoid, misoctrls.`to` ASC", (err, results) => {
        delhold = results //Se usa mas adelante para extraer las holds y eliminadas
        sql.query("SELECT misoctrls.isoid, misoctrls.created_at, misoctrls.updated_at, code, revision, `to`, claimed FROM misoctrls JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id ORDER BY misoctrls.isoid, misoctrls.`to` ASC", (err, results) => {
          if (!results[0]) {
            res.status(401).send("El historial esta vacio")
          } else {
            pattern = "MM/dd/yyyy hh:mm:ss";
            for (let i = 0; i < results.length; i++) {
              if (results[i].isoid == "P620HASA0500516SS01_01") { //Una iso que me daba problemas y nunca supe porque
                console.log(results[i], delhold[i])
              }
              if (delhold[i].issued == null) { //Si no esta emitida esta on going
                results[i].revision = "ON GOING R" + results[i].revision
              } else { //Si esta emitida como issued
                let r = (results[i].revision - 1)
                results[i].revision = "ISSUED R" + r
              }
              if (delhold[i].deleted == 1) { //Si esta eliminada como deleted
                results[i].revision = "DELETED"
                results[i].to = delhold[i].from

              } else if (delhold[i].onhold == 1) {//si esta en hold como on hold
                results[i].revision = "ON HOLD"
                results[i].to = delhold[i].to
              }

              if (results[i].to == "LDE/Isocontrol") { //Cambio del nombre de la bandeja para adaptarse al front
                results[i].to = "LOS/Isocontrol"
              }

              if (results[i].to == "Design") { //Comprobacion de si la tiene un lider
                if (delhold[i].verifydesign == 1 || delhold[i].role == "DesignLead") {
                  results[i].to = "DESIGN LEAD"
                }
              }

              if (results[i].to == "Stress") { //Comprobacion de si la tiene un lider
                if (delhold[i].verifydesign == 1 || delhold[i].role == "StressLead") {
                  results[i].to = "STRESS LEAD"
                }
              }

              if (results[i].to == "Supports") { //Comprobacion de si la tiene un lider
                if (delhold[i].verifydesign == 1 || delhold[i].role == "SupportsLead") {
                  results[i].to = "SUPPORTS LEAD"
                }
              }

              if (results[i].claimed == 1) { //Comprobacion de si la tiene alguien en su bandeja
                results[i].claimed = "Yes"
              } else {
                results[i].claimed = "No"
              }


              //Formateo de las fechas
              results[i].to = results[i].to.toUpperCase()

              results[i].created_at = format(pattern, results[i].created_at)
              results[i].updated_at = format(pattern, results[i].updated_at)
            }
            res.json(JSON.stringify(results)).status(200) //Devoldemos el resultado como string para el excel
          }
        })
      })

    } else { //Lo mismo sin dpipes
      sql.query("SELECT misoctrls.isoid, misoctrls.created_at, misoctrls.updated_at, revision, `to`, claimed FROM misoctrls ORDER BY misoctrls.isoid ASC", (err, results) => {
        if (!results[0]) {
          res.status(401).send("El historial esta vacio")
        } else {
          pattern = "MM/dd/yyyy hh:mm:ss";
          for (let i = 0; i < results.length; i++) {

            if (delhold[i].issued == null) {
              results[i].revision = "ON GOING R" + results[i].revision
            } else {
              let r = results[i].revision - 1
              results[i].revision = "ISSUED R" + r
            }
            if (delhold[i].deleted == 1) {
              results[i].revision = "DELETED"
              results[i].to = delhold[i].from

            } else if (delhold[i].onhold == 1) {
              results[i].revision = "ON HOLD"
              results[i].to = delhold[i].from
            }

            if (results[i].to == "LDE/Isocontrol") {
              results[i].to = "LOS/Isocontrol"
            }

            if (results[i].to == "Design") {
              if (delhold[i].verifydesign == 1 || delhold[i].role == "DesignLead") {
                results[i].to = "DESIGN LEAD"
              }
            }

            if (results[i].to == "Stress") {
              if (delhold[i].verifydesign == 1 || delhold[i].role == "StressLead") {
                results[i].to = "STRESS LEAD"
              }
            }

            if (results[i].to == "Supports") {
              if (delhold[i].verifydesign == 1 || delhold[i].role == "SupportsLead") {
                results[i].to = "SUPPORTS LEAD"
              }
            }

            if (results[i].claimed == 1) {
              results[i].claimed = "Yes"
            } else {
              results[i].claimed = "No"
            }

            results[i].to = results[i].to.toUpperCase()


            results[i].created_at = format(pattern, results[i].created_at)
            results[i].updated_at = format(pattern, results[i].updated_at)
          }

          res.json(JSON.stringify(results)).status(200)
        }
      })
    }
  })


}

const downloadPI = async (req, res) => {
  sql.query("SELECT isoid, spo, sit, updated_at FROM misoctrls WHERE spo != 0 OR sit != 0", (err, results) => { //Cogemos las isos en P/I
    if (!results[0]) {
      res.status(401).send("El historial esta vacio")
    } else {
      pattern = "MM/dd/yyyy hh:mm:ss";
      for (let i = 0; i < results.length; i++) {

        //Cada valor posible del campo spo corresponde a un estado de la iso
        if (results[i].spo == 0) {
          results[i].spo = "---"
        } else if (results[i].spo == 1) {
          results[i].spo = "TO CHECK"
        } else if (results[i].spo == 2) {
          results[i].spo = "ACCEPTED"
        } else if (results[i].spo == 3) {
          results[i].spo = "REJECTED"
        } else {
          results[i].spo = "TO CHECK (+)"
        }

        //Cada valor posible del campo sit corresponde a un estado de la iso
        if (results[i].sit == 0) {
          results[i].sit = "---"
        } else if (results[i].sit == 1) {
          results[i].sit = "TO CHECK"
        } else if (results[i].sit == 2) {
          results[i].sit = "ACCEPTED"
        } else if (results[i].sit == 3) {
          results[i].sit = "REJECTED"
        } else {
          results[i].sit = "TO CHECK (+)"
        }

        results[i].updated_at = format(pattern, results[i].updated_at)
      }

      res.json(JSON.stringify(results)).status(200)
    }
  })
}
const downloadIssued = async (req, res) => {
  sql.query("SELECT filename FROM misoctrls", (err, results) => {
    if (!results[0]) {
      res.status(401).send("El historial esta vacio")
    } else {
      sql.query("SELECT isoid, revision, issued, issued_date FROM misoctrls", (err, results) => {//Cogemos todas las isos
        if (!results[0]) {
          res.status(401).send("El historial esta vacio")
        } else {
          const pattern = "MM/dd/yyyy hh:mm:ss";
          let isos_index = [] //Aqui guardamos las isos que se van leyendo para ver cuando una iso tiene mas de una revision
          let isos = []
          //Aqui se utiliza un diccionario para registrar cada revision de una iso
          for (let i = 0; i < results.length; i++) {

            if (isos_index.includes(results[i].isoid)) { //Si esta iso ya ha sido registrada se guarda su posicion
              index = isos_index.indexOf(results[i].isoid)
            } else { //Si es nueva se guarda en el array de indices
              isos_index.push(results[i].isoid)
              isos.push({ isoid: results[i].isoid, rev0: "", rev1: "", rev2: "", rev3: "", rev4: "" }) //Creamos el registro en el diccionario
              index = isos.length - 1
            }

            //En funcion de la revision guardamos la fecha en el campo del diccionario correspondiente
            if (results[i].revision == 1) {
              if (results[i].issued == 1) {
                isos[index].rev0 = results[i].issued_date
              }
            }
            if (results[i].revision == 2) {
              if (results[i].issued == 1) {
                isos[index].rev1 = results[i].issued_date
              }
            }
            if (results[i].revision == 3) {
              if (results[i].issued == 1) {
                isos[index].rev2 = results[i].issued_date
              }
            }
            if (results[i].revision == 4) {
              if (results[i].issued == 1) {
                isos[index].rev3 = results[i].issued_date
              }
            }
            if (results[i].revision == 5) {
              if (results[i].issued == 1) {
                isos[index].rev4 = results[i].issued_date
              }
            }

          }
          res.json(JSON.stringify(isos)).status(200)
        }

      })



    }
  })
}

const downloadStatus3D = async (req, res) => {
  sql.query('SELECT tag, tpipes_id, `to`, `from`, claimed, issued FROM dpipes_view RIGHT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid ORDER BY misoctrls.id DESC', (err, results) => {

    let log = []
    let lines = []
    let ifc_ifd = ""
    let status = ""
    if (process.env.NODE_IFC == 0) {
      ifc_ifd = "IFD"
    } else {
      ifc_ifd = "IFC"
    }
    log.push("DESIGN")
    log.push("\n")
    log.push("ONERROR CONTINUE")

    for (let i = 0; i < results.length; i++) {
      if (lines.indexOf(results[i].tag) < 0) {
        log.push("/" + results[i].tag + " STM ASS /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd)
        log.push("HANDLE ANY")
        log.push("ENDHANDLE")
        status = results[i].to
        if (status == "Design" && results[i].from == "" && results[i].claimed == 0) {
          status = "New"
        } else if (status == "LDE/Isocontrol" && (results[i].issued == 0 || !results[i].issued)) {
          status = "Issuer"
        } else if (results[i].issued == 1) {
          status = "Transmittal"
        } else if (status == "On hold") {
          status = results[i].from
        }

        if (status != "Recycle bin" && status != "On hold") {
          log.push("/" + results[i].tag + " STM SET /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd + " /TL" + results[i].tpipes_id + "-" + status)
        }

        lines.push(results[i].tag)
      }

    }
    log.push("SAVEWORK")
    log.push("UNCLAIM ALL")
    log.push("FINISH")
    res.json({
      log: log
    }).status(200)
  })
}

const downloadModelled = async (req, res) => {

  sql.query('SELECT tag, isoid, tpipes_id FROM dpipes_view', (err, results) => {
    if (!results[0]) {
      res.status(401).send("El historial esta vacio")
    } else {
      let rows = []
      for (let i = 0; i < results.length; i++) {
        rows.push(results[i])
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}


module.exports = {
  downloadHistory,
  downloadStatus,
  downloadPI,
  downloadIssued,
  downloadStatus3D,
  downloadModelled,
}