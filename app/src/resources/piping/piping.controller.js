const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const pipingEstimated = (req, res) =>{
    sql.query('SELECT epipes.id, areas.name as area, tpipes.name as type, epipes.qty as quantity FROM epipes JOIN areas ON epipes.areas_id = areas.id JOIN tpipes ON epipes.tpipes_id = tpipes.id', (err, results) =>{
      res.json({
        rows: results
      }).status(200)
    })
  }
  
  const pipingTypes = (req, res) =>{
    sql.query('SELECT code, name, weight FROM tpipes', (err, results)=>{
      if(!results[0]){
        res.status(401)
      }else{
        res.json({
          rows: results
        }).status(200)
      }
    })
  }
  const submitPipingEstimated = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
      if(!rows[i]["Area"] || rows[i]["Area"] == "" || !rows[i]["Type"] || rows[i]["Type"] == ""){
        sql.query("DELETE FROM epipes WHERE id = ?", [rows[i]["id"]], (err, results)=>{
            if(err){
                console.log(err)
                res.status(401)
            }
        })
      }else{
        sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results)=>{
          const area_id = results[0].id
          sql.query("SELECT id FROM tpipes WHERE name = ?", [rows[i]["Type"]], (err, results)=>{
            const type_id = results[0].id
            sql.query("SELECT * FROM epipes WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO epipes(units_id, areas_id, tpipes_id, qty) VALUES(?,?,?,?)", [0, area_id, type_id, rows[i]["Quantity"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE epipes SET areas_id = ?, tpipes_id = ?, qty = ? WHERE id = ?", [area_id, type_id, rows[i]["Quantity"], rows[i]["id"]], (err, results) =>{
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
  
  const pipingWeight = async(req, res) =>{
    sql.query('SELECT qty, weight FROM epipes RIGHT JOIN tpipes ON epipes.tpipes_id = tpipes.id', (err, results)=>{
      const elines = results
      let eweight = 0
      for(let i = 0; i < elines.length; i++){
        eweight += elines[i].qty * elines[i].weight
      }
      sql.query("SELECT SUM(progress) FROM misoctrls WHERE revision = 0 OR (revision = 1 AND issued = 1)", (req, results) =>{
        const progress = results[0]["SUM(progress)"]
          sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 1", (err, results) =>{
            const tp1 = results[0]["COUNT(tpipes_id)"]
            sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 2", (err, results) =>{
              const tp2 = results[0]["COUNT(tpipes_id)"]
              sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 3", (err, results) =>{
                const tp3 = results[0]["COUNT(tpipes_id)"]
                sql.query("SELECT weight FROM tpipes", (err, results) =>{
                  const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
                  res.json({
                    weight: eweight,
                    progress: (progress/maxProgress * 100).toFixed(2)
                  }).status(200)
                })
              })
            
          })
        })
      })
        
        
    })
  }
  
module.exports = {
    pipingEstimated,
    pipingTypes,
    submitPipingEstimated,
    pipingWeight
  };