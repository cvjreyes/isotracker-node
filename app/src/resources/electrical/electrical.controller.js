const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const elecEstimated = (req,res) =>{
    let rows = []
    let percentages = []
    
    sql.query('SELECT eelecsfull_view.area, eelecsfull_view.type_elec, eelecsfull_view.qty, delecsmodelled_view.modelled FROM eelecsfull_view LEFT JOIN delecsmodelled_view ON eelecsfull_view.area = delecsmodelled_view.area AND eelecsfull_view.type_elec = delecsmodelled_view.type_elec', (err, results1) =>{
      if(!results1[0]){
        res.status(401)
      }else{
        sql.query('SELECT percentage FROM pelecs', (err, results)=>{
          if(!results[0]){
            res.status(401)
          }else{
            for(let i = 0; i < results.length; i++){
              percentages.push(results[i].percentage)
            }
            for(let i = 0; i < results1.length; i++){
              if(!results1[i].modelled){
                results1[i].modelled = 0
              }
              let row = ({"area": results1[i].area, "type": results1[i].type_elec, "quantity": results1[i].qty, "modelled": results1[i].modelled})
              for(let i = 0; i < percentages.length; i++){
                row[percentages[i]] = 0
              }
              rows.push(row)
            }
  
            sql.query('SELECT area, type_elec, progress, count(*) as amount FROM delecsfull_view group by area, type_elec, progress' ,(err, results)=>{
              if(!results[0]){
                res.json({
                  rows: rows
                }).status(200)
              }else{
                for(let i = 0; i < results.length; i++){
                  for(let j = 0; j < rows.length; j++){
                    if(results[i].area == rows[j]["area"] && results[i].type_elec == rows[j]["type"]){
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
  
  const elecsEstimatedExcel = (req, res) =>{
    sql.query("SELECT eelecs.id, areas.name as area, telecs.name as type, eelecs.qty as quantity FROM eelecs LEFT JOIN areas ON eelecs.areas_id = areas.id LEFT JOIN telecs ON eelecs.telecs_id = telecs.id", (err, results)=>{
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
  
  const elecSteps = (req,res) =>{
    sql.query('SELECT id, name, percentage FROM pelecs', (err, results)=>{
      res.json({
        rows: results
      }).status(200)
    })
  }
  
  const elecModelled = (req, res) =>{
    sql.query('SELECT areas.`name` as area, delecs.tag as tag, telecs.`name` as type, telecs.weight as weight, pelecs.`name` as status, pelecs.percentage as progress FROM delecs JOIN areas ON delecs.areas_id = areas.id JOIN telecs ON delecs.telecs_id = telecs.id JOIN pelecs ON delecs.pelecs_id = pelecs.id', (err, results) =>{
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
  
  const elecTypes = (req, res) =>{
    sql.query('SELECT id, code, name, weight FROM telecs', (err, results)=>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  
  const elecWeight = (req, res) =>{
    sql.query('SELECT qty, weight FROM eelecs RIGHT JOIN telecs ON eelecs.telecs_id = telecs.id', (err, results)=>{
      const elines = results
      let eweight = 0
      for(let i = 0; i < elines.length; i++){
        eweight += elines[i].qty * elines[i].weight
      }
      sql.query('SELECT pelecs.percentage FROM delecs LEFT JOIN pelecs ON delecs.pelecs_id = pelecs.id', (err, results)=>{
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

  const submitElecTypes = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Code"] || rows[i]["Code"] == ""){
        sql.query("DELETE FROM telecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM telecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO telecs(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE telecs SET code = ?, name = ?, weight= ? WHERE id = ?", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"], rows[i]["id"]], (err, results) =>{
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
  
  const submitElecSteps = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Name"] || rows[i]["Name"] == ""){
        sql.query("DELETE FROM pelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM pelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO pelecs(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE pelecs SET name = ?, percentage = ? WHERE id = ?", [rows[i]["Name"], rows[i]["Percentage"], rows[i]["id"]], (err, results) =>{
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
  
  const submitElecEstimated = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Area"] || rows[i]["Area"] == "" || !rows[i]["Type"] || rows[i]["Type"] == ""){
        sql.query("DELETE FROM eelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results)=>{
          const area_id = results[0].id
          sql.query("SELECT id FROM telecs WHERE name = ?", [rows[i]["Type"]], (err, results)=>{
            const type_id = results[0].id
            sql.query("SELECT * FROM eelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO eelecs(units_id, areas_id, telecs_id, qty) VALUES(?,?,?,?)", [0, area_id, type_id, rows[i]["Quantity"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE eelecs SET areas_id = ?, telecs_id = ?, qty = ? WHERE id = ?", [area_id, type_id, rows[i]["Quantity"], rows[i]["id"]], (err, results) =>{
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
    elecEstimated,
    elecModelled,
    elecSteps,
    elecWeight,
    elecTypes,
    elecsEstimatedExcel,
    submitElecTypes,
    submitElecSteps,
    submitElecEstimated
  };