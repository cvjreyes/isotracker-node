const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const civSteps = (req,res) =>{
    sql.query('SELECT id, name, percentage FROM pcivils', (err, results)=>{
      res.json({
        rows: results
      }).status(200)
    })
  }
  
  const civEstimated = (req,res) =>{
    let rows = []
    let percentages = []
    
    sql.query('SELECT ecivilsfull_view.area, ecivilsfull_view.type_civil, ecivilsfull_view.qty, dcivilsmodelled_view.modelled FROM ecivilsfull_view LEFT JOIN dcivilsmodelled_view ON ecivilsfull_view.area = dcivilsmodelled_view.area AND ecivilsfull_view.type_civil = dcivilsmodelled_view.type_civil', (err, results1) =>{
      if(!results1[0]){
        res.status(401)
      }else{
  
        sql.query('SELECT percentage FROM pcivils', (err, results)=>{
          if(!results[0]){
            res.status(401)
          }else{
            for(let i = 0; i < results.length; i++){
              percentages.push(results[i].percentage)
            }
            for(let i = 0; i < results1.length; i++){
              let row = ({"area": results1[i].area, "type": results1[i].type_civil, "quantity": results1[i].qty, "modelled": results1[i].modelled})
              for(let i = 0; i < percentages.length; i++){
                row[percentages[i]] = 0
              }
              rows.push(row)
            }
  
            sql.query('SELECT area, type_civil, progress, count(*) as amount FROM dcivilsfull_view group by area, type_civil, progress' ,(err, results)=>{
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
  
  const civilsEstimatedExcel = (req, res) =>{
    sql.query("SELECT ecivils.id, areas.name as area, tcivils.name as type, ecivils.qty as quantity FROM ecivils LEFT JOIN areas ON ecivils.areas_id = areas.id LEFT JOIN tcivils ON ecivils.tcivils_id = tcivils.id", (err, results)=>{
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
  
  const civModelled = (req, res) =>{
    sql.query('SELECT areas.`name` as area, dcivils.tag as tag, tcivils.`name` as type, tcivils.weight as weight, pcivils.`name` as status, pcivils.percentage as progress FROM dcivils JOIN areas ON dcivils.areas_id = areas.id JOIN tcivils ON dcivils.tcivils_id = tcivils.id JOIN pcivils ON dcivils.pcivils_id = pcivils.id', (err, results) =>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  
  const civTypes = (req, res) =>{
    sql.query('SELECT id, code, name, weight FROM tcivils', (err, results)=>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  
  const civWeight = (req, res) =>{
    sql.query('SELECT qty, weight FROM ecivils RIGHT JOIN tcivils ON ecivils.tcivils_id = tcivils.id', (err, results)=>{
      const elines = results
      let eweight = 0
      for(let i = 0; i < elines.length; i++){
        eweight += elines[i].qty * elines[i].weight
      }
      sql.query('SELECT SUM(weight) as w FROM dcivils JOIN tcivils ON dcivils.tcivils_id = tcivils.id', (err, results)=>{
        if(!results[0].w){
          res.json({
            weight: eweight,
            progress: 0
          })
        }else{
          const maxweight = results[0].w
          
          sql.query('SELECT weight, percentage FROM dcivils JOIN tcivils ON dcivils.tcivils_id = tcivils.id JOIN pcivils ON dcivils.pcivils_id = pcivils.id', (err, results) =>{
            if(!results[0]){
              res.status(401)
            }else{
              const dlines = results
              let dweight = 0
              for(let i = 0; i < dlines.length; i++){
                dweight += dlines[i].weight * dlines[i].percentage/100
              }
              res.json({
                weight: eweight,
                progress: (dweight/eweight*100).toFixed(2)
              })
            }
          })
          
        }
      })
        
    })
  }
  const submitCivilTypes = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Code"] || rows[i]["Code"] == ""){
        sql.query("DELETE FROM tcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM tcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO tcivils(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE tcivils SET code = ?, name = ?, weight= ? WHERE id = ?", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"], rows[i]["id"]], (err, results) =>{
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
  
  const submitCivilSteps = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Name"] || rows[i]["Name"] == ""){
        sql.query("DELETE FROM pcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT * FROM pcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(!results[0]){
              sql.query("INSERT INTO pcivils(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
                if(err){
                        console.log(err)
                        res.status(401)
                    }
                })
            }else{
                sql.query("UPDATE pcivils SET name = ?, percentage = ? WHERE id = ?", [rows[i]["Name"], rows[i]["Percentage"], rows[i]["id"]], (err, results) =>{
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
  
  const submitCivilEstimated = (req, res) =>{
    const rows = req.body.rows
    
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Area"] || rows[i]["Area"] == "" || !rows[i]["Type"] || rows[i]["Type"] == ""){
        sql.query("DELETE FROM ecivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results)=>{
          const area_id = results[0].id
          sql.query("SELECT id FROM tcivils WHERE name = ?", [rows[i]["Type"]], (err, results)=>{
            const type_id = results[0].id
            sql.query("SELECT * FROM ecivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO ecivils(units_id, areas_id, tcivils_id, qty) VALUES(?,?,?,?)", [0, area_id, type_id, rows[i]["Quantity"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE ecivils SET areas_id = ?, tcivils_id = ?, qty = ? WHERE id = ?", [area_id, type_id, rows[i]["Quantity"], rows[i]["id"]], (err, results) =>{
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
    civEstimated,
    civModelled,
    civSteps,
    civWeight,
    civTypes,
    civilsEstimatedExcel,
    submitCivilTypes,
    submitCivilSteps,
    submitCivilEstimated
  };