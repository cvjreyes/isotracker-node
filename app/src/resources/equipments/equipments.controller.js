const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const equipEstimated = (req, res) =>{

    let rows = []
    let percentages = []
    
    sql.query('SELECT eequisfull_view.area, eequisfull_view.type_equi, eequisfull_view.qty, dequismodelled_view.modelled FROM eequisfull_view LEFT JOIN dequismodelled_view ON eequisfull_view.area = dequismodelled_view.area AND eequisfull_view.type_equi = dequismodelled_view.type_equi', (err, results1) =>{
      if(!results1[0]){
        res.status(401)
      }else{
  
        sql.query('SELECT percentage FROM pequis', (err, results)=>{
          if(!results[0]){
            res.status(401)
          }else{
            for(let i = 0; i < results.length; i++){
              percentages.push(results[i].percentage)
            }
            for(let i = 0; i < results1.length; i++){
              let row = ({"area": results1[i].area, "type": results1[i].type_equi, "quantity": results1[i].qty, "modelled": results1[i].modelled})
              for(let i = 0; i < percentages.length; i++){
                row[percentages[i]] = 0
              }
              rows.push(row)
            }
  
            sql.query('SELECT area, type_equi, progress, count(*) as amount FROM dequisfull_view group by area, type_equi, progress' ,(err, results)=>{
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
  
  const equipEstimatedExcel = (req, res) =>{
    sql.query("SELECT eequis.id, areas.name as area, tequis.name as type, eequis.qty as quantity FROM eequis LEFT JOIN areas ON eequis.areas_id = areas.id LEFT JOIN tequis ON eequis.tequis_id = tequis.id", (err, results)=>{
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
  
  const equipSteps = (req, res) =>{
    sql.query('SELECT id, name, percentage FROM pequis', (err, results)=>{
        res.json({
          rows: results
        }).status(200)
      })
  }
  
  const equipWeight = (req,res) =>{
  
    sql.query('SELECT qty, weight FROM eequis RIGHT JOIN tequis ON eequis.tequis_id = tequis.id', (err, results)=>{
      const elines = results
      let eweight = 0
      for(let i = 0; i < elines.length; i++){
        eweight += elines[i].qty * elines[i].weight
      }
      sql.query('SELECT pequis.percentage FROM dequis LEFT JOIN pequis ON dequis.pequis_id = pequis.id', (err, results)=>{
        let total_progress = 0
        for(let i = 0; i < results.length; i++){
          if(results[i].percentage == 100){
            total_progress += 100
         }else{
            total_progress += 65
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
  
  const equipTypes = (req, res) =>{
    sql.query('SELECT id, code, name, weight FROM tequis', (err, results)=>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  
  const equipModelled = (req, res) =>{
    sql.query('SELECT areas.`name` as area, dequis.tag as tag, dequis.elements, tequis.`name` as type, tequis.weight as weight, pequis.`name` as status, pequis.percentage as progress FROM dequis JOIN areas ON dequis.areas_id = areas.id JOIN tequis ON dequis.tequis_id = tequis.id JOIN pequis ON dequis.pequis_id = pequis.id', (err, results) =>{
      if(!results[0]){
        res.status(401)
      }else{
  
        for(let i = 0; i < results.length; i++){
  
          if(results[i].elements == 0){
            results[i].progress = 10
          }else if(results[i].progress != 100){
            results[i].progress = 65
          }else{
            results[i].progress = 100
          }
        }
  
        res.json({
          rows: results
        }).status(200)
      }
    })
  }

  const submitEquipTypes = (req, res) =>{
    const rows = req.body.rows
    
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Code"] || rows[i]["Code"] == ""){
        sql.query("DELETE FROM tequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM tequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO tequis(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE tequis SET code = ?, name = ?, weight= ? WHERE id = ?", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"], rows[i]["id"]], (err, results) =>{
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
  
  const submitEquipSteps = (req, res) =>{
    const rows = req.body.rows
  
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Name"] || rows[i]["Name"] == ""){
        sql.query("DELETE FROM pequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM pequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO pequis(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE pequis SET name = ?, percentage = ? WHERE id = ?", [rows[i]["Name"], rows[i]["Percentage"], rows[i]["id"]], (err, results) =>{
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
  
  const submitEquipEstimated = (req, res) =>{
    const rows = req.body.rows
  
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Area"] || rows[i]["Area"] == "" || !rows[i]["Type"] || rows[i]["Type"] == ""){
        sql.query("DELETE FROM eequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results)=>{
          const area_id = results[0].id
          sql.query("SELECT id FROM tequis WHERE name = ?", [rows[i]["Type"]], (err, results)=>{
            const type_id = results[0].id
            sql.query("SELECT * FROM eequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO eequis(units_id, areas_id, tequis_id, qty) VALUES(?,?,?,?)", [0, area_id, type_id, rows[i]["Quantity"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE eequis SET areas_id = ?, tequis_id = ?, qty = ? WHERE id = ?", [area_id, type_id, rows[i]["Quantity"], rows[i]["id"]], (err, results) =>{
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
    equipEstimated,
    equipModelled,
    equipSteps,
    equipWeight,
    equipTypes,
    equipEstimatedExcel,
    submitEquipTypes,
    submitEquipSteps,
    submitEquipEstimated
  };