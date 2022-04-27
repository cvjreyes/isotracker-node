const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const instSteps = (req, res) =>{

    sql.query('SELECT id, name, percentage FROM pinsts', (err, results)=>{
      res.json({
        rows: results
      }).status(200)
    })
  
  }
  
  
  const instEstimated = (req, res) =>{
    let rows = []
    let percentages = []
    
    sql.query('SELECT einstsfull_view.area, einstsfull_view.type_inst, einstsfull_view.qty, dinstsmodelled_view.modelled FROM einstsfull_view LEFT JOIN dinstsmodelled_view ON einstsfull_view.area = dinstsmodelled_view.area AND einstsfull_view.type_inst = dinstsmodelled_view.type_inst', (err, results1) =>{
      if(!results1[0]){
        res.status(401)
      }else{
  
        sql.query('SELECT percentage FROM pinsts', (err, results)=>{
          if(!results[0]){
            res.status(401)
          }else{
            for(let i = 0; i < results.length; i++){
              percentages.push(results[i].percentage)
            }
            for(let i = 0; i < results1.length; i++){
              let row = ({"area": results1[i].area, "type": results1[i].type_inst, "quantity": results1[i].qty, "modelled": results1[i].modelled})
              for(let i = 0; i < percentages.length; i++){
                row[percentages[i]] = 0
              }
              rows.push(row)
            }
  
            sql.query('SELECT area, type_inst, progress, count(*) as amount FROM dinstsfull_view group by area, type_inst, progress' ,(err, results)=>{
              if(!results[0]){
                res.json({
                  rows: rows
                }).status(200)
              }else{
                for(let i = 0; i < results.length; i++){
                  for(let j = 0; j < rows.length; j++){
                    if(results[i].area == rows[j]["area"] && results[i].type_equi == rows[j]["type"]){
                      rows[j][results[i].progress] = results[i].amount
                    }
                  }
                }
                res.json({
                  rows: rows
                }).status(200)
              }
  
            })
            
          }
        })
      }
    })
  }
  
  const instsEstimatedExcel = (req, res) =>{
    sql.query("SELECT einsts.id, areas.name as area, tinsts.name as type, einsts.qty as quantity FROM einsts LEFT JOIN areas ON einsts.areas_id = areas.id LEFT JOIN tinsts ON einsts.tinsts_id = tinsts.id", (err, results)=>{
      if(err){
        console.log(err)
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }    
    })
  }
  
  const instWeight = (req,res) =>{
  
    sql.query('SELECT qty, weight FROM einsts RIGHT JOIN tinsts ON einsts.tinsts_id = tinsts.id', (err, results)=>{
      const elines = results
      let eweight = 0
      for(let i = 0; i < elines.length; i++){
        eweight += elines[i].qty * elines[i].weight
      }
      sql.query('SELECT pinsts.percentage FROM dinsts LEFT JOIN pinsts ON dinsts.pinsts_id = pinsts.id', (err, results)=>{
        let total_progress = 0
        for(let i = 0; i < results.length; i++){
          if(results[i].percentage == 100){
            total_progress += 100
         }else{
            total_progress += 70
          }
        }
  
        total_progress = total_progress/results.length
        
        res.json({
          weight: eweight,
          progress: total_progress.toFixed(2)
        }).status(200)
  
      })
        
    })
  }
  
  const instModelled = (req, res) =>{
    sql.query('SELECT areas.`name` as area, dinsts.tag as tag, tinsts.`name` as type, tinsts.weight as weight, pinsts.`name` as status, pinsts.percentage as progress FROM dinsts JOIN areas ON dinsts.areas_id = areas.id JOIN tinsts ON dinsts.tinsts_id = tinsts.id JOIN pinsts ON dinsts.pinsts_id = pinsts.id', (err, results) =>{
      if(!results[0]){
        res.status(401)
      }else{
  
        for(let i = 0; i < results.length; i++){
          if(results[i].progress != 100){
            results[i].progress = 70
          }
        }
        
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  
  const instTypes = (req, res) =>{
    sql.query('SELECT id, code, name, weight FROM tinsts', (err, results)=>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }

  const submitInstTypes = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Code"] || rows[i]["Code"] == ""){
        sql.query("DELETE FROM tinsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM tinsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO tinsts(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE tinsts SET code = ?, name = ?, weight= ? WHERE id = ?", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"], rows[i]["id"]], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }
        }) 
      }
    }
  
  }
  
  const submitInstSteps = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Name"] || rows[i]["Name"] == ""){
        sql.query("DELETE FROM pinsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM pinsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO pinsts(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE pinsts SET name = ?, percentage = ? WHERE id = ?", [rows[i]["Name"], rows[i]["Percentage"], rows[i]["id"]], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }
        }) 
      }
    }
  
  }
  
  const submitInstEstimated = (req, res) =>{
    const rows = req.body.rows
    
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Area"] || rows[i]["Area"] == "" || !rows[i]["Type"] || rows[i]["Type"] == ""){
        sql.query("DELETE FROM einsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results)=>{
          const area_id = results[0].id
          sql.query("SELECT id FROM tinsts WHERE name = ?", [rows[i]["Type"]], (err, results)=>{
            const type_id = results[0].id
            sql.query("SELECT * FROM einsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO einsts(units_id, areas_id, tinsts_id, qty) VALUES(?,?,?,?)", [0,area_id, type_id, rows[i]["Quantity"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE einsts SET areas_id = ?, tinsts_id = ?, qty = ? WHERE id = ?", [area_id, type_id, rows[i]["Quantity"], rows[i]["id"]], (err, results) =>{
                      if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }
          }) 
          })
        })
        
      }
    }
  }

module.exports = {
    instEstimated,
    instModelled,
    instSteps,
    instWeight,
    instTypes,
    instsEstimatedExcel,
    submitInstTypes,
    submitInstSteps,
    submitInstEstimated
  };