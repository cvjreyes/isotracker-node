const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const transaction = async (req, res) => {

    const fileName = req.body.fileName
    let username = "";

    sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
      if(!results[0] && process.env.NODE_PROGRESS == "1"){
        sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
          res.status(200).send({blocked:"1"})
          
        })
      }else{
        sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
          if (!results[0]){
          res.status(401).send("Username or password incorrect");
          }else{   
          username  = results[0].name
          }
        });
    
        sql.query("SELECT created_at FROM hisoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
          if (!results[0]){
              res.status(401).send("File not found");
          }else{
              sql.query("SELECT * FROM misoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
                  if (!results[0]){
                      res.status(401).send("File not found");
                  }else{
                    const role = results[0].role
                    const username = results[0].user
                      let revisionCompleted = false
                      if(results[0].issuer_date && results[0].issuer_date != "" && results[0].issuer_designation && results[0].issuer_designation != "" && results[0].issuer_draw && results[0].issuer_draw != "" && results[0].issuer_check && results[0].issuer_check != "" && results[0].issuer_appr && results[0].issuer_appr != ""){
                        revisionCompleted = true
                      }
                      if(results[0].returned == 1 && req.body.to == "Supports" && req.body.role == "StressLead"){   
                        sql.query('SELECT user, role FROM hisoctrls WHERE filename = ? AND `to` = ? AND role = ? ORDER BY id DESC LIMIT 1', [req.body.fileName, "Claimed", "SupportsLead"], (err, results)=>{
                          if(!results[0]){
                            res.status(401).send("File not found");
                          }else{
                            const dest_user = results[0].user
                            const dest_role = results[0].role
                            let destiny = "Supports"
                            let comments = "Return to supports lead"
                            sql.query('SELECT * from misoctrls WHERE filename = ?', [fileName], (err, results)=>{
                              if(!results[0]){
                                res.status(401)
                              }else{
                                let from = results[0].to
                                
    
                                let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                                masterName = fileName.split('.').slice(0, -1)
    
                                let local_to = destiny
                                let from_text = from
                                if(from == "LDE/Isocontrol"){
                                    from = "lde"
                                }
    
                                origin_path = './app/storage/isoctrl/' + from + "/" + fileName
                                destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                                origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                                destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                                origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                origin_proc_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                origin_inst_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                                destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
    
                                if(fs.existsSync(origin_path)){
                                  fs.rename(origin_path, destiny_path, function (err) {
                                      if (err) throw err
                        
                                  })
                        
                                  fs.readdir(origin_attach_path, (err, files) => {
                                      files.forEach(file => {                          
                                        let attachName = file.split('.').slice(0, -1)
                                        if(String(masterName).trim() == String(attachName).trim()){
                                          fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                              console.log("moved attach "+ file)
                                              if (err) throw err
                        
                                          })
                                        }
                                      });
                                  });
                        
                                  if(fs.existsSync(origin_cl_path)){
                                      fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
                        
                                  if(fs.existsSync(origin_proc_path)){
                                      fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
                        
                                  if(fs.existsSync(origin_inst_path)){
                                      fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
    
                                  sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                                  [fileName, results[0].revision, results[0].spo, results[0].sit,results[0].deleted, results[0].onhold, from_text, destiny, dest_user, username, role], (err, results) => {
                                    if (err) {
                                      console.log("error: ", err);
                                    }else{
                                      if(process.env.NODE_PROGRESS == "1"){
                                        let type = ""
                                        if(process.env.NODE_IFC == "0"){
                                          type = "value_ifd"
                                        }else{
                                          type = "value_ifc"
                                        }
                                        sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                                          if(!results[0]){
                                            res.status(401)
                                          }else{
                                            tl = results[0].tpipes_id
                                            const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                            let level = destiny
                                            if(level == "LDE/Isocontrol"){
                                                level = "Issuer"
                                            }
                                            sql.query(q, [level, tl], (err, results)=>{
                                              if(!results[0]){
                                                res.status(401)
                                              }else{
                                                let newprogress = null
                                                if(type == "value_ifc"){
                                                  newprogress = results[0].value_ifc
                                                }else{
                                                  newprogress = results[0].value_ifd
                                                }
                                                sql.query("SELECT progress, max_tray FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                                                  if(!results[0]){
                                                    res.status(401).send("Iso without progress")
                                                    
                                                  }else{
                                                    let progress = results[0].progress
                                                    let max_tray = results[0].max_tray
                                                    if(newprogress > progress){
                                                      progress = newprogress
                                                      max_tray = destiny
                                                    }
                                                    sql.query("UPDATE misoctrls SET claimed = 1, forced = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, max_tray = ?, returned = 1 WHERE filename = ?", [0, username, dest_role, 0, 0, from_text, destiny, comments, progress, newprogress, max_tray, fileName], (err, results) =>{
                                                      if (err) {
                                                          res.status(401).send("cant update")
                                                          console.log("error: ", err);
                                                      }else{
                                                          console.log("iso moved" );
                                                          res.status(200).send({"moved": 1})
                                                      }
                                                    })
                                                  }
                                                })
                                                                                      
                                              }
                                            })
                                          }
                                        })
                                      }else{
                                        sql.query("UPDATE misoctrls SET claimed = 1, forced = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 1 WHERE filename = ?", [0, username, dest_role, 0, 0, from_text, destiny, comments, fileName], (err, results) =>{
                                            if (err) {
                                                console.log("error: ", err);
                                            }else{
                                                console.log("iso moved" );
                                                res.status(200).send({"moved": 1})
                                            }
                                        })
                                      }
                                    }
                                  })
    
                                }
                              }
                              
                            })
                          }
                        })
                      
                        
                      }else{
                        const from = results[0].to
                        let created_at = results[0].created_at
                        if(!fs.existsSync('./app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf') && req.body.to == "LDE/Isocontrol"){
                          res.status(401).send({error: "error"})
                        }else if(!revisionCompleted && process.env.NODE_PROGRESS == "1" && process.env.NODE_ISSUER == "1" && req.body.to == "LDE/Isocontrol"){
                          res.status(401).send({error: "rev"})
                        }else{
                            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                            [req.body.fileName, results[0].revision, results[0].spo, results[0].sit, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, req.body.role, username], (err, results) => {
                                if (err) {
                                    console.log("error: ", err);
                                }else{
                                    let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                                    masterName = req.body.fileName.split('.').slice(0, -1)
      
                                    if(req.body.to == "Recycle bin"){   
                                        let fromR = from  
                                        if(from == "LDE/Isocontrol"){
                                          fromR = "lde"
                                        }
                                        if (!fs.existsSync('./app/storage/isoctrl/'+ fromR +'/TRASH')){
                                            fs.mkdirSync('./app/storage/isoctrl/'+ fromR +'/TRASH');
                                            fs.mkdirSync('./app/storage/isoctrl/'+ fromR +'/TRASH/tattach');
                                        }
      
                                        origin_path = './app/storage/isoctrl/' + fromR + "/" + req.body.fileName
                                        destiny_path = './app/storage/isoctrl/' + fromR + "/TRASH/" + req.body.fileName
                                        origin_attach_path = './app/storage/isoctrl/' + fromR + "/attach/"
                                        destiny_attach_path = './app/storage/isoctrl/' + fromR + "/TRASH/tattach/"
                                        origin_cl_path = './app/storage/isoctrl/' + fromR + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                        destiny_cl_path = './app/storage/isoctrl/' + fromR + "/TRASH/tattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
      
                                    }else if(req.body.to == "On hold"){
                                      let fromH = from  
                                      if(from == "LDE/Isocontrol"){
                                        fromH = "lde"
                                      }
                                        if (!fs.existsSync('./app/storage/isoctrl/' + fromH + '/HOLD')){
                                            fs.mkdirSync('./app/storage/isoctrl/' + fromH +'/HOLD');
                                            fs.mkdirSync('./app/storage/isoctrl/' + fromH +'/HOLD/hattach');
                                        }
                                        
                                        origin_path = './app/storage/isoctrl/' + fromH + "/" + req.body.fileName
                                        destiny_path = './app/storage/isoctrl/' + fromH + "/HOLD/" + req.body.fileName
                                        origin_attach_path = './app/storage/isoctrl/' + fromH + "/attach/"
                                        destiny_attach_path = './app/storage/isoctrl/' + fromH + "/HOLD/hattach/"
                                        origin_cl_path = './app/storage/isoctrl/' + fromH + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                        destiny_cl_path = './app/storage/isoctrl/' + fromH + "/HOLD/hattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                        origin_proc_path = './app/storage/isoctrl/' + fromH + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                        destiny_proc_path = './app/storage/isoctrl/' + fromH + "/HOLD/hattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                        origin_inst_path = './app/storage/isoctrl/' + fromH + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                                        destiny_inst_path = './app/storage/isoctrl/' + fromH + "/HOLD/hattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
      
                                    }else{
                                        let local_to = req.body.to
                                        if(local_to == "LDE/Isocontrol"){
                                            local_to = "lde"
                                        }
                                        origin_path = './app/storage/isoctrl/' + from + "/" + req.body.fileName
                                        destiny_path = './app/storage/isoctrl/' + local_to + "/" + req.body.fileName
                                        origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                                        destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                                        origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                        destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                        origin_proc_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                        destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                        origin_inst_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                                        destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
      
                                    }
                                    
                                    if(fs.existsSync(origin_path)){
                                        fs.rename(origin_path, destiny_path, function (err) {
                                            if (err) throw err
        
                                        })
      
                                        fs.readdir(origin_attach_path, (err, files) => {
                                            files.forEach(file => {                          
                                              let attachName = file.split('.').slice(0, -1)
                                              if(String(masterName).trim() == String(attachName).trim()){
                                                fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                                    console.log("moved attach "+ file)
                                                    if (err) throw err
            
                                                })
                                              }
                                            });
                                        });
      
                                        if(fs.existsSync(origin_cl_path)){
                                            fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                                if (err) throw err
                                                console.log('Successfully renamed - AKA moved!')
                                            })
                                        }
      
                                        if(fs.existsSync(origin_proc_path)){
                                            fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                                                if (err) throw err
                                                console.log('Successfully renamed - AKA moved!')
                                            })
                                        }
      
                                        if(fs.existsSync(origin_inst_path)){
                                            fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                                                if (err) throw err
                                                console.log('Successfully renamed - AKA moved!')
                                            })
                                        }
                                        
                                    }
      
                                    let ld = 0;
                                    let u = "None";
                                    let r = null;
                                    if (process.env.NODE_IFC == "1"){
                                        if ((req.body.role == "StressLead" || req.body.role == "SupportsLead") && (from == "stress" && req.body.to == "supports" || from == "supports" && req.body.to == "stress")){
                                            ld = 1;
                                        }
                                    }
      
                                    if (req.body.to == "Recycle bin" || req.body.to == "On hold"){
                                        u = username
                                        r = req.body.role
                                    }
                                    if(process.env.NODE_PROGRESS == "1" && req.body.to !== "Recycle bin" && req.body.to !== "On hold"){
                                        let type = ""
                                        if(process.env.NODE_IFC == "0"){
                                          type = "value_ifd"
                                        }else{
                                          type = "value_ifc"
                                        }
                                        sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
                                          if(!results[0]){
                                            res.status(401)
                                          }else{
                                            tl = results[0].tpipes_id
                                            const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                            let level = req.body.to
                                            if(level == "LDE/Isocontrol"){
                                                level = "Issuer"
                                            }
                                            sql.query(q, [level, tl], (err, results)=>{
                                              if(!results[0]){
                                                res.status(401)
                                              }else{
                                                let newprogress = null
                                                if(type == "value_ifc"){
                                                  newprogress = results[0].value_ifc
                                                }else{
                                                  newprogress = results[0].value_ifd
                                                }
                                                sql.query("SELECT progress, max_tray FROM misoctrls WHERE filename = ?", [req.body.fileName], (err, results) =>{
                                                  if(!results[0]){
                                                    res.status(401).send("Iso without progress")
                                                    
                                                  }else{
                                                    let progress = results[0].progress
                                                    let max_tray = results[0].max_tray
                                                    if(newprogress > progress){
                                                      progress = newprogress
                                                      max_tray = level
                                                    }
                                                    sql.query("UPDATE misoctrls SET claimed = 0, forced = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, max_tray = ?, returned = 0 WHERE filename = ?", [ld, u, r, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, progress, newprogress, max_tray, req.body.fileName], (err, results) =>{
                                                      if (err) {
                                                          res.status(401).send("cant update")
                                                          console.log("error: ", err);
                                                      }else{
                                                          res.status(200).send({"moved": 1})
                                                      }
                                                    })
                                                  }
                                                })
                                                                                      
                                              }
                                            })
                                          }
                                        })
                                      }else{
                                        sql.query("UPDATE misoctrls SET claimed = 0, forced = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 0 WHERE filename = ?", [ld, u, r, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, req.body.fileName], (err, results) =>{
                                            if (err) {
                                                console.log("error: ", err);
                                            }else{
                                                res.status(200).send({"moved": 1})
                                            }
                                        })
                                      }
                                    
                                    
                                
                              }
      
                            });
                          }
                        
                        const destiny = req.body.to
                        let role = req.body.role

                        if(role == "LOS/Isocontrol"){
                          role = "SpecialityLead"
                        }

                        sql.query("SELECT id FROM roles WHERE name = ?", [role], (err, results) =>{
                          if(!results[0]){
                            res.status(401)
                          }else{
                            const id = results[0].id

                            if(id == 1){
                              sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 1 OR role_id = 2", (err, results)=>{
                                if(!results[0]){
                                    res.send({success: 1}).status(200)
                                }else{
                                    const users_ids = results
                                    for(let j = 0; j < users_ids.length; j++){
                                      sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, "The isometric "+ fileName + " has been moved to " + destiny + "."], (err, results)=>{
                                        if(err){
                                                console.log(err)
                                                res.status(401)
                                            }else{
                                                
                                            }
                                        })
                                    }
                                }
                              })
                            }else if(id == 3){
                              sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 3 OR role_id = 4", (err, results)=>{
                                if(!results[0]){
                                    res.send({success: 1}).status(200)
                                }else{
                                    const users_ids = results
                                    for(let j = 0; j < users_ids.length; j++){
                                      sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, "The isometric "+ fileName + " has been moved to " + destiny + "."], (err, results)=>{
                                        if(err){
                                                console.log(err)
                                                res.status(401)
                                            }else{
                                                
                                            }
                                        })
                                    }
                                }
                              })
                            }else if(id == 5){
                              sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 5 OR role_id = 6", (err, results)=>{
                                if(!results[0]){
                                    res.send({success: 1}).status(200)
                                }else{
                                    const users_ids = results
                                    for(let j = 0; j < users_ids.length; j++){
                                      sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, "The isometric "+ fileName + " has been moved to " + destiny + "."], (err, results)=>{
                                        if(err){
                                                console.log(err)
                                                res.status(401)
                                            }else{
                                                
                                            }
                                        })
                                    }
                                }
                              })
                            }else{
                              sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = ?", [id], (err, results)=>{
                                if(!results[0]){
                                    res.send({success: 1}).status(200)
                                }else{
                                    const users_ids = results
                                    for(let j = 0; j < users_ids.length; j++){
                                        sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, "The isometric "+ fileName + " has been moved to " + destiny + "."], (err, results)=>{
                                            if(err){
                                                console.log(err)
                                                res.status(401)
                                            }else{
                                                
                                            }
                                        })
                                    }
                                }
                              })
                            }
                          }
                        })
                    }
                  }
              })
    
          }
        })
      }
    })
    
}

const returnLead = async(req, res) =>{
  const fileName = req.body.fileName
  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
      sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{   
        username  = results[0].name
        }
      });
      sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
          res.status(401).send("Username or password incorrect");
        }else{   
          username  = results[0].name
          sql.query("SELECT `from` FROM misoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
              if (!results[0]){
                  res.status(401).send("File not found");
              }else{
                  const from = results[0].from
                  sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                  [req.body.fileName, results[0].revision, results[0].spo, results[0].sit,results[0].deleted, results[0].onhold, "Claimed by LD", req.body.to, "Unclaimed by leader", username], (err, results) => {
                      if (err) {
                          console.log("error: ", err);
                      }else{
                        let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                        masterName = fileName.split('.').slice(0, -1)
    
                    
                        let local_to = req.body.to
                        if(local_to == "LDE/Isocontrol"){
                            local_to = "lde"
                        }
                        origin_path = './app/storage/isoctrl/' + from + "/" + fileName
                        destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                        origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                        destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                        origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                        destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                        origin_proc_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                        destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                        origin_inst_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                        destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
    
                        
                        if(fs.existsSync(origin_path)){
                            fs.rename(origin_path, destiny_path, function (err) {
                                if (err) throw err
    
                            })
    
                            fs.readdir(origin_attach_path, (err, files) => {
                                files.forEach(file => {                          
                                  let attachName = file.split('.').slice(0, -1)
                                  if(String(masterName).trim() == String(attachName).trim()){
                                    fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                        if (err) throw err
    
                                    })
                                  }
                                });
                            });
    
                            if(fs.existsSync(origin_cl_path)){
                                fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                    if (err) throw err
                                    console.log('Successfully renamed - AKA moved!')
                                })
                            }
    
                            if(fs.existsSync(origin_proc_path)){
                                fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                                    if (err) throw err
                                    console.log('Successfully renamed - AKA moved!')
                                })
                            }
    
                            if(fs.existsSync(origin_inst_path)){
                                fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                                    if (err) throw err
                                    console.log('Successfully renamed - AKA moved!')
                                })
                            }
                                        
                          }
      
                          if(process.env.NODE_PROGRESS == "1"){
                              let type = ""
                              if(process.env.NODE_IFC == "0"){
                                type = "value_ifd"
                              }else{
                                type = "value_ifc"
                              }
                              sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
                                if(!results[0]){
                                  res.status(401)
                                }else{
                                  tl = results[0].tpipes_id
                                  const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                  sql.query(q, [req.body.to, tl], (err, results)=>{
                                    if(!results[0]){
                                      res.status(401)
                                    }else{
                                      let newprogress = null
                                      if(type == "value_ifc"){
                                        newprogress = results[0].value_ifc
                                      }else{
                                        newprogress = results[0].value_ifd
                                      }
                                      
                                      sql.query("SELECT progress FROM misoctrls WHERE filename = ?", [req.body.fileName], (err, results) =>{
                                        if(!results[0]){
                                          res.status(401).send("Iso without progress")
                                        }else{
                                          let progress = results[0].progress
                                          if(newprogress > progress){
                                            progress = newprogress
                                          }
    
                                          sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 1, user = ?, role = ?, comments = ?, progress = ?, realprogress = ?, `to` = ?, returned = 1 WHERE filename = ?", ["None", null, "Unclaimed by leader", progress, newprogress,req.body.to, req.body.fileName], (err, results) =>{
                                              if (err) {
                                                  console.log("error: ", err);
                                              }else{
                                                  res.status(200).send("moved")
                                              }
                                          })
                                        }
                                      })                              
                                    }
                                  })
                                }
                              })
                            }else{
                              sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 1, user = ?, role = ?, comments = ?, `to` = ?, returned = 1 WHERE filename = ?", ["None", null, "Unclaimed by leader",req.body.to, req.body.fileName], (err, results) =>{
                                  if (err) {
                                      console.log("error: ", err);
                                  }else{
                                      res.status(200).send("moved")
                                  }
                              })
                            }
                          
                      }
                  })
              }
          })
          }
      });
    }
  })
   
}
 

const returnLeadStress = async(req, res) =>{
  const destiny = "Stress"
  const user = req.body.user
  const fileName = req.body.file
  const role = "SupportsLead"
  const comments = req.body.comments
  let username = "";
  let dest_role = "StressLead";

  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
      sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{   
        username  = results[0].name
        }
      });
      sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{
        if (!results[0]){
          res.status(401).send("Username or password incorrect");
        }else{   
          username  = results[0].name
        }
        sql.query('SELECT user, role FROM hisoctrls WHERE filename = ? AND `from` = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, destiny, dest_role], (err, results)=>{
          if(!results[0]){
            sql.query("SELECT * FROM misoctrls WHERE filename = ?", fileName, (err, results) => {
                if (!results[0]){
                    res.status(401).send("File not found");
                }else{
                    const from = results[0].to
                    
                    let created_at = results[0].created_at
                    if(!fs.existsSync('./app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf') && destiny == "LDE/Isocontrol"){
                      res.status(401)
                    }else{
                      sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, role, user, verifydesign) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                      [fileName, results[0].revision, results[0].spo, results[0].sit, 0, 0, from, destiny, comments, "SupportsLead", username, 1], (err, results) => {
                          if (err) {
                              console.log("error: ", err);
                          }else{
                              let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                              masterName = fileName.split('.').slice(0, -1)
  
                          
                              let local_to = destiny
                              if(local_to == "LDE/Isocontrol"){
                                  local_to = "lde"
                              }
                              origin_path = './app/storage/isoctrl/' + from + "/" + fileName
                              destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                              origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                              destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                              origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                              destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                              origin_proc_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                              destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                              origin_inst_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                              destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
  
                          
                              
                              if(fs.existsSync(origin_path)){
                                  fs.rename(origin_path, destiny_path, function (err) {
                                      if (err) throw err
  
                                  })
  
                                  fs.readdir(origin_attach_path, (err, files) => {
                                      files.forEach(file => {                          
                                        let attachName = file.split('.').slice(0, -1)
                                        if(String(masterName).trim() == String(attachName).trim()){
                                          fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                              if (err) throw err
      
                                          })
                                        }
                                      });
                                  });
  
                                  if(fs.existsSync(origin_cl_path)){
                                      fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
  
                                  if(fs.existsSync(origin_proc_path)){
                                      fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
  
                                  if(fs.existsSync(origin_inst_path)){
                                      fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                                          if (err) throw err
                                          console.log('Successfully renamed - AKA moved!')
                                      })
                                  }
                                  
                              }
  
                              let ld = 0;
                              let u = "None";
                              let r = null;
                              if (process.env.NODE_IFC == "1"){
                                  if ((req.body.role == "StressLead" || req.body.role == "SupportsLead") && (from == "stress" && req.body.to == "supports" || from == "supports" && req.body.to == "stress")){
                                      ld = 1;
                                  }
                              }
  
                              if(process.env.NODE_PROGRESS == "1"){
                                  let type = ""
                                  if(process.env.NODE_IFC == "0"){
                                    type = "value_ifd"
                                  }else{
                                    type = "value_ifc"
                                  }
                                  sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                                    if(!results[0]){
                                      res.status(401)
                                    }else{
                                      tl = results[0].tpipes_id
                                      const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                      let level = destiny
                                      if(level == "LDE/Isocontrol"){
                                          level = "Issuer"
                                      }
                                      sql.query(q, [level, tl], (err, results)=>{
                                        if(!results[0]){
                                          res.status(401)
                                        }else{
                                          let newprogress = null
                                          if(type == "value_ifc"){
                                            newprogress = results[0].value_ifc
                                          }else{
                                            newprogress = results[0].value_ifd
                                          }
                                          sql.query("SELECT progress FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                                            if(!results[0]){
                                              res.status(401).send("Iso without progress")
                                              
                                            }else{
                                              let progress = results[0].progress
                                              if(newprogress > progress){
                                                progress = newprogress
                                              }
                                              sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 1, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, returned = 1 WHERE filename = ?", [u, r, 0, 0, from, destiny, comments, progress, newprogress, fileName], (err, results) =>{
                                                if (err) {
                                                    res.status(401).send("cant update")
                                                    console.log("error: ", err);
                                                }else{
                                                    res.status(200).send({"moved": 1})
                                                }
                                              })
                                            }
                                          })
                                                                                
                                        }
                                      })
                                    }
                                  })
                                }else{
                                  sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 1 WHERE filename = ?", [ld, u, r, 0, 0, from, destiny, comments, fileName], (err, results) =>{
                                      if (err) {
                                          console.log("error: ", err);
                                      }else{
                                          res.status(200).send({"moved": 1})
                                      }
                                  })
                                }        
                          
                        }
  
                      });
                  }  
              }
          })
          }else{
            const dest_user = results[0].user
            const dest_role = results[0].role
            sql.query('SELECT * from misoctrls WHERE filename = ?', [fileName], (err, results)=>{
              if(!results[0]){
                res.status(401)
              }else{
                let from = results[0].to
                
  
                let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                masterName = fileName.split('.').slice(0, -1)
  
                let local_to = destiny
                let from_text = from
                if(from == "LDE/Isocontrol"){
                    from = "lde"
                }
  
                origin_path = './app/storage/isoctrl/' + from + "/" + fileName
                destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                origin_proc_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                origin_inst_path = './app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
  
  
                if(fs.existsSync(origin_path)){
                  fs.rename(origin_path, destiny_path, function (err) {
                      if (err) throw err
        
                  })
        
                  fs.readdir(origin_attach_path, (err, files) => {
                      files.forEach(file => {                          
                        let attachName = file.split('.').slice(0, -1)
                        if(String(masterName).trim() == String(attachName).trim()){
                          fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                              console.log("moved attach "+ file)
                              if (err) throw err
        
                          })
                        }
                      });
                  });
        
                  if(fs.existsSync(origin_cl_path)){
                      fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                          if (err) throw err
                          console.log('Successfully renamed - AKA moved!')
                      })
                  }
        
                  if(fs.existsSync(origin_proc_path)){
                      fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                          if (err) throw err
                          console.log('Successfully renamed - AKA moved!')
                      })
                  }
        
                  if(fs.existsSync(origin_inst_path)){
                      fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                          if (err) throw err
                          console.log('Successfully renamed - AKA moved!')
                      })
                  }
  
                  sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                  [fileName, results[0].revision, results[0].spo, results[0].sit,results[0].deleted, results[0].onhold, from_text, destiny, "Unclaimed by leader", dest_user, dest_role], (err, results) => {
                    if (err) {
                      console.log("error: ", err);
                    }else{
                      if(process.env.NODE_PROGRESS == "1"){
                        let type = ""
                        if(process.env.NODE_IFC == "0"){
                          type = "value_ifd"
                        }else{
                          type = "value_ifc"
                        }
                        sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                          if(!results[0]){
                            res.status(401)
                          }else{
                            tl = results[0].tpipes_id
                            const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                            let level = destiny
                            if(level == "LDE/Isocontrol"){
                                level = "Issuer"
                            }
                            sql.query(q, [level, tl], (err, results)=>{
                              if(!results[0]){
                                res.status(401)
                              }else{
                                let newprogress = null
                                if(type == "value_ifc"){
                                  newprogress = results[0].value_ifc
                                }else{
                                  newprogress = results[0].value_ifd
                                }
                                sql.query("SELECT progress FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                                  if(!results[0]){
                                    res.status(401).send("Iso without progress")
                                    
                                  }else{
                                    let progress = results[0].progress
                                    if(newprogress > progress){
                                      progress = newprogress
                                    }
                                    sql.query("UPDATE misoctrls SET claimed = 1, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, returned = 1 WHERE filename = ?", [0, dest_user, dest_role, 0, 0, from_text, destiny, comments, progress, newprogress, fileName], (err, results) =>{
                                      if (err) {
                                          res.status(401).send("cant update")
                                          console.log("error: ", err);
                                      }else{
                                          
                                          res.status(200).send({"moved": 1})
                                      }
                                    })
                                  }
                                })
                                                                      
                              }
                            })
                          }
                        })
                      }else{
                        sql.query("UPDATE misoctrls SET claimed = 1, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 1 WHERE filename = ?", [0, dest_user, dest_role, 0, 0, from_text, destiny, comments, fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                                res.status(200).send({"moved": 1})
                            }
                        })
                      }
                    }
                  })
  
                }
              }
              
            })
          }
        })
    });
    }
  })
  
    
}


const returnIso = async(req, res) =>{
  const destiny = req.body.destiny
  const user = req.body.user
  const fileName = req.body.file
  const role = req.body.role
  const comments = req.body.comments
  let username = "";
  let dest_role = destiny;

  
  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
      sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{   
        username  = results[0].name
        }
      });
    
        sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{
          if (!results[0]){
          res.status(401).send("Username or password incorrect");
          }else{   
          username  = results[0].name
          }
          sql.query('SELECT user, role FROM hisoctrls WHERE filename = ? AND `from` = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, destiny, dest_role], (err, results)=>{
            if(!results[0]){
              
              sql.query("SELECT created_at FROM hisoctrls WHERE filename = ?", fileName, (err, results) => {
                if (!results[0]){
                    res.status(401).send("File not found");
                }else{
                    sql.query("SELECT * FROM misoctrls WHERE filename = ?", fileName, (err, results) => {
                        if (!results[0]){
                            res.status(401).send("File not found");
                        }else{
                            const from = results[0].to
                            let created_at = results[0].created_at
                            if(!fs.existsSync('./app/storage/isoctrl/' + from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf') && destiny == "LDE/Isocontrol"){
                              res.status(401)
                            }else{
                              sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                              [fileName, results[0].revision, results[0].spo, results[0].sit, 0, 0, from, destiny, comments, role, username], (err, results) => {
                                  if (err) {
                                      console.log("error: ", err);
                                  }else{
                                      let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                                      masterName = fileName.split('.').slice(0, -1)
    
                                      let local_from = from
                                      if(local_from == "LDE/Isocontrol"){
                                        local_from = "lde"
                                      }                  
                                  
                                      let local_to = destiny
                                      if(local_to == "LDE/Isocontrol"){
                                          local_to = "lde"
                                      }
                                      origin_path = './app/storage/isoctrl/' + local_from + "/" + fileName
                                      destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                                      origin_attach_path = './app/storage/isoctrl/' + local_from + "/attach/"
                                      destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                                      origin_cl_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                      destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                      origin_proc_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                      destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                                      origin_inst_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                                      destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                                      
                                      if(fs.existsSync(origin_path)){
                                          fs.rename(origin_path, destiny_path, function (err) {
                                              if (err) throw err
          
                                          })
        
                                          fs.readdir(origin_attach_path, (err, files) => {
                                              files.forEach(file => {                          
                                                let attachName = file.split('.').slice(0, -1)
                                                if(String(masterName).trim() == String(attachName).trim()){
                                                  fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                                      if (err) throw err
              
                                                  })
                                                }
                                              });
                                          });
        
                                          if(fs.existsSync(origin_cl_path)){
                                              fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                                  if (err) throw err
                                                  console.log('Successfully renamed - AKA moved!')
                                              })
                                          }
        
                                          if(fs.existsSync(origin_proc_path)){
                                              fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                                                  if (err) throw err
                                                  console.log('Successfully renamed - AKA moved!')
                                              })
                                          }
        
                                          if(fs.existsSync(origin_inst_path)){
                                              fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                                                  if (err) throw err
                                                  console.log('Successfully renamed - AKA moved!')
                                              })
                                          }
                                          
                                      }
        
                                      let ld = 0;
                                      let u = "None";
                                      let r = null;
                                      if (process.env.NODE_IFC == "1"){
                                          if ((req.body.role == "StressLead" || req.body.role == "SupportsLead") && (from == "stress" && req.body.to == "supports" || from == "supports" && req.body.to == "stress")){
                                              ld = 1;
                                          }
                                      }
        
                                      if(process.env.NODE_PROGRESS == "1"){
                                          let type = ""
                                          if(process.env.NODE_IFC == "0"){
                                            type = "value_ifd"
                                          }else{
                                            type = "value_ifc"
                                          }
                                          sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                                            if(!results[0]){
                                              res.status(401)
                                            }else{
                                              tl = results[0].tpipes_id
                                              const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                              let level = destiny
                                              if(level == "LDE/Isocontrol"){
                                                  level = "Issuer"
                                              }
                                              sql.query(q, [level, tl], (err, results)=>{
                                                if(!results[0]){
                                                  res.status(401)
                                                }else{
                                                  let newprogress = null
                                                  if(type == "value_ifc"){
                                                    newprogress = results[0].value_ifc
                                                  }else{
                                                    newprogress = results[0].value_ifd
                                                  }
                                                  sql.query("SELECT progress FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                                                    if(!results[0]){
                                                      res.status(401).send("Iso without progress")
                                                      
                                                    }else{
                                                      let progress = results[0].progress
                                                      if(newprogress > progress){
                                                        progress = newprogress
                                                      }
                                                      sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, returned = 0 WHERE filename = ?", [ld, u, r, 0, 0, from, destiny, comments, progress, newprogress, fileName], (err, results) =>{
                                                        if (err) {
                                                            res.status(401).send("cant update")
                                                            console.log("error: ", err);
                                                        }else{
                                                            sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
                                                              let rejector = null
                                                              if(!results[0]){
                                              
                                                              }else{
                                                                  rejector = results[0].name
                                                                  sql.query("SELECT id FROM users WHERE email = ?", [user], (err, results)=>{
                                                                    let reciever = null
                                                                    if(!results[0]){
                                                    
                                                                    }else{
                                                                      reciever = results[0].id
                                                                      sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [reciever, "The user "+ rejector + " has returned you the isometric " + fileName + "."], (err, results)=>{
                                                                        if(err){
                                                                            console.log(err)
                                                                            res.status(401)
                                                                        }else{
                                                                          res.status(200).send({"moved": 1})
                                                                        }
                                                                      })  
                                                                    }
                                                                  })
                                                              }
                                                            })    
                                                            
                                                        }
                                                      })
                                                    }
                                                  })
                                                                                        
                                                }
                                              })
                                            }
                                          })
                                        }else{
                                          sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 0 WHERE filename = ?", [ld, u, r, 0, 0, from, destiny, comments, fileName], (err, results) =>{
                                              if (err) {
                                                  console.log("error: ", err);
                                              }else{
                                                  sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
                                                    let rejector = null
                                                    if(!results[0]){
                                    
                                                    }else{
                                                        rejector = results[0].name
                                                        sql.query("SELECT id FROM users WHERE email = ?", [user], (err, results)=>{
                                                          let reciever = null
                                                          if(!results[0]){
                                          
                                                          }else{
                                                            reciever = results[0].id
                                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [reciever, "The user "+ rejector + " has returned you the isometric " + fileName + "."], (err, results)=>{
                                                              if(err){
                                                                  console.log(err)
                                                                  res.status(401)
                                                              }else{
                                                                res.status(200).send({"moved": 1})
                                                              }
                                                            })  
                                                          }
                                                        })
                                                    }
                                                  })    
                                              }
                                          })
                                        }    
                                        
                                  
                                }
        
                              });
                          }
                        }
                    })
        
                }
            })
            }else{
              const dest_user = results[0].user
              sql.query('SELECT * from misoctrls WHERE filename = ?', [fileName], (err, results)=>{
                if(!results[0]){
                  res.status(401)
                }else{
                  let from = results[0].to
                  const role = results[0].role
    
                  let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                  masterName = fileName.split('.').slice(0, -1)
    
                  let local_to = destiny
                  let from_text = from
                  let local_from = from
                  if(local_from == "LDE/Isocontrol"){
                      local_from = "lde"
                  }
    
                  origin_path = './app/storage/isoctrl/' + local_from + "/" + fileName
                  destiny_path = './app/storage/isoctrl/' + local_to + "/" + fileName
                  origin_attach_path = './app/storage/isoctrl/' + local_from + "/attach/"
                  destiny_attach_path = './app/storage/isoctrl/' + local_to + "/attach/"
                  origin_cl_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                  destiny_cl_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                  origin_proc_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                  destiny_proc_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                  origin_inst_path = './app/storage/isoctrl/' + local_from + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                  destiny_inst_path = './app/storage/isoctrl/' + local_to + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
    
                  if(fs.existsSync(origin_path)){
                    fs.rename(origin_path, destiny_path, function (err) {
                        if (err) throw err
          
                    })
          
                    fs.readdir(origin_attach_path, (err, files) => {
                        files.forEach(file => {                          
                          let attachName = file.split('.').slice(0, -1)
                          if(String(masterName).trim() == String(attachName).trim()){
                            fs.rename(origin_attach_path+file, destiny_attach_path+file, function (err) {
                                console.log("moved attach "+ file)
                                if (err) throw err
          
                            })
                          }
                        });
                    });
          
                    if(fs.existsSync(origin_cl_path)){
                        fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                            if (err) throw err
                            console.log('Successfully renamed - AKA moved!')
                        })
                    }
          
                    if(fs.existsSync(origin_proc_path)){
                        fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                            if (err) throw err
                            console.log('Successfully renamed - AKA moved!')
                        })
                    }
          
                    if(fs.existsSync(origin_inst_path)){
                        fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                            if (err) throw err
                            console.log('Successfully renamed - AKA moved!')
                        })
                    }
    
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, results[0].revision, results[0].spo, results[0].sit,results[0].deleted, results[0].onhold, from_text, destiny, comments, username, role], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        if(process.env.NODE_PROGRESS == "1"){
                          let type = ""
                          if(process.env.NODE_IFC == "0"){
                            type = "value_ifd"
                          }else{
                            type = "value_ifc"
                          }
                          sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                            if(!results[0]){
                              res.status(401)
                            }else{
                              tl = results[0].tpipes_id
                              const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                              let level = destiny
                              if(level == "LDE/Isocontrol"){
                                  level = "Issuer"
                              }
                              sql.query(q, [level, tl], (err, results)=>{
                                if(!results[0]){
                                  res.status(401)
                                }else{
                                  let newprogress = null
                                  if(type == "value_ifc"){
                                    newprogress = results[0].value_ifc
                                  }else{
                                    newprogress = results[0].value_ifd
                                  }
                                  sql.query("SELECT progress FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                                    if(!results[0]){
                                      res.status(401).send("Iso without progress")
                                      
                                    }else{
                                      let progress = results[0].progress
                                      if(newprogress > progress){
                                        progress = newprogress
                                      }
                                      sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ?, returned = 1 WHERE filename = ?", [0, "None", null, 0, 0, from_text, destiny, comments, progress, newprogress, fileName], (err, results) =>{
                                        if (err) {
                                            res.status(401).send("cant update")
                                            console.log("error: ", err);
                                        }else{
                                            sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
                                              let rejector = null
                                              if(!results[0]){
                              
                                              }else{
                                                  rejector = results[0].name
                                                  sql.query("SELECT id FROM users WHERE email = ?", [user], (err, results)=>{
                                                    let reciever = null
                                                    if(!results[0]){
                                    
                                                    }else{
                                                      reciever = results[0].id
                                                      sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [reciever, "The user "+ rejector + " has returned you the isometric " + fileName + "."], (err, results)=>{
                                                        if(err){
                                                            console.log(err)
                                                            res.status(401)
                                                        }else{
                                                          res.status(200).send({"moved": 1})
                                                        }
                                                      })  
                                                    }
                                                  })
                                              }
                                            }) 
                                        }
                                      })
                                    }
                                  })
                                                                        
                                }
                              })
                            }
                          })
                        }else{
                          sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, returned = 1 WHERE filename = ?", [0, "None", "None", 0, 0, from_text, destiny, comments, fileName], (err, results) =>{
                              if (err) {
                                  console.log("error: ", err);
                              }else{
                                  sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
                                    let rejector = null
                                    if(!results[0]){
                    
                                    }else{
                                        rejector = results[0].name
                                        sql.query("SELECT id FROM users WHERE email = ?", [user], (err, results)=>{
                                          let reciever = null
                                          if(!results[0]){
                          
                                          }else{
                                            reciever = results[0].id
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [reciever, "The user "+ rejector + " has returned you the isometric " + fileName + "."], (err, results)=>{
                                              if(err){
                                                  console.log(err)
                                                  res.status(401)
                                              }else{
                                                res.status(200).send({"moved": 1})
                                              }
                                            })  
                                          }
                                        })
                                    }
                                  }) 
                              }
                          })
                        }
                      }
                    })
    
                  }
                }
                
              })
            }
          })
      });
    }
  })
   
}

const transactionNotifications = (req, res) =>{
  const n = req.body.n
  const destiny = req.body.destiny
  let role = req.body.destiny

  if(role == "LOS/Isocontrol"){
    role = "SpecialityLead"
  }

  sql.query("SELECT id FROM roles WHERE name = ?", [role], (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      const id = results[0].id

      if(id == 1){
        sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 1 OR role_id = 2", (err, results)=>{
          if(!results[0]){
              res.send({success: 1}).status(200)
          }else{
              const users_ids = results
              for(let j = 0; j < users_ids.length; j++){
                  sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, n +" isometric/s moved to " + destiny + "."], (err, results)=>{
                      if(err){
                          console.log(err)
                          res.status(401)
                      }else{
                          
                      }
                  })
              }
          }
        })
      }else if(id == 3){
        sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 3 OR role_id = 4", (err, results)=>{
          if(!results[0]){
              res.send({success: 1}).status(200)
          }else{
              const users_ids = results
              for(let j = 0; j < users_ids.length; j++){
                  sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, n +" isometric/s moved to " + destiny + "."], (err, results)=>{
                      if(err){
                          console.log(err)
                          res.status(401)
                      }else{
                          
                      }
                  })
              }
          }
        })
      }else if(id == 5){
        sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 5 OR role_id = 6", (err, results)=>{
          if(!results[0]){
              res.send({success: 1}).status(200)
          }else{
              const users_ids = results
              for(let j = 0; j < users_ids.length; j++){
                  sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, n +" isometric/s moved to " + destiny + "."], (err, results)=>{
                      if(err){
                          console.log(err)
                          res.status(401)
                      }else{
                          
                      }
                  })
              }
          }
        })
      }else{
        sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = ?", [id], (err, results)=>{
          if(!results[0]){
              res.send({success: 1}).status(200)
          }else{
              const users_ids = results
              for(let j = 0; j < users_ids.length; j++){
                  sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, n +" isometric/s moved to " + destiny + "."], (err, results)=>{
                      if(err){
                          console.log(err)
                          res.status(401)
                      }else{
                          
                      }
                  })
              }
          }
        })
      }
    }
  })
}

const returnToLOS = async(req, res) =>{
  const fileName = req.body.fileName
  const email = req.body.email
  const role = req.body.role
  sql.query("SELECT name FROM users WHERE email = ?", email, (err, results)=>{
    const username = results[0].name
    sql.query('SELECT transmittal, issued_date, isoid, revision, spo, sit, spoclaimed, comments FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
      if(!results[0]){
        res.status(401)
      }else{
        const last = results[0]
        sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, issued, transmittal, issued_date, deleted, onhold, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
        [fileName, last.revision - 1, last.spo, last.sit, 0, null, null, last.deleted, last.onhold, "Issued", "LDE/IsoControl", "Returned to LOS", role, username], (err, results) => {
          if (err) {
            console.log("error: ", err);
          }else{
            sql.query("UPDATE misoctrls SET filename = ?, revision = ?, issued = 0, requested = 0, transmittal = ?, issued_date = ?, `from` = ? WHERE filename = ?", [last.isoid + ".pdf", last.revision - 1, null, null, "Issued", fileName], (err, results) =>{
              if(err){
                console.log(err)
              }else{
                const newFileName = last.isoid + '.pdf'
          
                let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path
          
                origin_path = './app/storage/isoctrl/lde/' + fileName
                destiny_path = './app/storage/isoctrl/lde/' + newFileName
                origin_attach_path = './app/storage/isoctrl/lde/transmittals/' + last.transmittal + '/' + last.issued_date +'/'
                destiny_attach_path = './app/storage/isoctrl/lde/attach/'
                origin_cl_path = './app/storage/isoctrl/lde/transmittals/' + last.transmittal + '/' + last.issued_date + '/' + fileName
                destiny_cl_path = './app/storage/isoctrl/lde/attach/' + newFileName.split('.').slice(0, -1).join('.') + '-CL.pdf'

                fs.rename(origin_path, destiny_path, function (err) {
                  if (err) throw err
                })
          
                    fs.readdir(origin_attach_path, (err, files) => {
                      files.forEach(file => {                          
                        let attachName = file.split('.').slice(0, -1)
                        const i = file.lastIndexOf('.');
                        const extension = file.substring(i+1);
                        if(String(fileName.split('.').slice(0, -1)).trim() == String(attachName).trim() && extension != "pdf"){
                          fs.rename(origin_attach_path+file, destiny_attach_path+last.isoid+'.'+extension, function (err) {
                              if (err) throw err
              
                          })
                        }
                      });
                    });
              
                    if(fs.existsSync(origin_cl_path)){
                        fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                            if (err) throw err
                        })
                    }
                      res.send({success: true}).status(200)
                    }
            })
          }
        })
      }
    })
  })
  
  
}


module.exports = {
  transaction,
  returnLead,
  returnLeadStress,
  returnIso,
  transactionNotifications,
  returnToLOS
};