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

const download = (req, res) => {
  const fileName = req.params.fileName;
  let where, path = null
  const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
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

    }
  });
};


const uploadHis = async (req, res) => {

  var username = "";
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, 0, 0, 0, 0, "Upload","Design", "Uploaded", username, "Design"], (err, results) => {
        if (err) {
          console.log("error: ", err);
        }else{
          console.log("created hisoctrls");
          sql.query("INSERT INTO misoctrls (filename, isoid, revision, tie, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
          [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, 0, " ","Design", "Uploaded", username, "Design"], (err, results) => {
            if (err) {
              console.log("error: ", err);
            }else{
              console.log("created misoctrls");
              res.status(200).send("Done")
            }
          });
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
    
            sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, last.spo, last.sit, "Updated", last.from, "Updated", username], (err, results) => {
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
  let designUploadedCount, designProgressCount, stressCount, supportsCount, onHoldCount, deletedCount = 0
  sql.query("SELECT COUNT(id) FROM misoctrls WHERE `from` = ? AND claimed IS NULL", [""], (err, results) =>{
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
                          res.status(200).send({
                            designUploaded: designUploadedCount,
                            designProgress: designProgressCount,
                            stress: stressCount,
                            supports: supportsCount,
                            onHold: onHoldCount,
                            deleted: deletedCount
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
        sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, deleted, onhold, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
        [fileName, 0, 0, results[0].spo, results[0].sit, origin, 0, 0, destiny, "Restored", req.body.user], (err, results) => {
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
              }
            })
          }
        })
      }
    })
}

const statusFiles = (req,res) =>{
  sql.query('SELECT * FROM misoctrls', (err, results) =>{
    console.log("resultados:",results)
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
    console.log("resultados:",results)
    if(!results[0]){
      res.status(401).send("No files found");
    }else{
      res.status(200).send({
        rows : results
      })
    }
  })
}

const process = (req,res) =>{
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
          
          sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, 0, 0, nextProcess, file.sit, file.deleted, file.onhold, spoclaimed, from, to, "Process", req.body.role, username], (err, results) => {
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
  let fileName = req.body.fil
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
          
          sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, deleted, onhold, sitclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, 0, 0, file.spo, nextProcess, file.deleted, file.onhold, sitclaimed, from, to, "Process", req.body.role, username], (err, results) => {
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
  process,
  instrument,
  filesProcInst,
  uploadProc,
  uploadInst
};