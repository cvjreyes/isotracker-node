const uploadFile = require("../fileMiddleware/file.middleware");
const fs = require("fs");
const bodyParser = require('body-parser')
const sql = require("../../db.js");
const pathPackage = require("path")


const upload = async (req, res) => {
  try {
    await uploadFile.uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      console.log("undef")
      return res.status(400).send({ message: "Please upload a file!" });
    }
    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
    var i = req.file.originalname.lastIndexOf('.');
    let cl = false
    let extension = ""
    if (i > 0) {
      extension = req.file.originalname.substring(i+1);
      if(req.file.originalname.substring(i-2) == 'CL.pdf'){
        cl = true
      }
    }
    if (extension == 'pdf' && !cl){
      
      fs.copyFile('./app/storage/isoctrl/design/' + req.file.originalname, './app/storage/isoctrl/design/attach/' + req.file.originalname.split('.').slice(0, -1).join('.') + '-CL.pdf', (err) => {
        if (err) throw err;
      });
    }
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: err,
    });
  }
};

const update = async (req, res) => {
  try {
    console.log(req.file)
    await uploadFile.updateFileMiddleware(req, res);

    if (req.file == undefined) {
      console.log("undef")
      return res.status(400).send({ message: "Please upload a file!" });
    }

    var extension = "";
    var cl = false;
    var i = req.file.originalname.lastIndexOf('.');
    if (i > 0) {
      extension = req.file.originalname.substring(i+1);
      if (req.file.originalname.substring(i-2) == 'CL.pdf'){
        cl = true
      }
    }
    if(extension == 'pdf' && !cl){

      const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
      for(let i = 0; i < folders.length; i++){
        let path = null
        if (cl){
          path = folders[i] + '/' + req.file.originalname.split('.').slice(0, -1);
          path = path.slice(0,-3);
        }else{
          path = folders[i] + '/' + req.file.originalname.split('.').slice(0, -1);
        }
        
        if (fs.existsSync(path +'.pdf')) {
          exists = true;
          where = folders[i]
        }
      }

      if (!fs.existsSync(where +'/bak/')){
        fs.mkdirSync(where +'/bak/');
      }
      
      let currentDate = new Date();
      currentDate = currentDate.getDate() + "-" + (currentDate.getMonth()+1)  + "-" + currentDate.getFullYear() + "_" +
                    currentDate.getHours() + "-" + currentDate.getMinutes() + "-" + currentDate.getSeconds();
      fs.copyFile(where + '/' + req.file.originalname, where +'/bak/' + req.file.originalname.split('.').slice(0, -1).join('.')+currentDate+'-bak.pdf', (err) => {
        if (err) throw err;
      });
    }

    res.status(200).send({
      message: "Updated the file successfully: " + req.file.originalname,
    });
  
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: err,
    });
  }
};

const getListFiles = (req, res) => {
  const tab = req.body.currentTab
  console.log("fetch de archivos")
  sql.query('SELECT * FROM misoctrls WHERE `to` = ?', [tab], (err, results) =>{

      res.json({
        rows: results
      })
    
  })
  /*
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];
s
    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: "./app/storage/isoctrl/Design" + file,
      });
    });
    
    res.status(200).send(fileInfos);
  });
  */
};

const piStatus = (req, res) =>{
  const fileName = req.params.fileName
  sql.query("SELECT spo, sit FROM misoctrls WHERE filename = ?", fileName, (err, results) =>{
    if(!results[0]){
      res.status(400).send("File not found")
    }else{
      res.status(200).json({
        spo : results[0].spo,
        sit: results[0].sit
      })
    }
  })
}

const download = (req, res) => {
  const fileName = req.params.fileName;
  let where, path = null
  const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/attach', './app/storage/isoctrl/issuer/attach', './app/storage/isoctrl/lde/attach', 
      './app/storage/isoctrl/materials/attach', './app/storage/isoctrl/stress/attach','./app/storage/isoctrl/supports/attach'];
  for(let i = 0; i < folders.length; i++){
    path = folders[i] + '/' + req.params.fileName
    if (fs.existsSync(path)) {
      exists = true;
      where = folders[i]
    }
  }
  res.download(where + '/' + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }else{
      console.log("Se descarga")
    }
  });
};

const getAttach = (req,res) =>{
  const fileName = req.params.fileName;
  let where, path = null
  let allFiles = []
  const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
  for(let i = 0; i < folders.length; i++){
    path = folders[i] + '/' + req.params.fileName
    if (fs.existsSync(path)) {
      exists = true;
      where = folders[i]
    }
  }

  let masterName = fileName.split('.').slice(0, -1)
  let origin_attach_path = where + "/attach/"
  let origin_cl_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
  let origin_proc_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
  let origin_inst_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'

  fs.readdir(origin_attach_path, (err, files) => {
    files.forEach(file => {                          
      let attachName = file.split('.').slice(0, -1)
      if(String(masterName).trim() == String(attachName).trim()){
        allFiles.push(file)
      }
    });
    if(fs.existsSync(origin_cl_path)){
      allFiles.push(fileName.split('.').slice(0, -1).join('.') + '-CL.pdf')
    }

    if(fs.existsSync(origin_proc_path)){
      allFiles.push(fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf')
    }

    if(fs.existsSync(origin_inst_path)){
      allFiles.push(fileName.split('.').slice(0, -1).join('.') + '-INST.pdf')
    }
    res.status(200).json(allFiles)
  });

  
}


const uploadHis = async (req, res) => {

  var username = "";
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, 0, 0, 0, "Upload","Design", "Uploaded", username, "Design"], (err, results) => {
        if (err) {
          console.log("error: ", err);
        }else{
          console.log("created hisoctrls");
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
                sql.query(q, ["Design", tl], (err, results)=>{
                  if(!results[0]){
                    res.status(401)
                  }else{
                    let progress = null
                    console.log(results[0])
                    if(type == "value_ifc"){
                      progress = results[0].value_ifc
                    }else{
                      progress = results[0].value_ifd
                    }
                    
                    sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress, realprogress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, " ","Design", "Uploaded", username, "Design", progress, progress], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        console.log("created misoctrls");
                      }
                    });
                    
                  }
                })
              }
            })
          }else{
            sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
            [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, " ","Design", "Uploaded", username, "Design", null], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
                console.log("created misoctrls");
              }
            });
          }         
        }
      });
    }
  });

  
}

const updateHis = async (req, res) => {

  const fileName = req.body.file
  var username = "";

  console.log(fileName, req.body.user)
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if(!results[0]){
            res.status(401).send("No files found");
        }else{
            let last = results[0]
            for (let i = 1; i < results.length; i++){
                if(results[i].updated_at > last.updated_at){
                    last = results[i]
                }
            }
    
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?)", 
            [fileName, last.revison, last.spo, last.sit, "Updated", last.from, "Updated", username], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
                console.log("created hisoctrls");
                sql.query("UPDATE misoctrls SET `from` = ?, `comments` = ?, `user` = ? WHERE filename = ?", 
                ["Updated", "Updated", username, fileName], (err, results) => {
                  if (err) {
                    console.log("error: ", err);
                  }else{
                    console.log("created misoctrls");
                    //res.status(200).send("uploaded to his")
                  }
                });
              }
            });
          }
        })
    }
  });

  
  }

const getMaster = async(req, res) =>{
  fileName = req.params.fileName
  console.log(fileName)
  const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
  './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
  for(let i = 0; i < folders.length; i++){
    let path = folders[i] + '/' + fileName;
    if (fs.existsSync(path)) {
      var file = fs.createReadStream(path);
      file.pipe(res);
    }
  }

}


const updateStatus = async(req,res) =>{
  let designUploadedCount, designProgressCount, stressCount, supportsCount, materialsCount, issuerCount, isoControlToIssueCount, r0Count, r1Count, r2Count, onHoldCount, deletedCount, totalCount, modelCount = 0
  sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND claimed IS NULL", ["Design"], (err, results) =>{
    if(!results[0]){
      res.status(500).send("Error")
    }else{
      designUploadedCount = results[0]["COUNT(id)"]
      sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND claimed IS NOT NULL", ["Design"], (err, results) =>{
        if(!results[0]){
          res.status(500).send("Error")
        }else{
          designProgressCount = results[0]["COUNT(id)"]
          sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["Stress"], (err, results) =>{
            if(!results[0]){
              res.status(500).send("Error")
            }else{
              stressCount = results[0]["COUNT(id)"]
              sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["Supports"], (err, results) =>{
                if(!results[0]){
                  res.status(500).send("Error")
                }else{
                  supportsCount = results[0]["COUNT(id)"]
                  sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["On hold"], (err, results) =>{
                    if(!results[0]){
                      res.status(500).send("Error")
                    }else{
                      onHoldCount = results[0]["COUNT(id)"]
                      sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["Recycle bin"], (err, results) =>{
                        if(!results[0]){
                          res.status(500).send("Error")
                        }else{
                          deletedCount = results[0]["COUNT(id)"]
                          sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["Materials"], (err, results) =>{
                            if(!results[0]){
                              res.status(500).send("Error")
                            }else{
                              materialsCount = results[0]["COUNT(id)"]
                              sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ?", ["Issuer"], (err, results) =>{
                                if(!results[0]){
                                  res.status(500).send("Error")
                                }else{
                                  issuerCount = results[0]["COUNT(id)"]
                                  sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND issued IS NULL", ["LDE/Isocontrol"], (err, results) =>{
                                    if(!results[0]){
                                      res.status(500).send("Error")
                                    }else{
                                      isoControlToIssueCount = results[0]["COUNT(id)"]
                                      sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND issued = 1 AND revision = 1", ["LDE/Isocontrol"],(err, results) =>{
                                        if(!results[0]){
                                          res.status(500).send("Error")
                                        }else{
                                          r0Count = results[0]["COUNT(id)"]
                                          sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND issued = 1 AND revision = 2", ["LDE/Isocontrol"],(err, results) =>{
                                            if(!results[0]){
                                              res.status(500).send("Error")
                                            }else{
                                              r1Count = results[0]["COUNT(id)"]
                                              sql.query("SELECT COUNT(id) FROM misoctrls WHERE `to` = ? AND issued = 1 AND revision = 3", ["LDE/Isocontrol"],(err, results) =>{
                                                if(!results[0]){
                                                  res.status(500).send("Error")
                                                }else{
                                                  r2Count = results[0]["COUNT(id)"]
                                                  sql.query("SELECT COUNT(DISTINCT(isoid)) FROM misoctrls", (err, results) =>{
                                                    if(!results[0]){
                                                      res.status(500).send("Error")
                                                    }else{
                                                      totalCount = results[0]["COUNT(DISTINCT(isoid))"]
                                                      if(process.env.REACT_APP_PROGRESS == "0"){
                                                        res.status(200).send({
                                                          designUploaded: designUploadedCount,
                                                          designProgress: designProgressCount,
                                                          stress: stressCount,
                                                          supports: supportsCount,
                                                          materials: materialsCount,
                                                          issuer: issuerCount,
                                                          isocontrolToIssue: isoControlToIssueCount,
                                                          r0: r0Count,
                                                          r1: r1Count,
                                                          r2: r2Count,
                                                          onHold: onHoldCount,
                                                          deleted: deletedCount,
                                                          total: totalCount,
                                                        })
                                                      }else{
                                                        sql.query("SELECT COUNT(id) FROM dpipes", (err, results) =>{
                                                          if(!results[0]){
                                                            res.status(500).send("Error")
                                                          }else{
                                                            modelCount = results[0]["COUNT(id)"]
                                                            
                                                            res.status(200).send({
                                                              designUploaded: designUploadedCount,
                                                              designProgress: designProgressCount,
                                                              stress: stressCount,
                                                              supports: supportsCount,
                                                              materials: materialsCount,
                                                              issuer: issuerCount,
                                                              isocontrolToIssue: isoControlToIssueCount,
                                                              r0: r0Count,
                                                              r1: r1Count,
                                                              r2: r2Count,
                                                              onHold: onHoldCount,
                                                              deleted: deletedCount,
                                                              total: totalCount,
                                                              model: modelCount
                                                            })
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
            }
          })
        }
      })
    }
  })
}
  
const restore = async(req,res) =>{
  const fileName = req.body.fileName
  sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
    if(!results[0]){
        res.status(401).send("No files found");
    }else if((results[0].deleted == 0 || results[0].deleted == null) && (results[0].onhold == 0 || results[0].onhold == null)){   
      console.log("asbfuidsbauihg")
      res.status(401).send("This isometric has already been restored!");
    }else{
        let destiny = results[0].from
        let origin = results[0].to
        sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?)", 
        [fileName, results.revision, results[0].spo, results[0].sit, origin, 0, 0, destiny, "Restored", req.body.user], (err, results) => {
          if (err) {
            console.log("error: ", err);
          }else{
            sql.query("UPDATE misoctrls SET deleted = 0, onhold = 0, `from` = ?, `to` = ?, `comments` = ?, `user` = ? WHERE filename = ?", 
            [origin, destiny, "Restored", "None", fileName], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
                console.log("created misoctrls");

                let masterName = req.body.fileName.split('.').slice(0, -1)
                let origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path = ""

                if (origin == "Recycle bin"){
                  origin_path = './app/storage/isoctrl/' + destiny + "/TRASH/" + fileName
                  destiny_path = './app/storage/isoctrl/' + destiny + "/" + fileName
                  origin_attach_path = './app/storage/isoctrl/' + destiny + "/TRASH/tattach/"
                  destiny_attach_path = './app/storage/isoctrl/' + destiny+ "/attach/"
                  origin_cl_path = './app/storage/isoctrl/' + destiny + "/TRASH/tattach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                  destiny_cl_path = './app/storage/isoctrl/' + destiny + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                }else{
                  origin_path = './app/storage/isoctrl/' + destiny + "/HOLD/" + fileName
                  destiny_path = './app/storage/isoctrl/' + destiny + "/" + fileName
                  origin_attach_path = './app/storage/isoctrl/' + destiny + "/HOLD/hattach/"
                  destiny_attach_path = './app/storage/isoctrl/' + destiny+ "/attach/"
                  origin_cl_path = './app/storage/isoctrl/' + destiny + "/HOLD/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                  destiny_cl_path = './app/storage/isoctrl/' + destiny + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                }
              
                if(fs.existsSync(origin_path)){
                  fs.rename(origin_path, destiny_path, function (err) {
                      if (err) throw err

                  })

                  fs.readdir(origin_attach_path, (err, files) => {
                      files.forEach(file => {                          
                        let attachName = file.split('.').slice(0, -1)
                        console.log(masterName == attachName)
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

                  
                  
              }
              res.status(200).send("Restored")
              }
              
            })
          }
        })
      }
    })
}

const statusFiles = (req,res) =>{
  sql.query('SELECT * FROM misoctrls LEFT JOIN dpipes ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes.tag', (err, results) =>{
    if(!results[0]){
      res.status(401).send("No files found");
    }else{
      res.status(200).send({
        rows : results
      })
    }
  })
}

const historyFiles = (req,res) =>{
  sql.query('SELECT * FROM hisoctrls', (err, results) =>{
    if(!results[0]){
      res.status(401).send("No files found");
    }else{
      res.status(200).send({
        rows : results
      })
    }
  })
}

const toProcess = (req,res) =>{
  let action = req.body.action
  let fileName = req.body.file
  console.log(fileName)
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      let spoclaimed = 0
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', fileName, (err, results) =>{
        if(err){
          res.status(401).send("No files found")
        }else{
          let file = results[0]
          let prevProcess = file.spo
          let nextProcess = 0
          let from = file.to
          let to = "Process"
          if (action === "accept"){
            nextProcess = 2
            from = "Accepted Proc"
            to = file.to
          }else if(action === "deny"){
            nextProcess = 3
            from = "Denied Proc"
            to = file.to
          }else if(prevProcess == 2 || prevProcess == 3){
            nextProcess = 4
          }else{
            nextProcess = 1
          }
          
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, file.revision, nextProcess, file.sit, file.deleted, file.onhold, spoclaimed, from, to, "Process", req.body.role, username], (err, results) => {
            if (err) {
              console.log("error: ", err);
            }else{
              sql.query('UPDATE misoctrls SET spoclaimed = ?, spo = ?, spouser = ? WHERE filename = ?', [spoclaimed, nextProcess, username, fileName], (err, results) =>{
                if (err) {
                  console.log("error: ", err);
                }else{
                  res.status(200).send("Actualizado proceso")
                }
              })
            }
          })
        }
      })
    }
  })
}

const instrument = (req,res) =>{
  let action = req.body.action
  let fileName = req.body.file
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      let sitclaimed = 0
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', fileName, (err, results) =>{
        if(err){
          res.status(401).send("No files found")
        }else{
          let file = results[0]
          let prevProcess = file.sit
          let nextProcess = 0
          let from = file.to
          let to = "Instrument"
          if (action === "accept"){
            nextProcess = 2
            username = "None"
          }else if(action === "deny"){
            nextProcess = 3
            username = "None"
            from = "Accepted Inst"
            to = file.to
          }else if(prevProcess == 2 || prevProcess == 3){
            nextProcess = 4
            username = "None"
            from = "Denied Inst"
            to = file.to
          }else{
            nextProcess = 1
          }
          
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, sitclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, last.revision, file.spo, nextProcess, file.deleted, file.onhold, sitclaimed, from, to, "Process", req.body.role, username], (err, results) => {
            if (err) {
              console.log("error: ", err);
            }else{
              sql.query('UPDATE misoctrls SET sitclaimed = ?, sit = ?, situser = ? WHERE filename = ?', [sitclaimed, nextProcess, username, fileName], (err, results) =>{
                if (err) {
                  console.log("error: ", err);
                }else{
                  res.status(200).send("Actualizado instrumentacion")
                }
              })
            }
          })
        }
      })
    }
  })
}

const filesProcInst = (req,res) =>{
  let type = req.body.type
  if(type == "Process"){
    sql.query('SELECT * FROM misoctrls WHERE spo = 1 OR spo = 4', (err, results) =>{
      if(err){
        res.status(401).send("No files found")
      }else{
        res.status(200).send({
          rows : results
        })
      }
    })
  }else{
    sql.query('SELECT * FROM misoctrls WHERE sit = 1 OR sit = 4', (err, results) =>{
      if(err){
        res.status(401).send("No files found")
      }else{
        res.status(200).send({
          rows : results
        })
      }
    })
  }
}

const uploadProc = async(req, res) =>{

  await uploadFile.uploadFileProcMiddleware(req, res);
  if (req.file == undefined) {
    console.log("undef")
    return res.status(400).send({ message: "Please upload a file!" });
  }else{
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + req.file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
    fs.rename(where + '/attach/' + req.file.originalname, where + '/attach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-PROC.pdf', function(err) {
      if ( err ) console.log('ERROR: ' + err);
    });
    
    res.status(200).send("File uploaded")
  }

}

const uploadInst = async(req, res) =>{
  await uploadFile.uploadFileInstMiddleware(req, res);
  if (req.file == undefined) {
    console.log("undef")
    return res.status(400).send({ message: "Please upload a file!" });
  }else{
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + req.file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
    fs.rename(where + '/attach/' + req.file.originalname, where + '/attach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-INST.pdf', function(err) {
      if ( err ) console.log('ERROR: ' + err);
    });
    
    res.status(200).send("File uploaded")
  }
}

const downloadHistory = async(req,res) =>{
  sql.query("SELECT filename, `from`, `to`, created_at, comments, user FROM hisoctrls", (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const downloadStatus = async(req,res) =>{
  sql.query("SELECT deleted, onhold, issued FROM misoctrls", (err, results)=>{
    const delhold = results
    sql.query("SELECT isoid, created_at, updated_at, revision FROM misoctrls", (err, results) =>{
      if(!results[0]){
        res.status(401).send("El historial esta vacio")
      }else{
        for(let i = 0; i < results.length; i++){
  
          if(delhold[i].issued == null){
            results[i].revision = "ON GOING R" + results[i].revision
          }else{
            results[i].revision = "ISSUED"
          }
          if(delhold[i].deleted == 1){
            results[i].revision = "DELETED"
          }else if (delhold[i].onhold == 1){
            results[i].revision = "ON HOLD"
          }
  
        }
        res.json(JSON.stringify(results)).status(200)
      }
    })
  })
  
}

const uploadReport = async(req,res) =>{
  const area_index = req.body[0].indexOf("area")
  const tag_index = req.body[0].indexOf("tag")
  const diameter_index = req.body[0].indexOf("diameter")
  const calc_index = req.body[0].indexOf("calc_notes")
  if(area_index == -1 || tag_index == -1 || diameter_index == -1 || calc_index == -1){
    console.log("error",area_index,tag_index,diameter_index,calc_index)
    res.status(401).send("Missing columns!")
  }else{
    for(let i = 1; i < req.body.length; i++){
      sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
        const areaid = results[0].id
        if(process.env.REACT_APP_MMDN == 0){
          sql.query("SELECT id FROM diameters WHERE dn = ?", [req.body[i][diameter_index]], (err, results) =>{
            if(!results[0]){
              res.status(401).send("Invaid diameter in some lines")
            }else{
              const diameterid = results[0].id
              let calc_notes = 0
              if(req.body[i][calc_index] != null){
                calc_notes = 1
              }
  
              let tl = 0
  
              if(calc_notes == 0){
                tl = 3
              }else{
                if(req.body[i][diameter_index] < 50){
                  tl = 1
                }else{
                  tl = 2
                }
              }
              sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id) VALUES (?,?,?,?,?)", [areaid, req.body[i][tag_index], diameterid, calc_notes, tl], (err, results)=>{
                if(err){
                  console.log(err)
                }
              })
            }
          })
        }else{
          sql.query("SELECT id FROM diameters WHERE nps = ?", [req.body[i][diameter_index]], (err, results) =>{
            if(!results[0]){
              res.status(401).send("Invaid diameter in some lines")
            }else{
              const diameterid = results[0].id
              let calc_notes = 0
              if(req.body[i][calc_index] != null){
                calc_notes = 1
                
              }
  
              let tl = 0
  
              if(calc_notes == 0){
                tl = 3
              }else{
                if(req.body[i][diameter_index] < 2.00){
                  tl = 1
                }else{
                  tl = 2
                }
              }
              sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id) VALUES (?,?,?,?,?)", [areaid, req.body[i][tag_index], diameterid, calc_notes, tl], (err, results)=>{
                if(err){
                  console.log(err)
                }
              })
            }
          })
        }
        
      })
      
    }
    res.status(200)
  }

}

const checkPipe = async(req,res) =>{
  const fileName = req.params.fileName.split('.').slice(0, -1)
  sql.query("SELECT * FROM dpipes WHERE tag = ?", [fileName], (err, results) =>{
    if(!results[0]){
      res.json({
        exists: false
      }).status(200)
    }else{
      res.json({
        exists: true
      }).status(200)
    }
  })
}

const currentProgress = async(req,res) =>{
  sql.query("SELECT SUM(progress) FROM misoctrls", (req, results) =>{
    const progress = results[0]["SUM(progress)"]
    sql.query("SELECT SUM(realprogress) FROM misoctrls", (req, results) =>{
      const realprogress = results[0]["SUM(realprogress)"]
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
                progress: (progress/maxProgress * 100).toFixed(2),
                realprogress: (realprogress/maxProgress * 100).toFixed(2)
              }).status(200)
            })
          })
        })
      })
    })
  })
}

const currentProgressISO = async(req,res) =>{
  sql.query("SELECT SUM(progress) FROM misoctrls INNER JOIN dpipes ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes.tag", (req, results) =>{
    const progress = results[0]["SUM(progress)"]
    sql.query("SELECT SUM(realprogress) FROM misoctrls INNER JOIN dpipes ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes.tag", (req, results) =>{
      const realprogress = results[0]["SUM(realprogress)"]
      sql.query("SELECT COUNT(tpipes_id) FROM dpipes INNER JOIN misoctrls ON dpipes.tag COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 1", (err, results) =>{
        const tp1 = results[0]["COUNT(tpipes_id)"]
        sql.query("SELECT COUNT(tpipes_id) FROM dpipes INNER JOIN misoctrls ON dpipes.tag COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 2", (err, results) =>{
          const tp2 = results[0]["COUNT(tpipes_id)"]
          sql.query("SELECT COUNT(tpipes_id) FROM dpipes INNER JOIN misoctrls ON dpipes.tag COLLATE utf8mb4_unicode_ci = misoctrls.isoid WHERE tpipes_id = 3", (err, results) =>{
            const tp3 = results[0]["COUNT(tpipes_id)"]
            sql.query("SELECT weight FROM tpipes", (err, results) =>{
              const weights = results
              const maxProgress = tp1 * results[0].weight + tp2 * results[1].weight + tp3 * results[2].weight
              console.log((progress/maxProgress * 100).toFixed(2))
              res.json({
                progressISO: (progress/maxProgress * 100).toFixed(2),
                realprogressISO: (realprogress/maxProgress * 100).toFixed(2)
              }).status(200)
            })
          })
        })
      })
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

const toIssue = async(req,res) =>{
  const fileName = req.body.file
  const transmittal = req.body.transmittal
  const date = req.body.date
  const user = req.body.user
  const role = req.body.role



  sql.query("SELECT revision FROM misoctrls WHERE filename = ?", [fileName], (err, results)=>{
    if(!results[0]){
      res.status(401).send("File not found")
    }else{
      const revision = results[0].revision
      const newFileName = fileName.split('.').slice(0, -1).join('.') + '-' + revision + '.pdf'

      let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path

      if (!fs.existsSync('./app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date)){
        fs.mkdirSync('./app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date);
      }

      masterName = fileName.split('.').slice(0, -1)

      origin_path = './app/storage/isoctrl/lde/' + fileName
      destiny_path = './app/storage/isoctrl/lde/' + newFileName
      origin_attach_path = './app/storage/isoctrl/lde/attach/'
      destiny_attach_path = './app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date +'/'
      origin_cl_path = './app/storage/isoctrl/lde/attach/' + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
      destiny_cl_path = './app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date + '/' + newFileName

      fs.rename(origin_path, destiny_path, function (err) {
        if (err) throw err
      })

      fs.readdir(origin_attach_path, (err, files) => {
        files.forEach(file => {                          
          let attachName = file.split('.').slice(0, -1)
          const i = file.lastIndexOf('.');
          const extension = file.substring(i+1);
          if(String(masterName).trim() == String(attachName).trim()){
            fs.rename(origin_attach_path+file, destiny_attach_path+attachName+'-'+revision+'.'+extension, function (err) {
                console.log("moved attach to transmittal")
                if (err) throw err

            })
          }
        });
      });

    if(fs.existsSync(origin_cl_path)){
        fs.rename(origin_cl_path, destiny_cl_path, function (err) {
            if (err) throw err
            console.log('Moved CL to transmittal')
        })
    }



      sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{
        if (!results[0]){
          res.status(401).send("Username or password incorrect");
        }else{   
          username  = results[0].name
          sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
            if(!results[0]){
                res.status(401).send("No files found");
            }else{
                let last = results[0]
                for (let i = 1; i < results.length; i++){
                    if(results[i].updated_at > last.updated_at){
                        last = results[i]
                    }
                }
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, issued, transmittal, issued_date, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                [newFileName, revision, last.spo, last.sit, 1, transmittal, date, last.deleted, last.onhold, last.spoclaimed, "LDE/IsoControl", "Issued", "Issued", role, username], (err, results) => {
                  if (err) {
                    console.log("error: ", err);
                  }else{
                    console.log("issued in hisoctrls");
                    console.log(newFileName, revision, fileName)
                    sql.query("UPDATE misoctrls SET filename = ?  WHERE filename = ?", [newFileName, fileName], (err, results)=>{
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        if(process.env.REACT_APP_PROGRESS == "0"){
                          sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, transmittal = ?, issued_date = ?, user = ?, role = ? WHERE filename = ?", [revision + 1, transmittal, date, "None", null, newFileName], (err, results)=>{
                            if (err) {
                              console.log("error: ", err);
                            }else{
                              console.log("issued in misoctrls");
                            }
                          })
                        }else{
                            let type = ""
                            if(process.env.REACT_APP_IFC == "0"){
                              type = "value_ifd"
                            }else{
                              type = "value_ifc"
                            }
                            sql.query("SELECT tpipes_id FROM dpipes WHERE tag = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
                              if(!results[0]){
                                res.status(401)
                              }else{
                                tl = results[0].tpipes_id
                                const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                                let level = "Transmittal"
                                console.log(tl)
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
                                      console.log(newprogress)
                                      sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, user = ?, role = ?, progress = ?, realprogress = ?, transmittal = ?, issued_date = ? WHERE filename = ?", [revision + 1, "None", null, newprogress, newprogress, transmittal, date, newFileName], (err, results)=>{
                                        if (err) {
                                          console.log("error: ", err);
                                        }else{
                                          console.log("issued in misoctrls");
                                          res.status(200).send("issued")
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
                  })
                }
            })
          }
        })
      }
    
  })

}
const request = (req,res) =>{

  const fileName = req.body.file
  const user = req.body.user
  const role = req.body.role

  sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if(!results[0]){
            res.status(401).send("No files found");
        }else{
            let last = results[0]
            for (let i = 1; i < results.length; i++){
                if(results[i].updated_at > last.updated_at){
                    last = results[i]
                }
            }
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, last.revision, last.spo, last.sit, last.deleted, last.onhold, last.spoclaimed, "LDE/IsoControl", "Requested", "Requested", role, username], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
                console.log("issued in hisoctrls");
                sql.query("SELECT requested FROM misoctrls WHERE filename = ?", [fileName], (err, results)=>{
                  if(results[0].requested !== null){
                    res.status(401).send("Isometric already requested")
                  }else{
                    sql.query("UPDATE misoctrls SET requested = 1  WHERE filename = ?", [fileName], (err, results)=>{
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        res.status(200).send("Requested")
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

const newRev = (req, res) =>{
  
  const fileName = req.body.file
  const user = req.body.user
  const role = req.body.role

  const newFileName = fileName.substring(0,fileName.length-6) + ".pdf"

  const origin_path = './app/storage/isoctrl/lde/' + fileName
  const destiny_path = './app/storage/isoctrl/design/' + newFileName

  sql.query("SELECT requested FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
    if(!results[0]){
      res.status(401).send("file not found")
    }else{
      if(results[0].requested == 2){
        res.status(401).send("Already sent for revision")
      }else{
        fs.copyFile(origin_path, destiny_path, (err) => {
          if (err) throw err;
        });
        sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
          if (!results[0]){
            res.status(401).send("Username or password incorrect");
          }else{   
            username  = results[0].name
            sql.query("SELECT revision FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
              if(!results[0]){
                res.status(401).send("File not found")
              }else{
                const revision = results[0].revision
                if(process.env.REACT_APP_PROGRESS == "0"){
                  sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
                  [newFileName, revision+1, 0, 0, "Issued","Design", "Revision", username, "SpecialityLead"], (err, results) => {
                    if (err) {
                      console.log("error: ", err);
                    }else{
                      console.log("created hisoctrls");
                      sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                      [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", "Revision", username, "SpecialityLead", null], (err, results) => {
                        if (err) {
                          console.log("error: ", err);
                        }else{
                          console.log("created misoctrls");
                          sql.query("UPDATE misoctrls SET requested = 2 WHERE filename = ?", [fileName], (err, results) =>{
                            if(err){
                              res.status(401).send(err)
                            }else{
                              res.status(200).send("Sent for revision")
                            }
                          })             
                        }
                      });
        
                    }
                  })
                }else{
                  let type = ""
                  if(process.env.REACT_APP_IFC == "0"){
                    type = "value_ifd"
                  }else{
                    type = "value_ifc"
                  }
                  sql.query("SELECT tpipes_id FROM dpipes WHERE tag = ?", [newFileName.split('.').slice(0, -1)], (err, results)=>{
                    if(!results[0]){
                      res.status(401)
                    }else{
                      tl = results[0].tpipes_id
                      const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                      let level = req.body.to
                      level = "Design"
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
                            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
                            [newFileName, revision, 0, 0, "Issued","Design", "Revision", username, "SpecialityLead"], (err, results) => {
                              if (err) {
                                console.log("error: ", err);
                              }else{
                                console.log("created hisoctrls");
                                sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress, realprogress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                                [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", "Revision", username, "SpecialityLead", newprogress, newprogress], (err, results) => {
                                  if (err) {
                                    console.log("error: ", err);
                                  }else{
                                    console.log("created misoctrls");
                                    sql.query("UPDATE misoctrls SET requested = 2 WHERE filename = ?", [fileName], (err, results) =>{
                                      if(err){
                                        res.status(401).send(err)
                                      }else{
                                        res.status(200).send("Sent for revision")
                                      }
                                    })             
                                  }
                                });
        
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
            
          })
        }
      }
    })
  }

  


module.exports = {
  upload,
  update,
  getListFiles,
  download,
  uploadHis,
  updateHis,
  getMaster,
  updateStatus,
  restore,
  statusFiles,
  historyFiles,
  toProcess,
  instrument,
  filesProcInst,
  uploadProc,
  uploadInst,
  getAttach,
  piStatus,
  downloadHistory,
  downloadStatus,
  uploadReport,
  checkPipe,
  currentProgress,
  getMaxProgress,
  currentProgressISO,
  toIssue,
  request,
  newRev
};