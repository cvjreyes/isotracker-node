const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const transaction = async (req, res) => {

    console.log("Empieza la transaccion")

    let username = "";
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
                console.log(results)
                if (!results[0]){
                    res.status(401).send("File not found");
                }else{
                    console.log(results[0])
                    const from = results[0].to
                    let created_at = results[0].created_at
                    if(!fs.existsSync('./app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf') && req.body.to == "LDE/Isocontrol"){
                      res.status(401).send("Missing clean!")
                    }else{
                      sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                      [req.body.fileName, results[0].revision, results[0].spo, results[0].sit, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, req.body.role, username], (err, results) => {
                          if (err) {
                              console.log("error: ", err);
                          }else{
                              console.log("created transaction");
                              let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                              masterName = req.body.fileName.split('.').slice(0, -1)

                              if(req.body.to == "Recycle bin"){     
                                  
                                  if (!fs.existsSync('./app/storage/isoctrl/'+ from +'/TRASH')){
                                      fs.mkdirSync('./app/storage/isoctrl/'+ from +'/TRASH');
                                      fs.mkdirSync('./app/storage/isoctrl/'+ from +'/TRASH/tattach');
                                  }

                                  origin_path = './app/storage/isoctrl/' + from + "/" + req.body.fileName
                                  destiny_path = './app/storage/isoctrl/' + from + "/TRASH/" + req.body.fileName
                                  origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                                  destiny_attach_path = './app/storage/isoctrl/' + from + "/TRASH/tattach/"
                                  origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                  destiny_cl_path = './app/storage/isoctrl/' + from + "/TRASH/tattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'

                              }else if(req.body.to == "On hold"){

                                  if (!fs.existsSync('./app/storage/isoctrl/' + from + '/HOLD')){
                                      fs.mkdirSync('./app/storage/isoctrl/' + from +'/HOLD');
                                      fs.mkdirSync('./app/storage/isoctrl/' + from +'/HOLD/hattach');
                                  }
                                  
                                  origin_path = './app/storage/isoctrl/' + from + "/" + req.body.fileName
                                  destiny_path = './app/storage/isoctrl/' + from + "/HOLD/" + req.body.fileName
                                  origin_attach_path = './app/storage/isoctrl/' + from + "/attach/"
                                  destiny_attach_path = './app/storage/isoctrl/' + from + "/HOLD/hattach/"
                                  origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                                  destiny_cl_path = './app/storage/isoctrl/' + from + "/HOLD/hattach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'

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
                              if (process.env.REACT_APP_IFC == "1"){
                                  if ((req.body.role == "StressLead" || req.body.role == "SupportsLead") && (from == "stress" && req.body.to == "supports" || from == "supports" && req.body.to == "stress")){
                                      ld = 1;
                                  }
                              }

                              if (req.body.to == "Recycle bin" || req.body.to == "On hold"){
                                  u = username
                                  r = req.body.role
                              }
                              console.log("viene de ",from)
                              console.log(req.body.deleted, req.body.onhold)
                              if(process.env.REACT_APP_PROGRESS == "1" && req.body.to !== "Recycle bin" && req.body.to !== "On hold"){
                                  let type = ""
                                  if(process.env.REACT_APP_IFC == "0"){
                                    type = "value_ifd"
                                  }else{
                                    type = "value_ifc"
                                  }
                                  sql.query("SELECT tpipes_id FROM dpipes WHERE tag = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
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
                                          console.log(results[0])
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
                                              sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ?, progress = ?, realprogress = ? WHERE filename = ?", [ld, u, r, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, progress, newprogress, req.body.fileName], (err, results) =>{
                                                if (err) {
                                                    res.status(401).send("cant update")
                                                    console.log("error: ", err);
                                                }else{
                                                    console.log("iso moved" );
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
                                  sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, deleted = ?, onhold = ?, `from`= ?, `to`= ?, comments = ? WHERE filename = ?", [ld, u, r, req.body.deleted, req.body.onhold, from, req.body.to, req.body.comment, req.body.fileName], (err, results) =>{
                                      if (err) {
                                          console.log("error: ", err);
                                      }else{
                                          console.log("iso moved" );
                                          res.status(200).send("moved")
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

}

const returnLead = async(req, res) =>{
    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{   
        username  = results[0].name
        sql.query("SELECT created_at FROM hisoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
            if (!results[0]){
                res.status(401).send("File not found");
            }else{
                const from = results[0].to
                let created_at = results[0].created_at
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                [req.body.fileName, results[0].revision, results[0].spo, results[0].sit,results[0].deleted, results[0].onhold, "Claimed by LD", req.body.to, "Unclaimed by leader", username], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        if(process.env.REACT_APP_PROGRESS == "1"){
                            let type = ""
                            if(process.env.REACT_APP_IFC == "0"){
                              type = "value_ifd"
                            }else{
                              type = "value_ifc"
                            }
                            sql.query("SELECT tpipes_id FROM dpipes WHERE tag = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
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
                                    console.log(results[0])
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

                                        sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 1, user = ?, role = ?, comments = ?, progress = ?, realprogress = ? WHERE filename = ?", ["None", null, "Unclaimed by leader", progress, newprogress, req.body.fileName], (err, results) =>{
                                            if (err) {
                                                console.log("error: ", err);
                                            }else{
                                                console.log("iso moved" );
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
                            sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 1, user = ?, role = ?, comments = ? WHERE filename = ?", ["None", null, "Unclaimed by leader", req.body.fileName], (err, results) =>{
                                if (err) {
                                    console.log("error: ", err);
                                }else{
                                    console.log("iso moved" );
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

module.exports = {
  transaction,
  returnLead
};