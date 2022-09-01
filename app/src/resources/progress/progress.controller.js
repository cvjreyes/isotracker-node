const fs = require('fs');
const sql = require("../../db.js");

const gpipes = async(req,res) =>{
    sql.query('SELECT * FROM gpipes', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gequips = async(req,res) =>{
    sql.query('SELECT * FROM gequis', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const ginsts = async(req,res) =>{
    sql.query('SELECT * FROM ginsts', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gcivils = (req, res) =>{
    sql.query('SELECT * FROM gcivils', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gelecs = (req, res) =>{
    sql.query('SELECT * FROM gelecs', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gcurve = (req,res) =>{
    sql.query('SELECT gpipes.week as week, gpipes.progress as progress_pipes, gpipes.estimated as estimated_pipes, gequis.progress as progress_equis, gequis.estimated as estimated_equis, ginsts.progress as progress_insts, ginsts.estimated as estimated_insts, gelecs.progress as progress_elecs, gelecs.estimated as estimated_elecs, gcivils.progress as progress_civils, gcivils.estimated as estimated_civils FROM gpipes JOIN gequis on gpipes.id = gequis.id JOIN ginsts ON gpipes.id = ginsts.id JOIN gelecs ON gpipes.id = gelecs.id JOIN gcivils ON gpipes.id = gcivils.id', (err, results)=>{
        if(err){
            res.status(401)
        }else{

            res.json({
                rows: results
            }).status(200)
        }
        
    })  
}

const submitEquipProgress = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
        if(!rows[i]["Week"] || rows[i]["Week"] == ""){
          sql.query("DELETE FROM gequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(err){
                  console.log(err)
                  res.status(401)
              }
          })
        }else{
          sql.query("SELECT * FROM gequis WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO gequis(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE gequis SET week = ?, estimated = ? WHERE id = ?", [rows[i]["Week"], rows[i]["Estimated"], rows[i]["id"]], (err, results) =>{
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

const submitInstProgress = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
        if(!rows[i]["Week"] || rows[i]["Week"] == ""){
          sql.query("DELETE FROM ginsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(err){
                  console.log(err)
                  res.status(401)
              }
          })
        }else{
          sql.query("SELECT * FROM ginsts WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO ginsts(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE ginsts SET week = ?, estimated = ? WHERE id = ?", [rows[i]["Week"], rows[i]["Estimated"], rows[i]["id"]], (err, results) =>{
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

const submitCivilProgress = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
        if(!rows[i]["Week"] || rows[i]["Week"] == ""){
          sql.query("DELETE FROM gcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(err){
                  console.log(err)
                  res.status(401)
              }
          })
        }else{
          sql.query("SELECT * FROM gcivils WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO gcivils(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE gcivils SET week = ?, estimated = ? WHERE id = ?", [rows[i]["Week"], rows[i]["Estimated"], rows[i]["id"]], (err, results) =>{
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

const submitElecProgress = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
        if(!rows[i]["Week"] || rows[i]["Week"] == ""){
          sql.query("DELETE FROM gelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(err){
                  console.log(err)
                  res.status(401)
              }
          })
        }else{
          sql.query("SELECT * FROM gelecs WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO gelecs(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE gelecs SET week = ?, estimated = ? WHERE id = ?", [rows[i]["Week"], rows[i]["Estimated"], rows[i]["id"]], (err, results) =>{
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

const submitPipingProgress = (req, res) =>{
    const rows = req.body.rows
    for(let i = 1; i < rows.length; i++){
        if(!rows[i]["Week"] || rows[i]["Week"] == ""){
          sql.query("DELETE FROM gpipes WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(err){
                  console.log(err)
                  res.status(401)
              }
          })
        }else{
          sql.query("SELECT * FROM gpipes WHERE id = ?", [rows[i]["id"]], (err, results)=>{
              if(!results[0]){
                sql.query("INSERT INTO gpipes(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                  if(err){
                          console.log(err)
                          res.status(401)
                      }
                  })
              }else{
                  sql.query("UPDATE gpipes SET week = ?, estimated = ? WHERE id = ?", [rows[i]["Week"], rows[i]["Estimated"], rows[i]["id"]], (err, results) =>{
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

const currentProgress = async(req,res) =>{
    let progress = 0
    let realprogress = 0
    sql.query("SELECT SUM(progress) FROM misoctrls WHERE revision = 0 OR (revision = 1 AND issued = 1)", (req, results) =>{
      if(results[0]["SUM(progress)"]){
        progress = results[0]["SUM(progress)"]
      }
      sql.query("SELECT SUM(realprogress) FROM misoctrls WHERE requested is null OR requested = 1", (req, results) =>{
        if(results[0]["SUM(realprogress)"]){
          realprogress = results[0]["SUM(realprogress)"]
        }
        if(process.env.NODE_PROGRESS_DIAMETER_FILTER){
          let q1 = "SELECT COUNT(tpipes_id) FROM dpipes JOIN diameters ON dpipes.diameter_id = diameters.id WHERE tpipes_id = 1 AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          let q2 = "SELECT COUNT(tpipes_id) FROM dpipes JOIN diameters ON dpipes.diameter_id = diameters.id WHERE tpipes_id = 2 AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          let q3 = "SELECT COUNT(tpipes_id) FROM dpipes JOIN diameters ON dpipes.diameter_id = diameters.id WHERE tpipes_id = 3 AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          sql.query(q1, (err, results) =>{
            const tp1 = results[0]["COUNT(tpipes_id)"]
            sql.query(q2, [process.env.NODE_PROGRESS_DIAMETER_FILTER],(err, results) =>{
              const tp2 = results[0]["COUNT(tpipes_id)"]
              sql.query(q3, [process.env.NODE_PROGRESS_DIAMETER_FILTER],(err, results) =>{
                const tp3 = results[0]["COUNT(tpipes_id)"]
                sql.query("SELECT weight FROM tpipes", (err, results) =>{
                  const weights = results
                  const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
                  res.json({
                    weight: maxProgress,
                    progress: (progress/maxProgress * 100).toFixed(2),
                    realprogress: (realprogress/maxProgress * 100).toFixed(2)
                  }).status(200)
                })
              })
            })
          })
        }else{
          sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 1", (err, results) =>{
            const tp1 = results[0]["COUNT(tpipes_id)"]
            sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 2", (err, results) =>{
              const tp2 = results[0]["COUNT(tpipes_id)"]
              sql.query("SELECT COUNT(tpipes_id) FROM dpipes WHERE tpipes_id = 3", (err, results) =>{
                const tp3 = results[0]["COUNT(tpipes_id)"]
                sql.query("SELECT weight FROM tpipes", (err, results) =>{
                  const weights = results
                  const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
                  res.json({
                    weight: maxProgress,
                    progress: (progress/maxProgress * 100).toFixed(2),
                    realprogress: (realprogress/maxProgress * 100).toFixed(2)
                  }).status(200)
                })
              })
            })
          })
        }
        
      })
    })
  }
  
  const currentProgressISO = async(req,res) =>{
    sql.query("SELECT SUM(progress) FROM misoctrls INNER JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid WHERE revision = 0 OR (revision = 1 AND issued = 1)", (req, results) =>{
      const progress = results[0]["SUM(progress)"]
      sql.query("SELECT SUM(realprogress) FROM misoctrls INNER JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid WHERE requested is null OR requested = 1", (req, results) =>{
        const realprogress = results[0]["SUM(realprogress)"]
        if(process.env.NODE_PROGRESS_DIAMETER_FILTER){
          let q1 = "SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid JOIN diameters ON dpipes_view.diameter_id = diameters.id WHERE tpipes_id = 1 AND (revision = 0 OR (revision = 1 AND issued = 1)) AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          let q2 = "SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid JOIN diameters ON dpipes_view.diameter_id = diameters.id WHERE tpipes_id = 2 AND (revision = 0 OR (revision = 1 AND issued = 1)) AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          let q3 = "SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid JOIN diameters ON dpipes_view.diameter_id = diameters.id WHERE tpipes_id = 3 AND (revision = 0 OR (revision = 1 AND issued = 1)) AND dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
          sql.query(q1, (err, results) =>{
            const tp1 = results[0]["COUNT(tpipes_id)"]
            sql.query(q2, (err, results) =>{
              const tp2 = results[0]["COUNT(tpipes_id)"]
              sql.query(q3, (err, results) =>{
                const tp3 = results[0]["COUNT(tpipes_id)"]
                sql.query("SELECT weight FROM tpipes", (err, results) =>{
                  const weights = results
                  const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
                  res.json({
                    progressISO: (progress/maxProgress * 100).toFixed(2),
                    realprogressISO: (realprogress/maxProgress * 100).toFixed(2)
                  }).status(200)
                })
              })
            })
          })
        }else{
          sql.query("SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 1 AND (revision = 0 OR (revision = 1 AND issued = 1))", (err, results) =>{
            const tp1 = results[0]["COUNT(tpipes_id)"]
            sql.query("SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 2 AND (revision = 0 OR (revision = 1 AND issued = 1))", (err, results) =>{
              const tp2 = results[0]["COUNT(tpipes_id)"]
              sql.query("SELECT COUNT(tpipes_id) FROM dpipes_view INNER JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 3 AND (revision = 0 OR (revision = 1 AND issued = 1))", (err, results) =>{
                const tp3 = results[0]["COUNT(tpipes_id)"]
                sql.query("SELECT weight FROM tpipes", (err, results) =>{
                  const weights = results
                  const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
                  res.json({
                    progressISO: (progress/maxProgress * 100).toFixed(2),
                    realprogressISO: (realprogress/maxProgress * 100).toFixed(2)
                  }).status(200)
                })
              })
            })
          })
        }
        
      })
    })
  }
  
  const getMaxProgress = async(req,res) =>{
          sql.query("SELECT weight FROM tpipes", (err, results) =>{
            res.json({
              weights: results
            }).status(200)
          })
  }


module.exports = {
    gpipes,
    gequips,
    ginsts,
    gcivils,
    gelecs,
    gcurve,
    submitEquipProgress,
    submitInstProgress,
    submitCivilProgress,
    submitElecProgress,
    submitPipingProgress,
    currentProgress,
    currentProgressISO,
    getMaxProgress
  };