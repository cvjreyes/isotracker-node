const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const getBom = async(req, res) =>{
    sql.query("SELECT * FROM isocontrol_modelled", (err, results)=>{
      if(err){
        res.status(401)
      }else{
        res.json({rows: results}).status(200)
      }
    })
  }

  const getNotModelled = async(req, res) =>{
    sql.query("SELECT * FROM isocontrol_not_modelled", (err, results)=>{
      if(err){
        res.status(401)
      }else{
        res.json({rows: results}).status(200)
      }
    })
  }
  
  const isocontrolWeights = async(req, res) =>{
    let modelledWeight, notModelledWeight
    sql.query("SELECT SUM(total_weight) as modelledWeight FROM isocontrol_all_view WHERE area IS NOT null", (err, results)=>{
      if(err){
        res.status(401)
      }else{
        modelledWeight = results[0].modelledWeight
        sql.query("SELECT SUM(total_weight) as notModelledWeight FROM isocontrol_all_view WHERE area IS null", (err, results)=>{
          if(err){
            res.status(401)
          }else{
            notModelledWeight = results[0].notModelledWeight
            res.json({
              modelledWeight: modelledWeight,
              notModelledWeight: notModelledWeight
            })
          }
        })
      }
    })
  }

  const getIsocontrolFull = async(req, res)=>{
    sql.query("SELECT DISTINCT isocontrol_all_view.*, isocontrol_holds_view.* FROM isocontrol_all_view LEFT JOIN isocontrol_holds_view ON isocontrol_all_view.tag COLLATE utf8mb4_unicode_ci = isocontrol_holds_view.tag ", (err, results)=>{
      if(err){
        res.status(401)
      }else{
        res.send({rows: results}).status(200)
      }
    })
  }
  
  const isoControlGroupLineId = async(req, res) =>{
    sql.query("SELECT * FROM isocontrol_lineid_group WHERE line_id is not null", (err, results)=>{
      if(err){
        res.status(401)
      }else{
        res.send({rows: results}).status(200)
      }
    })
  }

module.exports = {
    getBom,
    getNotModelled,
    isocontrolWeights,
    getIsocontrolFull,
    isoControlGroupLineId
  };