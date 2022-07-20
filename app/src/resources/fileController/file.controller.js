const uploadFile = require("../fileMiddleware/file.middleware");
const uploadBom = require("../fileMiddleware/bom.middleware");
const fs = require("fs");
const sql = require("../../db.js");
var format = require('date-format');
var cron = require('node-cron');
const csv=require('csvtojson')
const readXlsxFile = require('read-excel-file/node');
const { verify } = require("crypto");
const { type } = require("os");
const { resourceLimits } = require("worker_threads");
const nodemailer = require("nodemailer");
const { Console } = require("console");

const upload = async (req, res) => {
  try {
    await uploadFile.uploadFileMiddleware(req, res);

    if (req.file == undefined) {
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
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: err,
    });
  }
};

const update = async (req, res) => {
  try {
    await uploadFile.updateFileMiddleware(req, res);

    if (req.file == undefined) {
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
  if(process.env.NODE_PROGRESS === "1"){
    sql.query('SELECT misoctrls.*, dpipes_view.*, tpipes.`name`, tpipes.weight, tpipes.`code`, pestpipes.progress as status FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id LEFT JOIN pipectrls ON dpipes_view.tag = pipectrls.tag LEFT JOIN pestpipes ON pipectrls.status_id = pestpipes.id WHERE misoctrls.`to` = ? AND (onhold != 1 || onhold IS NULL)', [tab], (err, results) =>{
      
      res.json({
        rows: results
      })
    
  })
  }else{
    if(tab === "On hold"){
      sql.query('SELECT * FROM misoctrls WHERE onhold = 1', [tab], (err, results) =>{
      
        res.json({
          rows: results
        })
      
      })
      
    }else{
      sql.query('SELECT * FROM misoctrls WHERE misoctrls.to = ?', [tab], (err, results) =>{
      
        res.json({
          rows: results
        })
      
      })
    }
  }
  
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
  let master = fileName.split('.').slice(0, -1)[0]
  let issued = false
  if(master.substring(master.length-3, master.length) === "-0" || master.substring(master.length-3, master.length) === "-1" || master.substring(master.length-3, master.length) === "-2" || master.substring(master.length-3, master.length) === "-3"){
    issued = true
  }

  if(master.includes("-CL")){
    master = master.substring(0, master.length - 3)+".pdf"
  }else if(master.includes("-INST")){
    master = master.substring(0, master.length - 5)+".pdf"
  }else if(master.includes("-PROC")){
    master = master.substring(0, master.length - 5)+".pdf"
  }else{
    master += ".pdf"
  }

  
  sql.query("SELECT isoid FROM misoctrls WHERE filename = ?", master, (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      let fileName_noext = results[0].isoid
      let where, path = null
  sql.query("SELECT issued, transmittal, issued_date FROM misoctrls WHERE filename = ?", master, (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      if(results[0].issued != 1){
        const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
        './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/attach', './app/storage/isoctrl/issuer/attach', './app/storage/isoctrl/lde/attach', 
        './app/storage/isoctrl/materials/attach', './app/storage/isoctrl/stress/attach','./app/storage/isoctrl/supports/attach','./app/storage/isoctrl/design/TRASH', './app/storage/isoctrl/issuer/TRASH', './app/storage/isoctrl/lde/TRASH', 
        './app/storage/isoctrl/materials/TRASH', './app/storage/isoctrl/stress/TRASH','./app/storage/isoctrl/supports/TRASH','./app/storage/isoctrl/design/TRASH/tattach', './app/storage/isoctrl/issuer/TRASH/tattach', './app/storage/isoctrl/lde/TRASH/tattach', 
        './app/storage/isoctrl/materials/TRASH/tattach', './app/storage/isoctrl/stress/TRASH/tattach','./app/storage/isoctrl/supports/TRASH/tattach', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', 
        './app/storage/isoctrl/materials/HOLD', './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD','./app/storage/isoctrl/design/HOLD/hattach', './app/storage/isoctrl/issuer/HOLD/hattach', './app/storage/isoctrl/lde/HOLD/hattach', 
        './app/storage/isoctrl/materials/HOLD/hattach', './app/storage/isoctrl/stress/HOLD/hattach','./app/storage/isoctrl/supports/HOLD/hattach'];

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
            res.status(200)
          }
        });
      }else{  
        const trn = results[0].transmittal
        const date = results[0].issued_date
        res.download('./app/storage/isoctrl/lde/transmittals/' + trn + '/' + date + '/' + fileName, fileName, (err) => {
          if (err) {
            console.log("error download")
            res.status(500).send({
              message: "Could not download the file. " + err,
            });
          }else{
            
          }
        })
      } 
    }
  })
    }
  })
  
};

const getAttach = (req,res) =>{
  const fileName = req.params.fileName;
  let where, path = null
  let allFiles = []
  let folders = null

  sql.query("SELECT transmittal, issued_date FROM misoctrls WHERE filename = ?", fileName, (err, results)=>{
    if(!results[0].transmittal){
      const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
        './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/attach', './app/storage/isoctrl/issuer/attach', './app/storage/isoctrl/lde/attach', 
        './app/storage/isoctrl/materials/attach', './app/storage/isoctrl/stress/attach','./app/storage/isoctrl/supports/attach','./app/storage/isoctrl/design/TRASH', './app/storage/isoctrl/issuer/TRASH', './app/storage/isoctrl/lde/TRASH', 
        './app/storage/isoctrl/materials/TRASH', './app/storage/isoctrl/stress/TRASH','./app/storage/isoctrl/supports/TRASH','./app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', 
        './app/storage/isoctrl/materials/HOLD', './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
  
      for(let i = 0; i < folders.length; i++){
        path = folders[i] + '/' + req.params.fileName
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }

      let masterName = fileName.split('.').slice(0, -1)
      let origin_attach_path, origin_cl_path, origin_proc_path, origin_inst_path

      if(where.includes("TRASH")){
        origin_attach_path = where + "/tattach/"
        origin_cl_path = where + "/tattach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
        origin_proc_path = where + "/tattach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
        origin_inst_path = where + "/tattach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
      }else if(where.includes("HOLD")){
        origin_attach_path = where + "/hattach/"
        origin_cl_path = where + "/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
        origin_proc_path = where + "/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
        origin_inst_path = where + "/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
      }else{
        origin_attach_path = where + "/attach/"
        origin_cl_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
        origin_proc_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
        origin_inst_path = where + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
      }


      fs.readdir(origin_attach_path, (err, files) => {
        if(files){
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
        }
        
        res.status(200).json(allFiles)
      });
    }else{
      folders = ['./app/storage/isoctrl/lde/transmittals/' + results[0].transmittal + "/" + results[0].issued_date];
  
      for(let i = 0; i < folders.length; i++){
        path = folders[i] + '/' + req.params.fileName
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }

      let masterName = fileName.split('.').slice(0, -1)
      let origin_attach_path = where + "/"
      let origin_cl_path = where + "/" + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
      let origin_proc_path = where + "/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
      let origin_inst_path = where + "/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'

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
  })
  

  
}

const uploadHis = async (req, res) => {
  var username = "";
  sql.query('SELECT users.* FROM owners LEFT JOIN users ON owner_iso_id = users.id LEFT JOIN dpipes_view ON owners.tag = dpipes_view.tag WHERE isoid = ?', [req.body.fileName.split('.').slice(0, -1)], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query("INSERT INTO hisoctrls (filename, revision, claimed, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, 0, 1, 0, 0, "Design","Design", "Uploaded", username, "Design"], (err, results) => {
        if (err) {
          console.log("error: ", err);
          res.status(401)
        }else{
          console.log("created hisoctrls");
          if(process.env.NODE_PROGRESS == "1"){
            let type = ""
            if(process.env.NODE_IFC == "0"){
              type = "value_ifd"
            }else{
              type = "value_ifc"
            }
            sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
              if(!results[0]){
                console.log("No se encuentra isoid")
                res.status(401)
              }else{
                tl = results[0].tpipes_id
                const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
                sql.query(q, ["Design", tl], (err, results)=>{
                  if(!results[0]){
                    res.status(401)
                  }else{
                    let progress = null
                    if(type == "value_ifc"){
                      progress = results[0].value_ifc
                    }else{
                      progress = results[0].value_ifd
                    }
                    
                    sql.query("INSERT INTO misoctrls (filename, isoid, revision, claimed, spo, sit, `from`, `to`, comments, user, role, progress, realprogress, max_tray) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 1, 0, 0, " ","Design", "Uploaded", username, "Design", progress, progress, "Design"], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                        res.status(401)
                      }else{
                        console.log("created misoctrls");
                        res.status(200).send("created misoctrls")
                      }
                    });
                    
                  }
                })
              }
            })
          }else{
            sql.query("INSERT INTO misoctrls (filename, isoid, revision, claimed, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 1, 0, 0, " ","Design", "Uploaded", username, "Design", null], (err, results) => {
              if (err) {
                console.log("error: ", err);
                res.status(401)
              }else{
                console.log("created misoctrls");
                res.status(200).send("created misoctrls")
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
    
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{
      username = results[0].name
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
    
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)",
          [fileName, last.revision, last.spo, last.sit, "Updated", last.from, "Updated", username, req.body.role], (err, results) => {
            if (err) {
              console.log("error: ", err);
              res.send({success:1}).status(200)
            }else{
              res.send({success:1}).status(200)
              console.log("created hisoctrls");
            }
          });
        }
      })
    }
  });

}

const getMaster = async(req, res) =>{
  fileName = req.params.fileName
  const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
  './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/TRASH', './app/storage/isoctrl/issuer/TRASH', './app/storage/isoctrl/lde/TRASH', './app/storage/isoctrl/materials/TRASH',
  './app/storage/isoctrl/stress/TRASH','./app/storage/isoctrl/supports/TRASH','./app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
  './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
  for(let i = 0; i < folders.length; i++){
    let path = folders[i] + '/' + fileName;
    if (fs.existsSync(path)) {
      var file = fs.createReadStream(path);
      file.pipe(res);
    }
  }

}


const updateStatus = async(req,res) =>{
  let designR0 = 0, designR1 = 0, designR2 = 0, designHold = 0, designDeleted = 0, designStock = 0, stressR0 = 0, stressR1 = 0, stressR2 = 0, stressHold = 0, stressDeleted = 0, stressStock = 0, supportsR0 = 0, supportsR1 = 0, supportsR2 = 0, supportsHold = 0, supportsDeleted = 0, supportsStock = 0, materialsR0 = 0, materialsR1 = 0, materialsR2 = 0, materialsHold = 0, materialsDeleted = 0, materialsStock = 0, issuerR0 = 0, issuerR1 = 0, issuerR2 = 0, issuerHold = 0, issuerDeleted = 0, issuerStock = 0, toIssueR0 = 0, toIssueR1 = 0, toIssueR2 = 0, toIssueHold = 0, toIssueDeleted = 0, toIssueStock = 0, issuedR0 = 0, issuedR1 = 0, issuedR2 = 0, issuedDeleted = 0, issuedStock = 0, totalR0 = 0, totalR1 = 0, totalR2 = 0, totalHold = 0, totalDeleted = 0, totalStock = 0, modelCount = 0
  sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE (revision = 0 OR revision = 1) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{
    if(!results[0]){
      results = []
    }
      for(let i = 0; i < results.length; i++){
        if(results[i].to == "Design" && results[i].revision == 0){
          designR0 = designR0 + 1
        }else if((results[i].to == "Stress" || results[i].to == "stress") && results[i].revision == 0){
          stressR0 += 1
        }else if(results[i].to == "Supports" && results[i].revision == 0){
          supportsR0 += 1
        }else if(results[i].to == "Materials" && results[i].revision == 0){
          materialsR0 += 1
        }else if(results[i].to == "Issuer" && results[i].revision == 0){
          issuerR0 += 1
        }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 0 && (results[i].issued == null || results[i].issued == 0)){
          toIssueR0 += 1
        }else if(results[i].to == "LDE/Isocontrol" && results[i].issued == 1 && results[i].revision == 1){
          issuedR0 += 1
        }
      }


      totalR0 = designR0 + stressR0 + supportsR0 + materialsR0 + issuerR0 + toIssueR0 + issuedR0
      sql.query("SELECT `to`,issued, revision FROM misoctrls WHERE (revision = 1 OR revision = 2) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{
        if(!results[0]){
          results = []
        }
          for(let i = 0; i < results.length; i++){
            if(results[i].to == "Design" && results[i].revision == 1){
              designR1 += 1
            }else if((results[i].to == "Stress" || results[i].to == "stress") && results[i].revision == 1){
              stressR1 += 1
            }else if(results[i].to == "Supports" && results[i].revision == 1){
              supportsR1 += 1
            }else if(results[i].to == "Materials" && results[i].revision == 1){
              materialsR1 += 1
            }else if(results[i].to == "Issuer" && results[i].revision == 1){
              issuerR1 += 1
            }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 1 && (results[i].issued == null || results[i].issued == 0)){
              toIssueR1 += 1
            }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 2 && results[i].issued == 1){
              issuedR1 += 1
            }
          }
    
          totalR1 = designR1 + stressR1 + supportsR1 + materialsR1 + issuerR1 + toIssueR1 + issuedR1
    
        
          sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE (revision = 2 OR revision = 3) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{
            if(!results[0]){
              results = []
            }
              for(let i = 0; i < results.length; i++){
                if(results[i].to == "Design" && results[i].revision == 2){
                  designR2 += 1
                }else if((results[i].to == "Stress" || results[i].to == "stress") && results[i].revision == 2){
                  stressR2 += 1
                }else if(results[i].to == "Supports" && results[i].revision == 2){
                  supportsR2 += 1
                }else if(results[i].to == "Materials" && results[i].revision == 2){
                  materialsR2 += 1
                }else if(results[i].to == "Issuer" && results[i].revision == 2){
                  issuerR2 += 1
                }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 2 && (results[i].issued == null || results[i].issued == 0)){
                  toIssueR2 += 1
                }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 3 && results[i].issued == 1){
                  issuedR2 += 1
                }
              }
        
              totalR2 = designR2 + stressR2 + supportsR2 + materialsR2 + issuerR2 + toIssueR2 + issuedR2
              sql.query("SELECT `to` FROM misoctrls WHERE onhold = 1", (err, results) =>{
                if(!results[0]){
                  results = []
                }
                  for(let i = 0; i < results.length; i++){
                    if(results[i].to == "Design"){
                      designHold += 1
                    }else if(results[i].to == "Stress" || results[i].to == "stress"){
                      stressHold += 1
                    }else if(results[i].to == "Supports"){
                      supportsHold += 1
                    }else if(results[i].to == "Materials"){
                      materialsHold += 1
                    }else if(results[i].to == "Issuer"){
                      issuerHold += 1
                    }else if(results[i].to == "LDE/Isocontrol"){
                      toIssueHold += 1
                    }
                  }
            
                  totalHold = designHold + stressHold + supportsHold + materialsHold + issuerHold + toIssueHold
                  sql.query("SELECT `from`, issued FROM misoctrls WHERE `to` = ?",["Recycle bin"], (err, results) =>{
                    if(!results[0]){
                      results = []
                    }
                      for(let i = 0; i < results.length; i++){
                        if(results[i].from == "Design"){
                          designDeleted += 1
                        }else if(results[i].from == "Stress" || results[i].from == "stress"){
                          stressDeleted += 1
                        }else if(results[i].from == "Supports"){
                          supportsDeleted += 1
                        }else if(results[i].from == "Materials"){
                          materialsDeleted += 1
                        }else if(results[i].from == "Issuer"){
                          issuerDeleted += 1
                        }else if(results[i].from == "LDE/Isocontrol" && results[i].issued == null){
                          toIssueDeleted += 1
                        }else if(results[i].from == "LDE/Isocontrol" && results[i].issued == 1){
                          issuedDeleted += 1
                        }
                      }
                      sql.query("SELECT COUNT(id) FROM dpipes", (err, results) =>{
                        if(!results[0]){
                          results = []
                        }
                          modelCount = results[0]["COUNT(id)"]

                          totalDeleted = designDeleted + stressDeleted + supportsDeleted + materialsDeleted + issuerDeleted + toIssueDeleted + issuedDeleted
                          designStock = designR0 + designR1 + designR2 + designHold 
                          stressStock = stressR0 + stressR1 + stressR2 + stressHold 
                          supportsStock = supportsR0 + supportsR1 + supportsR2 + supportsHold 
                          materialsStock = materialsR0 + materialsR1 + materialsR2 + materialsHold
                          issuerStock = issuerR0 + issuerR1 + issuerR2 + issuerHold
                          toIssueStock = toIssueR0 + toIssueR1 + toIssueR2 + toIssueHold
                          issuedStock = issuedR0 + issuedR1 + issuedR2
                          totalStock = totalR0 + totalHold
    
    
                          res.status(200).json({
                            designR0: designR0,
                            designR1: designR1, 
                            designR2: designR2,
                            designHold: designHold, 
                            designDeleted: designDeleted, 
                            designStock: designStock, 
                            stressR0: stressR0, 
                            stressR1: stressR1, 
                            stressR2: stressR2, 
                            stressHold: stressHold, 
                            stressDeleted: stressDeleted, 
                            stressStock: stressStock, 
                            supportsR0: supportsR0, 
                            supportsR1: supportsR1, 
                            supportsR2: supportsR2, 
                            supportsHold: supportsHold, 
                            supportsDeleted: supportsDeleted, 
                            supportsStock: supportsStock, 
                            materialsR0: materialsR0, 
                            materialsR1: materialsR1, 
                            materialsR2: materialsR2, 
                            materialsHold: materialsHold, 
                            materialsDeleted: materialsDeleted, 
                            materialsStock: materialsStock, 
                            issuerR0: issuerR0, 
                            issuerR1: issuerR1, 
                            issuerR2: issuerR2, 
                            issuerHold: issuerHold, 
                            issuerDeleted: issuerDeleted, 
                            issuerStock: issuerStock, 
                            toIssueR0: toIssueR0, 
                            toIssueR1: toIssueR1, 
                            toIssueR2: toIssueR2, 
                            toIssueHold: toIssueHold, 
                            toIssueDeleted: toIssueDeleted, 
                            toIssueStock: toIssueStock, 
                            issuedR0: issuedR0, 
                            issuedR1: issuedR1,
                            issuedR2: issuedR2, 
                            issuedDeleted: issuedDeleted, 
                            issuedStock: issuedStock, 
                            totalR0: totalR0, 
                            totalR1: totalR1, 
                            totalR2: totalR2, 
                            totalHold: totalHold, 
                            totalDeleted: totalDeleted, 
                            totalStock: totalStock,
                            modelCount: modelCount
                          })
                        })
                        
                      })
                
                      
                    
                  })
                
              })
            
          })
    
  })
}
  
const restore = async(req,res) =>{
  const fileName = req.body.fileName
  const role = req.body.role
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
      if(!results[0]){
          res.status(401).send("No files found");
      }else if((results[0].deleted == 0 || results[0].deleted == null) && (results[0].onhold == 0 || results[0].onhold == null)){   
        res.status(401).send("This isometric has already been restored!");
      }else{
          let destiny = results[0].from
          let origin = results[0].to
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, results[0].revision, results[0].spo, results[0].sit, 0, 0, origin, destiny, "Restored", username, role], (err, results) => {
            if (err) {
              console.log("error: ", err);
            }else{
              sql.query("UPDATE misoctrls SET deleted = 0, onhold = 0, `from` = ?, `to` = ?, `comments` = ?, `user` = ?, role = ? WHERE filename = ?", 
              [origin, destiny, "Restored", "None", role, fileName], (err, results) => {
                if (err) {
                  console.log("error: ", err);
                }else{
                  console.log("created misoctrls");
                  if(destiny == "LDE/Isocontrol"){
                    destiny = "lde"
                  }

                  let masterName = req.body.fileName.split('.').slice(0, -1)
                  let origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path, origin_proc_path, origin_inst_path, destiny_proc_path, destiny_inst_path = ""

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
                    origin_proc_path = './app/storage/isoctrl/' + destiny + "/HOLD/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                    destiny_proc_path = './app/storage/isoctrl/' + destiny + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                    origin_inst_path = './app/storage/isoctrl/' + destiny + "/HOLD/hattach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                    destiny_inst_path = './app/storage/isoctrl/' + destiny + "/attach/" + fileName.split('.').slice(0, -1).join('.') + '-INST.pdf'

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
                res.status(200).send("Restored")
                }
                
              })
            }
          })
        }
      })
    }
  })
}

const statusFiles = (req,res) =>{
  if(process.env.NODE_PROGRESS == "1"){
    sql.query('SELECT * FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid JOIN tpipes ON tpipes.id = dpipes_view.tpipes_id', (err, results) =>{
      if(!results[0]){
        console.log("No files found");
        res.status(200).send({
          rows : results
        })
      }else{
        for(let i = 0; i < results.length; i++){
          
          if(results[i].to == "LDE/Isocontrol"){
            results[i].to = "LOS/Isocontrol"
          }

          if(results[i].to == "Design"){
            if(results[i].verifydesign == 1 || results[i].role == "DesignLead"){
              results[i].to = "Design lead"
            }
          }

          if(results[i].to == "Stress"){
            if(results[i].verifydesign == 1 || results[i].role == "StressLead"){
              results[i].to = "Stress lead"
            }
          }

          if(results[i].to == "Supports"){
            if(results[i].verifydesign == 1 || results[i].role == "SupportsLead"){
              results[i].to = "Supports lead"
            }
          }

          if(results[i].onhold == 1){
            results[i].from = results[i].to
            results[i].to = "On hold"
          }
        }

        res.status(200).send({
          rows : results
        })
      }
    })
  }else{
    sql.query('SELECT * FROM misoctrls', (err, results) =>{
      if(!results[0]){
        console.log("No files found");
        res.status(200).send({
          rows : results
        })
      }else{

        for(let i = 0; i < results.length; i++){
          
          if(results[i].to == "LDE/Isocontrol"){
            results[i].to = "LOS/Isocontrol"
          }

          if(results[i].to == "Design"){
            if(results[i].verifydesign == 1 || results[i].role == "DesignLead"){
              results[i].to = "Design lead"
            }
          }

          if(results[i].to == "Stress"){
            if(results[i].verifydesign == 1 || results[i].role == "StressLead"){
              results[i].to = "Stress lead"
            }
          }

          if(results[i].to == "Supports"){
            if(results[i].verifydesign == 1 || results[i].role == "SupportsLead"){
              results[i].to = "Supports lead"
            }
          }
        }
        res.status(200).send({
          rows : results
        })
      }
    })
  }
}

const historyFiles = (req,res) =>{
  sql.query('SELECT * FROM hisoctrls ORDER BY created_at DESC', (err, results) =>{
    if(!results[0]){
      res.status(401).send("No files found");
    }else{
      res.status(200).send({
        rows : results
      })
    }
  })
}

const modelled = (req,res) =>{
  sql.query('SELECT tag, dpipes_view.isoid, code, blocked FROM dpipes_view RIGHT JOIN tpipes ON tpipes.id = dpipes_view.tpipes_id LEFT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid group by dpipes_view.isoid, blocked', (err, results)=>{
    if(!results[0]){
      res.status(401)
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
            nextProcess = 5
          }else{
            nextProcess = 5
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
            from = "Accepted Inst"
            to = file.to
          }else if(action === "deny"){
            nextProcess = 3
            from = "Denied Inst"
            to = file.to
          }else if(prevProcess == 2 || prevProcess == 3){
            nextProcess = 5
          }else{
            nextProcess = 5
          }
          
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, sitclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, file.revision, file.spo, nextProcess, file.deleted, file.onhold, sitclaimed, from, to, "Instrument", req.body.role, username], (err, results) => {
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

const cancelProc = (req, res) =>{
  const fileName = req.body.file
  let prev = 0
  sql.query('SELECT `from`,`to`, id, user, role FROM hisoctrls WHERE filename = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, "Process"], (err, results) =>{
    if(!results[0]){
      prev = 0
    }else if(results[0].from == "Accepted Proc"){
      prev = 2
    }else if(results[0].from == "Denied Proc"){
      prev = 3
    }else{
      prev = 0
    }
    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
    
        sql.query("INSERT INTO hisoctrls (filename, spo, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?)",
        [fileName, prev, "Cancelled PRO", "Process", "Cancelled PRO", req.body.role, username], (err, results)=>{
          if(err){
            res.status(401)
          }
        })
      }
    })
    
    sql.query('UPDATE misoctrls SET spo = ? WHERE filename = ?', [prev, fileName], (err, results) =>{
      if(err){
        res.status(401)
      }else{
        res.status(200).send("cancelado proc")
      }
    })
  })
}

const cancelInst = (req,res) =>{
  const fileName = req.body.file
  let prev = 0
  sql.query('SELECT `from` FROM hisoctrls WHERE filename = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, "Instrument"], (err, results) =>{
    if(!results[0]){
      prev = 0
    }else if(results[0].from == "Accepted Inst"){
      prev = 2
    }else if(results[0].from == "Denied Inst"){
      prev = 3
    }else{
      prev = 0
    }

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
    
        sql.query("INSERT INTO hisoctrls (filename, sit, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?)",
        [fileName, prev, "Cancelled PRO", "Instrumentation", "Cancelled INST", req.body.role, username], (err, results)=>{
          if(err){
            res.status(401)
          }
        })
      }
    })

    sql.query('UPDATE misoctrls SET sit = ? WHERE filename = ?', [prev, fileName], (err, results) =>{
      if(err){
        res.status(401)
      }else{
        res.status(200).send("cancelado inst")
      }
    })
  })
}

const filesProcInst = (req,res) =>{
  let type = req.body.type
  if(type == "Process"){
    sql.query('SELECT * FROM misoctrls WHERE spo = 1 OR spo = 4 or spo = 5', (err, results) =>{
      if(err){
        res.status(401).send("No files found")
      }else{
        res.status(200).send({
          rows : results
        })
      }
    })
  }else{
    sql.query('SELECT * FROM misoctrls WHERE sit = 1 OR sit = 4 or sit = 5', (err, results) =>{
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
    return res.status(400).send({ message: "Please upload a file!" });
  }else{
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
      './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + req.file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
      if(where.includes("HOLD")){
        fs.rename(where + '/hattach/' + req.file.originalname, where + '/hattach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-PROC.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }else{
        fs.rename(where + '/attach/' + req.file.originalname, where + '/attach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-PROC.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }
    
    
    res.status(200).send("File uploaded")
  }

}

const uploadInst = async(req, res) =>{
  await uploadFile.uploadFileInstMiddleware(req, res);
  if (req.file == undefined) {
    return res.status(400).send({ message: "Please upload a file!" });
  }else{
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
      './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + req.file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
      if(where.includes("HOLD")){
        fs.rename(where + '/hattach/' + req.file.originalname, where + '/hattach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-INST.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }else{
        fs.rename(where + '/attach/' + req.file.originalname, where + '/attach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-INST.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }
    
    
    res.status(200).send("File uploaded")
  }
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
    sql.query("TRUNCATE dpipes", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          let areaid = null
          if(results[0]){
            areaid = results[0].id
          }
          if(process.env.NODE_MMDN == 1){
            sql.query("SELECT id FROM diameters WHERE nps = ?", [req.body[i][diameter_index]], (err, results) =>{
              if(!results[0]){
                console.log("ivalid diameter: " + req.body[i][diameter_index])
              }else{
                const diameterid = results[0].id
                let calc_notes = 0
                if(req.body[i][calc_index] != "" && req.body[i][calc_index] != null){
                  calc_notes = 1
                }
    
                let tl = 0
    
                if(calc_notes == 1){
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
            sql.query("SELECT id FROM diameters WHERE dn = ?", [req.body[i][diameter_index]], (err, results) =>{
              if(!results[0]){
                console.log("ivalid diameter: " + req.body[i][diameter_index])
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

}

const checkPipe = async(req,res) =>{
  let fileName = req.params.fileName.split('.').slice(0, -1)
  if(fileName.toString().includes("-CL")){
     fileName = fileName.toString().split('-').slice(0, -1)
  }
  sql.query("SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName], (err, results) =>{
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

const checkOwner = async(req,res) =>{
  const fileName = req.params.fileName.split('.').slice(0, -1)
  sql.query("SELECT owner_iso_id FROM dpipes_view LEFT JOIN owners ON dpipes_view.tag = owners.tag WHERE isoid = ?", [fileName], (err, results) =>{
    console.log(results)
    if(!results[0].owner_iso_id){
      res.json({
        owner: false
      }).status(200)
    }else{
      res.json({
        owner: true
      }).status(200)
    }
  })
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
    })
  })
}

const currentProgressISO = async(req,res) =>{
  sql.query("SELECT SUM(progress) FROM misoctrls INNER JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid WHERE revision = 0 OR (revision = 1 AND issued = 1)", (req, results) =>{
    const progress = results[0]["SUM(progress)"]
    sql.query("SELECT SUM(realprogress) FROM misoctrls INNER JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid WHERE requested is null OR requested = 1", (req, results) =>{
      const realprogress = results[0]["SUM(realprogress)"]
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


  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
      sql.query("SELECT isoid, revision FROM misoctrls WHERE filename = ?", [fileName], (err, results)=>{
        if(!results[0]){
          res.status(401).send("File not found")
        }else{
          const revision = results[0].revision
          const newFileName = fileName.split('.').slice(0, -1).join('.') + '-' + revision + '.pdf'
          const isoid = results[0].isoid
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
                    [fileName, revision, last.spo, last.sit, 1, transmittal, date, last.deleted, last.onhold, last.spoclaimed, "LDE/IsoControl", "Issued", "Issued", role, username], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        console.log("issued in hisoctrls");
                        sql.query("UPDATE misoctrls SET filename = ?  WHERE filename = ?", [newFileName, fileName], (err, results)=>{
                          if (err) {
                            console.log("error: ", err);
                          }else{
                            if(process.env.NODE_PROGRESS == "0"){
                              sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, transmittal = ?, issued_date = ?, user = ?, role = ? WHERE filename = ?", [revision + 1, transmittal, date, "None", null, newFileName], (err, results)=>{
                                if (err) {
                                  console.log("error: ", err);
                                }else{
                                  console.log("issued in misoctrls");
                                  res.status(200).send({issued: "issued"})
                                }
                              })
                            }else{
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
                                    let level = "Transmittal"
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
                                          sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, user = ?, role = ?, progress = ?, realprogress = ?, transmittal = ?, issued_date = ?, max_tray = ? WHERE filename = ?", [revision + 1, "None", null, newprogress, newprogress, transmittal, date, "Transmittal",newFileName], (err, results)=>{
                                            if (err) {
                                              console.log("error: ", err);
                                            }else{
                                              console.log("issued in misoctrls");
                                              sql.query("SELECT bypass.id, bstatus_id FROM bypass LEFT JOIN misoctrls ON bypass.misoctrls_id = misoctrls.id WHERE misoctrls.isoid COLLATE utf8mb4_unicode_ci = ?", [isoid], (err, results) =>{
                                                if(!results[0]){
                                                  res.status(200).send({revision: "newRev"})
                                                }else{
                                                  for(let i = 0; i < results.length; i++){
                                                    let closed = 0
                                                     if(results[i].bstatus_id == 2){
                                                      closed = 6
                                                    }else if(results[i].bstatus_id == 3){
                                                      closed = 7
                                                    }
                                                    sql.query("UPDATE bypass SET bstatus_id = ? WHERE id = ?", [closed, results[i].id], (err, results) =>{
                                                      if(err){
                                                        console.log(err)
                                                        res.status(401)
                                                      }
                                                    })
                                                  }
                                                  res.status(200).send({issued: "issued"})
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
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
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
  const comments = req.body.comments
  const newFileName = fileName.substring(0,fileName.length-6) + ".pdf"

  const origin_path = './app/storage/isoctrl/lde/' + fileName
  const destiny_path = './app/storage/isoctrl/design/' + newFileName

  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('-').slice(0, -1)], (err, results)=>{
    if(!results && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
      })
    }else{
      sql.query("SELECT requested FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
        if(!results[0]){
          res.status(401).send("file not found")
        }else{
          if(results[0].requested == 2){
            res.status(401).send({already: "Already sent for revision"})
          }else{
            fs.copyFile(origin_path, destiny_path, (err) => {
              if (err) throw err;
            });
            sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
              if (!results[0]){
                res.status(401).send("Username or password incorrect");
              }else{   
                username  = results[0].name
                sql.query("SELECT id, revision FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                  if(!results[0]){
                    res.status(401).send("File not found")
                  }else{
                    const iso_id = results[0].id
                    const revision = results[0].revision
                    if(process.env.NODE_PROGRESS == "0"){
                      sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
                      [newFileName, revision+1, 0, 0, "Issued","Design", comments, username, "SpecialityLead"], (err, results) => {
                        if (err) {
                          console.log("error: ", err);
                        }else{
                          console.log("created hisoctrls");
                          sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                          [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", comments, username, "SpecialityLead", null], (err, results) => {
                            if (err) {
                              console.log("error: ", err);
                            }else{
                              console.log("created misoctrls");
                              sql.query("UPDATE misoctrls SET requested = 2 WHERE filename = ?", [fileName], (err, results) =>{
                                if(err){
                                  res.status(401).send(err)
                                }else{
                                  res.status(200).send({revision: "newRev"})
                                }
                              })             
                            }
                          });
            
                        }
                      })
                    }else{
                      let type = ""
                      if(process.env.NODE_IFC == "0"){
                        type = "value_ifd"
                      }else{
                        type = "value_ifc"
                      }
                      sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [newFileName.split('.').slice(0, -1)], (err, results)=>{
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
                                [newFileName, revision, 0, 0, "Issued","Design", comments, username, "SpecialityLead"], (err, results) => {
                                  if (err) {
                                    console.log("error: ", err);
                                  }else{
                                    console.log("created hisoctrls");
                                    sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress, realprogress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                                    [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", comments, username, "SpecialityLead", newprogress, newprogress], (err, results) => {
                                      if (err) {
                                        console.log("error: ", err);
                                      }else{
                                        console.log("created misoctrls");
                                        sql.query("UPDATE misoctrls SET requested = 2 WHERE filename = ?", [fileName], (err, results) =>{
                                          if(err){
                                            res.status(401).send(err)
                                          }else{
                                            res.status(200).send({revision: "newRev"})
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
  })
  
 }

  const rename = (req, res) =>{
    let newName = req.body.newName
    const oldName = req.body.oldName

    if(!newName.includes(".pdf")){
      newName+=".pdf"
    }
    
    sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [oldName], (err, results) =>{
      if(!results[0]){
          res.status(401).send("No files found");
      }else{
          let last = results[0]
          for (let i = 1; i < results.length; i++){
              if(results[i].updated_at > last.updated_at){
                  last = results[i]
              }
          }

          sql.query('SELECT `to` FROM misoctrls WHERE filename = ?', [oldName], (err, results)=>{
            if(!results[0]){
              res.status(401)
            }else{
              let local_from = results[0].to
              sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
              [newName, last.revision, last.spo, last.sit, last.from, last.to, "Rename", last.user, last.role], (err, results) => {
                if (err) {
                  console.log("error: ", err);
                }else{
                  console.log("created hisoctrls");
                  sql.query('UPDATE misoctrls SET filename = ?, isoid COLLATE utf8mb4_unicode_ci = ? WHERE filename = ?', [newName, newName.split('.').slice(0, -1), oldName], (err, results)=>{
                    if(err){
                      res.status(401)
                    }else{
                      console.log("renamed")

                      let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path,origin_proc_path,destiny_proc_path, origin_inst_path, destiny_inst_path = ""
                      masterName = oldName.split('.').slice(0, -1)
                      
                      if(local_from == "LDE/Isocontrol"){
                        local_from = "lde"
                      }                  

                      origin_path = './app/storage/isoctrl/' + local_from + "/" + oldName
                      destiny_path = './app/storage/isoctrl/' + local_from + "/" + newName
                      origin_attach_path = './app/storage/isoctrl/' + local_from + "/attach/"
                      destiny_attach_path = './app/storage/isoctrl/' + local_from + "/attach/"
                      origin_cl_path = './app/storage/isoctrl/' + local_from + "/attach/" + oldName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                      destiny_cl_path = './app/storage/isoctrl/' + local_from + "/attach/" + newName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                      origin_proc_path = './app/storage/isoctrl/' + local_from + "/attach/" + oldName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                      destiny_proc_path = './app/storage/isoctrl/' + local_from + "/attach/" + newName.split('.').slice(0, -1).join('.') + '-PROC.pdf'
                      origin_inst_path = './app/storage/isoctrl/' + local_from + "/attach/" + oldName.split('.').slice(0, -1).join('.') + '-INST.pdf'
                      destiny_inst_path = './app/storage/isoctrl/' + local_from + "/attach/" + newName.split('.').slice(0, -1).join('.') + '-INST.pdf'

                     
                      if(fs.existsSync(origin_path)){
                          fs.rename(origin_path, destiny_path, function (err) {
                              if (err) throw err

                          })

                          fs.readdir(origin_attach_path, (err, files) => {
                              files.forEach(file => {                          
                                let attachName = file.split('.').slice(0, -1)
                                if(String(masterName).trim() == String(attachName).trim()){
                                  var i = file.lastIndexOf('.');
                                  let extension = ""
                                  if (i > 0) {
                                    extension = file.substring(i+1);
                                  }
                                  fs.rename(origin_attach_path+file, destiny_attach_path+newName.split('.').slice(0, -1)+"."+extension, function (err) {
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

                      res.status(200)
                    }
                  })
                }
              });
            }
        })

        
      }
    })
  }

  const unlock = (req, res) =>{
    isoid = req.body.isoid
    sql.query('UPDATE misoctrls SET blocked = 0 WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [isoid],(err, results)=>{
      if(err){
        res.status(401)
      }else{
        console.log("unlocked")
        res.status(200)
      }
    })
  }

  const unlockAll = (req, res) =>{
    sql.query('UPDATE misoctrls JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid SET blocked = 0', (err, results)=>{
      if(err){
        console.log(err)
        res.status(401)
      }else{
        console.log("unlocked all")
        res.send({success: true}).status(200)
      }
    })
  }

  
cron.schedule('0 */10 * * * *', () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    downloadStatus3DPeriod()
  }
  
})

function downloadStatus3DPeriod(){
  sql.query('SELECT tag, tpipes_id, `to`, `from`, claimed, issued FROM dpipes_view RIGHT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid ORDER BY misoctrls.id DESC', (err, results) =>{
    
    let log = []
    let lines = []
    let ifc_ifd = ""
    let status = ""
    if(process.env.NODE_IFC == 0){
      ifc_ifd = "IFD"
    }else{
      ifc_ifd = "IFC"
    }
    log.push("DESIGN")
    log.push("\n")
    log.push("ONERROR CONTINUE")
    
    for(let i = 0; i < results.length;i++){
      if(lines.indexOf(results[i].tag) < 0){
        log.push("/" + results[i].tag + " STM ASS /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd)
        log.push("HANDLE ANY")
        log.push("ENDHANDLE")
        status = results[i].to
        if(status == "Design" && results[i].from == "" && results[i].claimed == 0){
          status = "New"
        }else if(status == "LDE/Isocontrol" && (results[i].issued == 0 || !results[i].issued)){
          status = "Issuer"
        }else if(results[i].issued == 1){
          status = "Transmittal"
        }else if(status == "On hold"){
          status = results[i].from
        }
  
        if(status != "Recycle bin" && status != "On hold"){
          log.push("/" + results[i].tag + " STM SET /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd + " /TL" + results[i].tpipes_id + "-" + status)
        }

        lines.push(results[i].tag)
      }
      
    }
    log.push("SAVEWORK")
    log.push("UNCLAIM ALL")
    log.push("FINISH")
    logToText = ""
    for(let i = 0; i < log.length; i++){
      logToText += log[i]+"\n"
    }
    fs.writeFile("fromIsoTrackerTo3d.mac", logToText, function (err) {
      if (err) return console.log(err);
      fs.copyFile('./fromIsoTrackerTo3d.mac', process.env.NODE_STATUS_ROUTE, (err) => {
        if (err) throw err;
      });
    });

  })
  console.log("Generated 3d report")
}

cron.schedule('0 */7 * * * *', async () => {
  
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    await uploadReportPeriod()
    if(process.env.NODE_ISSUER == "1"){
      const timeoutObj = setTimeout(() => {
        downloadIssuedTo3D()
      }, 15000)
      
    }
  }
  
})

async function uploadReportPeriod(){

  await csv()
  .fromFile(process.env.NODE_DPIPES_ROUTE)
  .then((jsonObj)=>{
      const csv = jsonObj

      sql.query("SELECT isoid, tpipes_id FROM dpipes_view", (err, results) =>{
        if(!results[0]){
          console.log("No existe")
        }else{
          const isoids = results
          for(let i = 0; i < isoids.length; i++){
            sql.query('UPDATE misoctrls set before_tpipes_id = ? WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [isoids[i].tpipes_id, isoids[i].isoid], (err, results)=>{
              if(err){
                console.log("Error updating")
              }
            })
          }
        }
      })

      sql.query("TRUNCATE dpipes", (err, results)=>{
        if(err){
          console.log(err)
        }
      })
      for(let i = 0; i < csv.length; i++){
        if(csv[i].spo === "true"){
          sql.query('UPDATE misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid SET spo = 1 WHERE dpipes_view.tag = ?', [csv[i].tag], (err, results)=>{
            if(err){
              console.log("Error updating")
            }
          })
        }
        if(csv[i].area != '' && csv[i].area != null && !csv[i].tag.includes("/") && !csv[i].tag.includes("=") && !csv[i].diameter != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [csv[i].area], (err, results) =>{
            let areaid = null
            if(results[0]){
              areaid = results[0].id
            }
            if(process.env.NODE_MMDN == 1){
              sql.query("SELECT id FROM diameters WHERE nps = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){
                }else{
                  const diameterid = results[0].id
                  let calc_notes = 0
                  if(csv[i].calc_notes != "" && csv[i].calc_notes != null){
                    calc_notes = 1
                  }
      
                  let tl = 0
      
                  if(calc_notes == 1){
                    tl = 3
                  }else{
                    if(csv[i].diameter < 2.00){
                      tl = 1
                    }else{
                      tl = 2
                    }
                  }
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id, diameter, calc_notes_description, pid, stress_level, insulation, unit, fluid, seq, train, spec) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl, csv[i].diameter, csv[i].calc_notes, csv[i].pid, csv[i].stresslevel, csv[i].insulation, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].train, csv[i].spec], (err, results)=>{
                    if(err){
                      console.log(err)
                    }
                    sql.query("SELECT id FROM pipectrls WHERE tag = ?", [ csv[i].tag], (err, results) =>{
                      if(!results[0]){
                        let initial_state = 0
                        if(tl == 1){
                          initial_state = 10
                        }else if(tl == 2){
                          initial_state = 7
                        }else{
                          initial_state = 1
                        }
                        sql.query("INSERT INTO pipectrls(tag, status_id) VALUES(?,?)", [csv[i].tag, initial_state], (err, results) =>{
                          if(err){
                            console.log(err)
                          }
                        })
                      }
                    })
                  })
                }
              })
            }else{
              sql.query("SELECT id FROM diameters WHERE dn = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){

                }else{
                  const diameterid = results[0].id
                  let calc_notes = 0
                  if(csv[i].calc_notes != "" && csv[i].calc_notes != null){
                    calc_notes = 1                  
                  }
      
                  let tl = 0
      
                  if(calc_notes == 1){
                    tl = 3
                  }else{
                    if(csv[i].diameter < 50){
                      tl = 1
                    }else{
                      tl = 2
                    }
                  }
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id, diameter, calc_notes_description, pid, stress_level, insulation, unit, fluid, seq, train, spec) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl, csv[i].diameter, csv[i].calc_notes, csv[i].pid, csv[i].stresslevel, csv[i].insulation, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].train, csv[i].spec], (err, results)=>{
                    if(err){
                      console.log(err)
                    }
                    sql.query("SELECT id FROM pipectrls WHERE tag = ?", [ csv[i].tag], (err, results) =>{
                      if(!results[0]){
                        let initial_state = 0
                        if(tl == 1){
                          initial_state = 10
                        }else if(tl == 2){
                          initial_state = 7
                        }else{
                          initial_state = 1
                        }
                        sql.query("INSERT INTO pipectrls(tag, status_id) VALUES(?,?)", [csv[i].tag, initial_state], (err, results) =>{
                          if(err){
                            console.log(err)
                          }
                        })
                      }
                    })
                  })
                }
              })
            }
            
          })
          
        }
      }
      console.log("Dpipes updated")
      
  })
  const timeoutObj = setTimeout(() => {
    refreshProgress()
  }, 5000)
  
}


async function refreshProgress(){

  sql.query('SELECT filename, isoid, `to`, before_tpipes_id, issued FROM misoctrls', (err, results) =>{
    if(!results[0]){
      console.log("Empty misoctrls")
    }else{
      const lines = results
      let type = null
      if(process.env.NODE_IFC == "0"){
        type = "value_ifd"
      }else{
        type = "value_ifc"
      }
      for(let i = 0; i < lines.length; i++){
        sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [lines[i].isoid], (err, results)=>{
          if(!results[0]){
            console.log("No existe en dpipes ", lines[i].isoid)
          }else{
            tl = results[0].tpipes_id
            const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
            let level = lines[i].to
            if(level == "LDE/Isocontrol"){
              if(lines[i].issued == 1){
                level = "Transmittal"
              }else{
                level = "Issuer"
              }
            }
            sql.query(q, [level, tl], (err, results)=>{
              if(!results[0]){
                console.log("No existe")
              }else{
                let newRealRrogress = null
                if(type == "value_ifc"){
                  newRealRrogress = results[0].value_ifc
                }else{
                  newRealRrogress = results[0].value_ifd
                }
                sql.query("SELECT progress, max_tray FROM misoctrls WHERE filename = ?", [lines[i].filename], (err, results1) =>{
                  if(!results1[0]){
                    console.log("No existe miso")        
                  }else{
                    let progress = results1[0].progress
                    let max_tray = results1[0].max_tray
                    const q2 = "SELECT "+type+ " as newp FROM ppipes WHERE level = ? AND tpipes_id = ?"
                    sql.query(q2, [max_tray, lines[i].before_tpipes_id], (err, results)=>{
                      if(!results[0]){
                        console.log("No existe")
                      }else{
                        
                        const newProgress = results[0].newp
                        sql.query("UPDATE misoctrls SET progress = ?, realprogress = ? WHERE filename = ?", [newRealRrogress, newProgress, lines[i].filename], (err, results) =>{
                          if (err) {
                              console.log("No existe")
                              console.log("error: ", err);
                          }else{
                              
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
    }
  })
  console.log("updated progress" );
}



const uploadEquisModelledReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")  
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
  const elements_index = req.body[0].indexOf("ELEMENTS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1 || elements_index == -1){
    console.log("error",area_index,tag_index,type_index,progress_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE dequis", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tequis WHERE code = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id
                sql.query("SELECT id FROM pequis WHERE percentage = ?", [req.body[i][progress_index]], (err, results) =>{
                  if(!results[0]){
                    res.json({invalid: i}).status(401)
                    return;
                  }else{
                    const percentageid = results[0].id
                    
                    sql.query("INSERT INTO dequis(areas_id, tag, pequis_id, tequis_id, elements) VALUES (?,?,?,?,?)", [areaid, req.body[i][tag_index], percentageid, typeid, req.body[i][elements_index]], (err, results)=>{
                      if(err){
                        console.log(err)
                      }
                    })
                    
                  }
                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadEquisEstimatedReport = (req,res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const qty_index = req.body[0].indexOf("QTY")
  if(area_index == -1 || type_index == -1 || qty_index == -1){
    console.log("error",area_index,type_index,qty_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE eequis", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tequis WHERE name = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id      
                sql.query("INSERT INTO eequis(areas_id, tequis_id, qty) VALUES (?,?,?)", [areaid, typeid, req.body[i][qty_index]], (err, results)=>{
                  if(err){
                    console.log(err)
                  }

                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadInstModelledReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1){
    console.log("error",area_index,tag_index,type_index,progress_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE dinsts", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tinsts WHERE code = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id
                sql.query("SELECT id FROM pinsts WHERE percentage = ?", [req.body[i][progress_index]], (err, results) =>{
                  if(!results[0]){
                    
                    res.json({invalid: i}).status(401)
                    return;
                  }else{
                    const percentageid = results[0].id
                    
                    sql.query("INSERT INTO dinsts(areas_id, tag, pinsts_id, tinsts_id) VALUES (?,?,?,?)", [areaid, req.body[i][tag_index], percentageid, typeid], (err, results)=>{
                      if(err){
                        console.log(err)
                      }
                    })
                    
                  }
                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadInstEstimatedReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const qty_index = req.body[0].indexOf("QTY")
  if(area_index == -1 || type_index == -1 || qty_index == -1){
    console.log("error",area_index,type_index,qty_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE einsts", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tinsts WHERE name = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id      
                sql.query("INSERT INTO einsts(areas_id, tinsts_id, qty) VALUES (?,?,?)", [areaid, typeid, req.body[i][qty_index]], (err, results)=>{
                  if(err){
                    console.log(err)
                  }

                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadCivModelledReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1){
    console.log("error",area_index,tag_index,type_index,progress_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE dcivils", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tcivils WHERE code = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id
                sql.query("SELECT id FROM pcivils WHERE percentage = ?", [req.body[i][progress_index]], (err, results) =>{
                  if(!results[0]){
                    
                    res.json({invalid: i}).status(401)
                    return;
                  }else{
                    const percentageid = results[0].id
                    
                    sql.query("INSERT INTO dcivils(areas_id, tag, pcivils_id, tcivils_id) VALUES (?,?,?,?)", [areaid, req.body[i][tag_index], percentageid, typeid], (err, results)=>{
                      if(err){
                        console.log(err)
                      }
                    })
                    
                  }
                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadCivEstimatedReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const qty_index = req.body[0].indexOf("QTY")
  if(area_index == -1 || type_index == -1 || qty_index == -1){
    console.log("error",area_index,type_index,qty_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE ecivils", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tcivils WHERE name = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id      
                sql.query("INSERT INTO ecivils(areas_id, tcivils_id, qty) VALUES (?,?,?)", [areaid, typeid, req.body[i][qty_index]], (err, results)=>{
                  if(err){
                    console.log(err)
                  }

                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadElecModelledReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1){
    console.log("error",area_index,tag_index,type_index,progress_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE delecs", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM telecs WHERE code = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id
                sql.query("SELECT id FROM pelecs WHERE percentage = ?", [req.body[i][progress_index]], (err, results) =>{
                  if(!results[0]){
                    
                    res.status(401).send({invalid: "Invaid percentage in some lines"})
                  }else{
                    const percentageid = results[0].id
                    
                    sql.query("INSERT INTO delecs(areas_id, tag, pelecs_id, telecs_id) VALUES (?,?,?,?)", [areaid, req.body[i][tag_index], percentageid, typeid], (err, results)=>{
                      if(err){
                        console.log(err)
                      }
                    })
                    
                  }
                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadElecEstimatedReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const qty_index = req.body[0].indexOf("QTY")
  if(area_index == -1 || type_index == -1 || qty_index == -1){
    console.log("error",area_index,type_index,qty_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE eelecs", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM telecs WHERE name = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id      
                sql.query("INSERT INTO eelecs(areas_id, telecs_id, qty) VALUES (?,?,?)", [areaid, typeid, req.body[i][qty_index]], (err, results)=>{
                  if(err){
                    console.log(err)
                  }

                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const uploadPipesEstimatedReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")
  const qty_index = req.body[0].indexOf("QTY")
  if(area_index == -1 || type_index == -1 || qty_index == -1){
    console.log("error",area_index,type_index,qty_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE epipes", (err, results)=>{
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
            sql.query("SELECT id FROM tpipes WHERE name = ?", [req.body[i][type_index]], (err, results) =>{
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id      
                sql.query("INSERT INTO epipes(areas_id, tpipes_id, qty) VALUES (?,?,?)", [areaid, typeid, req.body[i][qty_index]], (err, results)=>{
                  if(err){
                    console.log(err)
                  }

                })       
              }
            })
          })
        }
        
      }
      res.status(200)
    
  }
}

const downloadInstrumentationModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_inst, weight, status, progress FROM dinstsfull_view', (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){

        if(results[i].progress != 100){
          results[i].progress = 70
        }
        
        rows.push(results[i])
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const downloadEquipmentModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_equi, weight, status, progress FROM dequisfull_view', (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){

        if(results[i].elements == 0){
          results[i].progress = 10
        }else if(results[i].percentage != 100){
          results[i].progress = 65
        }else{
          results[i].progress = 100
        }
        
        rows.push(results[i])
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const downloadCivilModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_civil, weight, status, progress FROM dcivilsfull_view', (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){
        rows.push(results[i])
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const downloadElectricalModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_elec, weight, status, progress FROM delecsfull_view', (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){

        if(results[i].progress != 100){
          results[i].progress = 70
        }
        rows.push(results[i])
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const navis = (req, res) =>{
  sql.query('SELECT object, value FROM navis', (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){
        rows.push(results[i])
      }
      res.json({rows: rows}).status(200)
    }
  })
}

const updateBom = async(req, res) =>{

  try {
    await uploadBom.uploadFileMiddleware(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }else{
      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
      });
    }
  }catch(error){
    console.log(error)
  }
    

  readXlsxFile(process.env.NODE_BOM_ROUTE).then((rows) => {
    sql.query("TRUNCATE bomtbl", (err, results) =>{
      if(err){
        console.log(err)
      }else{
        for(let i = 9; i < rows.length; i++){    
          sql.query("INSERT INTO bomtbl (unit, area, line, train, spec_code, weight) VALUES(?,?,?,?,?,?)", [rows[i][1], rows[i][2], rows[i][3], rows[i][4], rows[i][6], rows[i][21]], (err, results)=>{
            if(err){
              console.log(err)
            }
          })
        }
        console.log("Bom updated")
        res.status(200)
      }
    })
  })
}


const getNotModelled = async(req, res) =>{
  sql.query("SELECT * FROM isocontrol_not_modelled", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.json({rows: results}).status(200)
    }
  })
}

const isocontrolWeights = async(req, res) =>{
  let modelledWeight, notModelledWeight
  sql.query("SELECT SUM(total_weight) as modelledWeight FROM isocontrol_all_view WHERE area IS NOT null", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      modelledWeight = results[0].modelledWeight
      sql.query("SELECT SUM(total_weight) as notModelledWeight FROM isocontrol_all_view WHERE area IS null", (err, results)=>{
        if(err){
          res.status(401)
        }else{
          notModelledWeight = results[0].notModelledWeight
          res.json({
            modelledWeight: modelledWeight,
            notModelledWeight: notModelledWeight
          })
        }
      })
    }
  })
}


cron.schedule("0 */5 * * * *", () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
   updateHolds()
  }
})

cron.schedule("0 */30 * * * *", () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_ISOCONTROL == "1"){
	updateLines()
	const timeoutObj = setTimeout(() => {
        updateIsocontrolModelled()
		updateIsocontrolNotModelled()
      }, 5000)
  }
})

async function updateIsocontrolNotModelled(){
  sql.query("DROP TABLE IF EXISTS isocontrol_not_modelled") 
  sql.query("CREATE TABLE isocontrol_not_modelled AS (SELECT * FROM isocontrol_not_modelled_def_view)", (err, results)=>{
    if(err){
      console.log(err)
    }else{
      console.log("isocontrol not modelled updated")
    }
  })       
}

async function updateIsocontrolModelled(){
    sql.query("DROP TABLE IF EXISTS isocontrol_modelled") 

sql.query("CREATE TABLE isocontrol_modelled AS ( SELECT * FROM isocontrolfull_view)", (err, results)=>{
  if(err){
    console.log(err)
  }else{
    console.log("isocontrol modelled updated")
  }
})       
}

async function updateLines(){

  sql.query("TRUNCATE `lines`", (err, results) =>{
    if(err){
      console.log(err)
    }
  })

  await csv()
  .fromFile(process.env.NODE_LINES_ROUTE)
  .then((jsonObj)=>{
    const csv = jsonObj
    for(let i = 0; i < csv.length; i++){    
      if(!(csv[i].tag + csv[i].unit + csv[i].fluid + csv[i].seq).includes("unset")){
        sql.query("INSERT INTO `lines`(tag, unit, fluid, seq, spec_code, pid, stress_level, calc_notes, insulation) VALUES(?,?,?,?,?,?,?,?,?)", [csv[i].tag, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].spec, csv[i].pid, csv[i].strlvl, csv[i].cnote, csv[i].insulation], (err, results)=>{
          if(err){
            console.log(err)
          }
        })
      }
    }
    console.log("Lines updated")
      
  })
}

const exportModelled = async(req, res) =>{
  sql.query("SELECT unit, area, line, train, fluid, seq, unit as line_id, unit as iso_id, spec_code, diameter, pid, stress_level, calc_notes, insulation, total_weight FROM isocontrol_modelled", (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      let rows = results
      for(let i = 0; i < rows.length; i++){
        rows[i].line_id = rows[i].unit + rows[i].line
        rows[i].iso_id = rows[i].unit + rows[i].area + rows[i].line + rows[i].train
      }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const exportNotModelled = async(req, res) =>{
  sql.query("SELECT bom_unit as unit, area, line, train, bom_unit as line_id, bom_unit as iso_id, spec_code, total_weight, LDL, BOM FROM isocontrol_not_modelled", (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      let rows = results
      sql.query("SELECT ldl_unit,spec_code_ldl FROM isocontrol_not_modelled", (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }else{
          for(let i = 0; i < rows.length; i++){ 
            if(!rows[i].unit){
              rows[i].unit = results[i].ldl_unit
            }
    
            if(!rows[i].spec_code){
              rows[i].spec_code = results[i].spec_code_ldl
            }

            if(!rows[i].unit || !rows[i].line){
              rows[i].line_id = null
            }else{
              rows[i].line_id = rows[i].unit + rows[i].line
            }

            if(!rows[i].unit || !rows[i].line || !rows[i].area || !rows[i].train  ){
              rows[i].iso_id = null
            }else{
              rows[i].iso_id = rows[i].unit + rows[i].area + rows[i].line + rows[i].train            
            }
    
          }
          res.json(JSON.stringify(rows)).status(200)
        }
      })
    }     
  })
}

const holds = async(req, res) =>{
  sql.query("SELECT dpipes_view.isoid, dpipes_view.tag as iso_tag, misoctrls.onhold, tpipes.code, misoctrls.revision, misoctrls.updated_at, misoctrls.`to`, misoctrls.user, misoctrls.role, holds.* FROM dpipes_view LEFT JOIN holds_isocontrol on dpipes_view.tag = holds_isocontrol.tag LEFT JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id LEFT JOIN holds ON dpipes_view.tag = holds.tag WHERE misoctrls.onhold = 1 GROUP BY misoctrls.isoid", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      for(let i = 0; i < results.length; i++){
        if(!results[i].isoid || results[0].isoid == ""){
          results[i].isoid = results[i].tag
        }
      }
      res.send({rows: results}).status(200)
    }
  })
}

async function updateHolds(){

  let data = null
  await csv()
  .fromFile(process.env.NODE_HOLDS_ROUTE)
  .then((jsonObj)=>{
    data = jsonObj
  })

  const timeoutObj = setTimeout(() => {
    
    sql.query("TRUNCATE holds", (err, results) =>{
      if(err){
        console.log(err)
      }else{
        sql.query("UPDATE misoctrls SET onhold = 0, user = ?, claimed = 1 WHERE misoctrls.onhold = 1", ["None", "On hold"], (err, results)=>{
          if(err){
            console.log(err)
            res.status(401)
          }else{
            for(let i = 0; i < data.length; i++){    
              let has_holds = data[i].hold1 + data[i].hold2 + data[i].hold3 + data[i].hold4 + data[i].hold5 + data[i].hold6 + data[i].hold7 + data[i].hold8 + data[i].hold9 + data[i].hold10
              if(data[i].tag && has_holds && has_holds != ""){
                sql.query("INSERT INTO holds (tag, hold1, description1, hold2, description2, hold3, description3, hold4, description4, hold5, description5, hold6, description6, hold7, description7, hold8, description8, hold9, description9, hold10, description10) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [data[i].tag, data[i].hold1, data[i].description1, data[i].hold2, data[i].description2, data[i].hold3, data[i].description3, data[i].hold4, data[i].description4, data[i].hold5, data[i].description5, data[i].hold6, data[i].description6, data[i].hold7, data[i].description7, data[i].hold8, data[i].description8, data[i].hold9, data[i].description9, data[i].hold10, data[i].description10], (err, results)=>{
                  if(err){
                    console.log(err)
                  }else{
                    if(has_holds){
                      sql.query("UPDATE misoctrls JOIN dpipes_view ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid SET misoctrls.onhold = 1 WHERE dpipes_view.tag = ? AND onhold != 2", [data[i].tag], (err, results)=>{                  
                        if(err){
                          console.log(err)
                        }
                      })
                    }
                  }
                })
                
                
              }      
              
            }
          }
          console.log("Holds updated")
        })
        
       

      }
    })

    sql.query("SELECT tag FROM holds_isocontrol", (err, results)=>{
      if(results[0]){
        for(let i = 0; i < results.length; i++){
          sql.query("UPDATE misoctrls JOIN dpipes_view ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid SET misoctrls.onhold = 1 WHERE dpipes_view.tag = ? AND onhold != 2", [results[i].tag], (err, results)=>{                  
            if(err){
              console.log(err)
            }
          })
        }
      }
    })
  }, 5000)

  

}

const uploadNotifications = (req, res) =>{
  const n = req.body.n
  sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = 1 OR role_id = 2 OR role_id = 9", (err, results)=>{
    if(!results[0]){
        res.send({success: 1}).status(200)
    }else{
        const users_ids = results
        for(let j = 0; j < users_ids.length; j++){
            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [users_ids[j].model_id, n +" new isometric/s uploaded to design."], (err, results)=>{
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

const lastUser = async(req, res) =>{
  sql.query("SELECT `user` FROM hisoctrls WHERE filename = ? ORDER BY id DESC LIMIT 1", [req.params.filename], (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      res.send({user: results[0].user}).status(200)
    }
  })
}

const exportFull = async(req, res) =>{
  sql.query("SELECT unit as line_id, unit, area, unit as line, train, fluid, seq, spec_code, diameter, pid, stress_level, calc_notes, insulation, total_weight, diameter as modelled, tray, progress, isocontrol_holds_view.hold1, BOM, LDL, bom_unit, bom_area, bom_train, bom_spec_code FROM isocontrol_all_view LEFT JOIN isocontrol_holds_view ON isocontrol_all_view.tag COLLATE utf8mb4_unicode_ci = isocontrol_holds_view.tag", (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      let rows = results
      for(let i = 0; i < rows.length; i++){

        if(rows[i].LDL === "In LDL"){
          rows[i].line = rows[i].fluid + rows[i].seq
          rows[i].line_id = rows[i].unit + rows[i].fluid + rows[i].seq
        }else{
          rows[i].unit = rows[i].bom_unit
          rows[i].area = rows[i].bom_area
          rows[i].spec_code = rows[i].bom_spec_code
          rows[i].train = rows[i].bom_train
          rows[i].line_id = rows[i].unit + rows[i].line
        }

        if(rows[i].diameter === null){
            rows[i].modelled = "Not modelled"
        }else{
            rows[i].modelled = "Modelled"
        }

        if(!rows[i].spec_code){
          rows[i].spec_code = ""
        }

        if(!rows[i].BOM){
            rows[i].BOM = ""
        }

        if(!rows[i].LDL){
            rows[i].LDL = ""
        }

        if(!rows[i].calc_notes){
            rows[i].calc_notes = ""
        }

        if(rows[i].has_holds == 1){
          rows[i].hold1 = "Yes"
        }else{
          rows[i].hold1 = "No"
        }

        delete rows[i]["bom_unit"]
        delete rows[i]["bom_area"]
        delete rows[i]["bom_train"]
        delete rows[i]["bom_spec_code"]

    }
      res.json(JSON.stringify(rows)).status(200)
    }
  })
}

const exportLineIdGroup = async(req, res) =>{
  sql.query("SELECT * FROM isocontrol_lineid_group WHERE line_id is not null", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const exportHolds = async(req, res) =>{
  sql.query("SELECT tag, hold1, description1, hold2, description2, hold3, description3, hold4, description4, hold5, description5, hold6, description6, hold7, description7, hold8, description8, hold9, description9, hold10, description10 FROM holds", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const exportHoldsNoProgress = async(req, res) =>{
  sql.query('SELECT isoid, revision, updated_at, `from`, user, comments FROM misoctrls WHERE misoctrls.to = ?', ["On hold"], (err, results) =>{
    for(let i = 0; i < results.length; i++){
      results[i].updated_at = results[i].updated_at.toString().substring(0,10) + " "+ results[i].updated_at.toString().substring(11,24)
    }
    res.json(JSON.stringify(results)).status(200)
  
})
}

const downloadBOM = async(req, res) =>{
  var file = fs.createReadStream(process.env.NODE_BOM_ROUTE);
  file.pipe(res);
}

const getPids = async(req, res) =>{
  sql.query("SELECT pid FROM pids", (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      res.send({rows: results}).status(200)
    }
  })
}

const timeTrack = async(req, res) =>{
  sql.query("SELECT * FROM hisoctrlstimetrack_view", (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      res.send({rows: results}).status(200)
    }
  })
}

const exportTimeTrack = async(req, res) =>{
  sql.query("SELECT * FROM hisoctrlstimetrack_view", (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      for(let i = 0; i < results.length; i++){
        results[i].revision = "*R" + results[i].revision
      }
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const revision = async(req, res) =>{
  sql.query("SELECT revision, issuer_date, issuer_designation, issuer_draw, issuer_check, issuer_appr FROM misoctrls WHERE filename = ?", [req.params.fileName], (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      if(results[0].issuer_date){
        results[0].issuer_date.setDate(results[0].issuer_date.getDate() + 1)
      }
      res.send({rows: results[0]}).status(200)
    }
  })
}

const submitRevision = async(req, res) =>{
  
  const fileName = req.body.fileName
  const date = req.body.issuer_date
  const designation = req.body.issuer_designation
  const draw = req.body.issuer_draw
  const check = req.body.issuer_check
  const appr = req.body.issuer_appr

  sql.query("UPDATE misoctrls SET issuer_date = ?, issuer_designation = ?, issuer_draw = ?, issuer_check = ?, issuer_appr = ? WHERE filename = ?", [date, designation, draw, check, appr, fileName], (err, results)=>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      if(process.env.NODE_ISSUER == "1"){
        fs.stat('./app/storage/isoctrl/issuer/attach/' + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf', function (err, stats) {

          if (err) {
              console.error("Clean does not exist");
          }else{
            fs.unlink('./app/storage/isoctrl/issuer/attach/' + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf',function(err){
              if(err){
                console.log(err)
              } 
            }); 
          }
        });
      }
      res.send({success: 1}).status(200)
    }
  })
}

function downloadIssuedTo3D(){
  let exists = false
  sql.query("SELECT dpipes_view.tag, revision, issued, issuer_date, issuer_designation, issuer_draw, issuer_check, issuer_appr FROM dpipes_view JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid WHERE `to` = ?", ["Issuer"], (err, results) =>{
      if(err){
        console.log(err)
      }
      if(!results[0]){

      let emptylog = []
      emptylog.push("DESIGN\n")
      emptylog.push("ONERROR CONTINUE\n")
      emptylog.push("FINISH")
      emptyLogToText = ""
        for(let i = 0; i < emptylog.length; i++){
          emptyLogToText += emptylog[i]+"\n"
        }
      fs.writeFile("IssuerFromIsoTrackerTo3d.mac", emptyLogToText, function (err) {
        if (err) return console.log(err);
        fs.copyFile('./IssuerFromIsoTrackerTo3d.mac', process.env.NODE_ISSUER_ROUTE, (err) => {
          if (err) throw err;
        });
      });
    }else{
          let log = []
      log.push("DESIGN")
      log.push("ONERROR CONTINUE\n")
      for(let i = 0; i < results.length;i++){
        if(results[i].issuer_date && results[i].issuer_designation && results[i].issuer_draw && results[i].issuer_check && results[i].issuer_appr){
          exists = true
          let r = results[i].revision
          if(results[i].issued){
            r = results[i].revision - 1
          }
          let d = new Date(results[i].issuer_date)
          let month = (d.getMonth()+1).toString()
          let day = (d.getDate()).toString()
  
          if(month.length == 1){
            month = "0" + month
          }
  
          if(day.length == 1){
            day = "0" + day
          }
  
          d = day + "/" + month + "/" + d.getFullYear()
          d = d.substring(0,6) + d.substring(8,10)
  
          if(r == 0){
            log.push("ONERROR GOLABEL " + results[i].tag)
            log.push("/" + results[i].tag)
            log.push("UNLOCK ALL")
            log.push("NEW TEXT /" + results[i].tag + "/" + r)
            log.push("HANDLE ANY")
            log.push("DELETE TEXT")
            log.push("ENDHANDLE")
            log.push("/"+ results[i].tag +"/" + r)
  
          }else{
            log.push("/" + results[i].tag + "/" + (r-1))
            log.push("UNLOCK ALL")
            log.push("NEW TEXT /" + results[i].tag +"/" + r)
            log.push("HANDLE ANY")
            log.push("DELETE TEXT")
            log.push("ENDHANDLE")
            log.push("/" + results[i].tag +"/" + r)
            
          }
  
          log.push(":TP-REV-IND '" + r + "'")
          log.push(":TP-REV-DATE '" + d + "'")
          log.push(":TP-REV-DESIGNATION '" + results[i].issuer_designation + "'")
          log.push(":TP-REV-DRAW '" + results[i].issuer_draw + "'")
          log.push(":TP-REV-CHECK '" + results[i].issuer_check + "'")
          log.push(":TP-REV-APPR '" + results[i].issuer_appr + "'\n")
          log.push("LABEL " + results[i].tag)
        }
        
      }
      log.push("SAVEWORK")
      log.push("UNCLAIM ALL")
      log.push("FINISH")
      logToText = ""
      for(let i = 0; i < log.length; i++){
        logToText += log[i]+"\n"
      }
      if(exists){
        fs.unlink('IssuerFromIsoTrackerTo3d.mac',function(err){
          if(err) return console.log(err);
        
        });  
        fs.writeFile("IssuerFromIsoTrackerTo3d.mac", logToText, function (err) {
          if (err) return console.log(err);
          fs.copyFile('./IssuerFromIsoTrackerTo3d.mac', process.env.NODE_ISSUER_ROUTE, (err) => {
            if (err) throw err;
          });
        });

      }else{
        let emptylog = []
        emptylog.push("DESIGN\n")
        emptylog.push("ONERROR CONTINUE\n")
        emptylog.push("FINISH")
        emptyLogToText = ""
        for(let i = 0; i < emptylog.length; i++){
          emptyLogToText += emptylog[i]+"\n"
        }
        fs.unlink('IssuerFromIsoTrackerTo3d.mac',function(err){
          if(err) return console.log(err);
        });
        fs.writeFile("IssuerFromIsoTrackerTo3d.mac", emptyLogToText, function (err) {
	
          if (err) return console.log(err);
	  
          fs.copyFile('./IssuerFromIsoTrackerTo3d.mac', process.env.NODE_ISSUER_ROUTE, (err) => {
            if (err) throw err;
          });
        });
      }
        }
      })
    console.log("Generated issuer report")
}

const excludeHold = async(req, res) =>{
  fileName = req.params.fileName
  await sql.query("UPDATE misoctrls SET onhold = 2, `to` = `from` WHERE filename = ?", [fileName], async (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      
      await sql.query("UPDATE misoctrls SET `from` = ? WHERE filename = ?", ["On hold", fileName], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }else{
          res.status(200)
        }
      })
    }
  })
  res.status(200)
}

const sendHold = (req, res) =>{
  const fileName = req.body.fileName
  sql.query("UPDATE misoctrls SET onhold = 1, `from` = `to` WHERE filename = ?", [fileName], (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      sql.query("UPDATE misoctrls SET `to` = ? WHERE filename = ?", ["On hold", fileName], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }else{
          res.status(200)
        }
      })
    }
  })
  res.status(200)
}

const getFilenamesByUser = (req, res) =>{
  const email = req.body.currentUser
  const role = req.body.currentRole
  sql.query("SELECT misoctrls.isoid from misoctrls LEFT JOIN users ON misoctrls.user = users.name WHERE users.email = ? AND misoctrls.role = ?", [email, role], (err, results) =>{
    res.json({files: results}).status(200)
  })
}

const createByPass = (req, res) =>{
  const email = req.body.username
  const type = req.body.type
  const notes = req.body.notes
  const iso_id = req.body.id
  sql.query('SELECT id FROM users WHERE email = ?', [email], (err, results) =>{
    if (!results[0]){
      res.status(401)
    }else{   
      const user_id = results[0].id
      sql.query("SELECT id FROM bypass ORDER BY id DESC LIMIT 1", (err, results) =>{
        let tag = "BP000001"
        if(results[0]){
          tag = "BP000001".substring(0, tag.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
          console.log(tag)
        }
        sql.query("INSERT INTO bypass(misoctrls_id, tbypass_id, tag, note, user_id) VALUES(?,?,?,?,?)", [iso_id, type, tag, notes, user_id], (err, results)=>{
          if(err){
            console.log(err)
            res.status(401)
          }else{
            var transporter = nodemailer.createTransport({
              host: "es001vs0064",
              port: 25,
              secure: false,
              auth: {
                  user: "3DTracker@technipenergies.com",
                  pass: "1Q2w3e4r..24"    
              }
            });

            sql.query("SELECT name FROM tbypass WHERE id = ?", [type], (err, results) =>{
              const t = results[0].name
              sql.query("SELECT isoid FROM misoctrls WHERE id = ?", [iso_id], (err, results) =>{
                if(!results[0]){
                  res.status(401)
                }else{
                  const iso_name = results[0].isoid
                  const html_message = "<b>REFERENCE</b> " + tag + "<p><b>ISOMETRIC ID</b> " + iso_name + " </p><p><b>USER</b> " + email + "</p><p><b>TYPE</b> " + t + "</p><p><b>NOTES</b> " + notes + "</p>"
                  sql.query("SELECT email FROM users JOIN model_has_roles ON users.id = model_has_roles.model_id JOIN roles ON model_has_roles.role_id = roles.id WHERE roles.id = 15 GROUP BY email", (err, results) =>{
                    if(!results[0]){

                    }else{
                      for(let i = 0; i < results.length; i++){
                        if(results[i].email === "super@user.com"){
                          results[i].email = "alex.dominguez-ortega@external.technipenergies.com"
                        }
                        transporter.sendMail({
                          from: '3DTracker@technipenergies.com',
                          to: results[i].email,
                          subject: 'ByPass ' + tag,
                          text: tag,
                          
                          html: html_message
                        }, (err, info) => {
                            console.log(info.envelope);
                            console.log(info.messageId);
                        });
                      }
                    }
                  })
                }
              })
              res.send({success: true}).status(200)
            })
          }
        })
      })
      
    }
  })
}

const getByPassData = async(req, res) =>{
  sql.query("SELECT bypass.id, bypass.comments, misoctrls.isoid, tbypass.name as type, bypass.tag, bypass.note, users.name as user, users.email, bstatus.name as status, bypass.updated_at as date FROM bypass LEFT JOIN misoctrls ON bypass.misoctrls_id = misoctrls.id LEFT JOIN tbypass ON bypass.tbypass_id = tbypass.id LEFT JOIN users ON bypass.user_id = users.id LEFT JOIN bstatus on bypass.bstatus_id = bstatus.id", (err, results) =>{
    if(!results[0]){
      res.json({rows: []}).status(200)
    }else{
      res.json({rows: results}).status(200)
    }
  })
}

const answerByPass = async(req, res) =>{
  const id = req.body.id
  const type = req.body.type
  let answer = "CODE3"
  if(type == 3){
    answer = "IFC"
  }
  sql.query("UPDATE bypass SET bstatus_id = ? WHERE id = ?", [type, id], (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      sql.query("SELECT tag, users.email FROM bypass LEFT JOIN users ON bypass.user_id = users.id WHERE bypass.id = ?", [id], (err, results) =>{
        let email = results[0].email
        const tag = results[0].tag
        const html_message = "<p>The ByPass " + tag + " has been approved. Answer: " + answer + ".</p>"

        if(email === "super@user.com"){
          email = "alex.dominguez-ortega@external.technipenergies.com"
        }
        var transporter = nodemailer.createTransport({
          host: "es001vs0064",
          port: 25,
          secure: false,
          auth: {
              user: "3DTracker@technipenergies.com",
              pass: "1Q2w3e4r..24"    
          }
        });
        transporter.sendMail({
          from: '3DTracker@technipenergies.com',
          to: email,
          subject: 'ByPass ' + tag + " has been accepted. " + answer + ".",
          text: tag,
          
          html: html_message
        }, (err, info) => {
            console.log(info.envelope);
            console.log(info.messageId);
        });
      
        res.send({success: true}).status(200)
        })
      }
  })
}

const rejectByPass = async(req, res) =>{
  const id = req.body.id
  const comments = req.body.comments
  sql.query("UPDATE bypass SET bstatus_id = 4, comments = ? WHERE id = ?", [comments, id], (err, results) =>{
    if(err){
      res.status(401)
    }else{
      sql.query("SELECT tag, users.email FROM bypass LEFT JOIN users ON bypass.user_id = users.id WHERE bypass.id = ?", [id], (err, results) =>{
        let email = results[0].email
        const tag = results[0].tag

        const html_message = "<p>The ByPass " + tag + " has been rejected.</p><p>" + comments + "</p>"

        if(email === "super@user.com"){
          email = "alex.dominguez-ortega@external.technipenergies.com"
        }
        var transporter = nodemailer.createTransport({
          host: "es001vs0064",
          port: 25,
          secure: false,
          auth: {
              user: "3DTracker@technipenergies.com",
              pass: "1Q2w3e4r..24"    
          }
        });
        transporter.sendMail({
          from: '3DTracker@technipenergies.com',
          to: email,
          subject: 'ByPass ' + tag + " has been rejected.",
          text: tag,
          
          html: html_message
        }, (err, info) => {
            console.log(info.envelope);
            console.log(info.messageId);
        });
      
        res.send({success: true}).status(200)
        })
      }
  })
}

const naByPass = async(req, res) =>{
  const id = req.body.id
  const comments = req.body.comments
  sql.query("UPDATE bypass SET bstatus_id = 5, comments = ? WHERE id = ?", [comments, id], (err, results) =>{
    if(err){
      res.status(401)
    }else{
      sql.query("SELECT tag, users.email FROM bypass LEFT JOIN users ON bypass.user_id = users.id WHERE bypass.id = ?", [id], (err, results) =>{
        let email = results[0].email
        const tag = results[0].tag

        const html_message = "<p>The ByPass " + tag + " has been set to N/A.</p><p>" + comments + "</p>"

        if(email === "super@user.com"){
          email = "alex.dominguez-ortega@external.technipenergies.com"
        }
        var transporter = nodemailer.createTransport({
          host: "es001vs0064",
          port: 25,
          secure: false,
          auth: {
              user: "3DTracker@technipenergies.com",
              pass: "1Q2w3e4r..24"    
          }
        });
        transporter.sendMail({
          from: '3DTracker@technipenergies.com',
          to: email,
          subject: 'ByPass ' + tag + " has been set to N/A.",
          text: tag,
          
          html: html_message
        }, (err, info) => {
            console.log(info.envelope);
            console.log(info.messageId);
        });
      
        res.send({success: true}).status(200)
        })
      }
  })
}

const editByPass = async(req, res) =>{
  const type = req.body.type
  const notes = req.body.notes
  const iso_id = req.body.id

  sql.query("UPDATE bypass SET tbypass_id = ?, note = ? WHERE id = ?", [type, notes, iso_id], (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      res.send({success: true}).status(200)
    }
  })
}

const closeByPass = async(req, res) =>{
  const iso_id = req.body.id
  sql.query("SELECT bstatus_id FROM bypass WHERE id = ?", [iso_id], (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      let closed = 0
      if(results[0].bstatus_id == 2){
        closed = 6
      }else{
        closed = 7
      }
      sql.query("UPDATE bypass SET bstatus_id = ? WHERE id = ?", [closed, iso_id], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }else{
          res.send({success: true}).status(200)
        }
      })
    }
  })
 
}

const deleteByPass = async(req, res) =>{
  const iso_id = req.body.id
  sql.query("DELETE FROM bypass WHERE id = ?", [iso_id], (err, results) =>{
    if(err){
      res.status(401)
    }else{
      res.send({success: true}).status(200)
    }
  })
 
}

const acceptByPass = async(req, res) =>{
  const iso_id = req.body.id
  sql.query("UPDATE bypass SET bstatus_id = 8 WHERE id = ?", [iso_id], (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      res.send({success: true}).status(200)
    }
  })
}

const exportByPass = async(req, res) =>{
  sql.query("SELECT bypass.tag, misoctrls.isoid, tbypass.name as type, bypass.updated_at as date, users.name as user, bypass.note, bypass.comments, bstatus.name as status FROM bypass LEFT JOIN misoctrls ON bypass.misoctrls_id = misoctrls.id LEFT JOIN tbypass ON bypass.tbypass_id = tbypass.id LEFT JOIN users ON bypass.user_id = users.id LEFT JOIN bstatus on bypass.bstatus_id = bstatus.id", (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      res.json(JSON.stringify(results)).status(200)
    }
  })
}

const isCancellable = async(req, res) =>{
  const filename = req.params.filename
  sql.query("SELECT isoid, revision FROM misoctrls WHERE filename = ?",[filename], (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      const isoid = results[0].isoid
      const revision = results[0].revision
      sql.query("SELECT * FROM misoctrls WHERE isoid = ? AND revision > ?", [isoid, revision], (err, results) =>{
        if(results[0]){
          res.send({cancellable: false})
        }else{
          sql.query("SELECT `to` FROM misoctrls WHERE isoid = ? AND (issued = 0 OR issued IS NULL)", [isoid, revision], (err, results) =>{
            if(!results[0]){
              res.send({cancellable: false})
            }else{
              const tray = results[0].to
              if(tray == "Design"){
                res.send({cancellable: true})
              }else{
                res.send({cancellable: false})
              }
            }
          })
        }
      })
    }
  })
  
}

const cancelRev = async(req, res) =>{
  const filename = req.body.filename
  const user = req.body.user
  sql.query("SELECT isoid FROM misoctrls WHERE filename = ?",[filename], (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      const isoid = results[0].isoid
      sql.query("SELECT filename FROM misoctrls WHERE isoid = ?", [isoid], (err, results) =>{
        const newRevFilename = results[0].filename
        sql.query("DELETE FROM misoctrls WHERE isoid = ? AND (issued = 0 OR issued IS NULL) AND `to` = ?", [isoid, "Design"], (err, results) =>{
          if(err){
            console.log(err)
            res.status(401)
          }else{
            sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
              const username = results[0].name
              sql.query("INSERT INTO hisoctrls (filename, isoid, user, role) VALUES (?,?,?,?)", [filename, isoid,  username, "SpecialityLead"], (err, results) => {
                if(err){
                  console.log(err)
                }
              })
            })
            fs.unlink('./app/storage/design/' + newRevFilename, function(err){
              if(err){
                console.log(err)
              } 
            }); 
            sql.query("UPDATE misoctrls SET requested = 0 WHERE filename = ?", [filename], (err, results) =>{
              if(err){
                console.log(err)
                res.status(401)
              }else{
                res.send({success: true}).status(200)
              }
            })
          }
        })
      })
      
    }
  })
  
}

const getDiameters = (req, res) =>{
  if(process.env.NODE_MMDN == "0"){
    sql.query("SELECT dn as diameter FROM diameters", (err, results) =>{
      res.json({diameters: results}).status(200)
    })
  }else{
    sql.query("SELECT nps as diameter FROM diameters", (err, results) =>{
      res.json({diameters: results}).status(200)
    })
  } 
}

const getLineRefs = async(req, res) =>{
  sql.query("SELECT tag as line_ref FROM `lines`", (err, results) =>{
    if(!results[0]){
      console.log("no lines")
      res.json({line_refs: null}).status(401)
    }else{
      res.json({line_refs: results}).status(200)
    }
  }) 
}

const getDesigners = async(req, res) =>{
  sql.query("SELECT `users`.`name` as name FROM `users` LEFT JOIN model_has_roles ON `users`.id = model_has_roles.model_id  LEFT JOIN roles ON `model_has_roles`.role_id = roles.id WHERE role_id = 1", (err, results) =>{
    if(!results[0]){
      console.log("no lines")
      res.json({designers: null}).status(401)
    }else{
      res.json({designers: results}).status(200)
    }
  }) 
}

const modelledEstimatedPipes = async(req, res) =>{
    sql.query("SELECT * FROM estimated_pipes_view", (err, results)=>{
      if(err){
        console.log(err)
        res.status(401)
      }else{
        for(let i = 0; i < results.length; i++){
          if(!results[i].type){
            if(process.env.NODE_MMDN == "0"){
              if(results[i].diameter < 2.00){
                results[i].type = "TL1"
              }else{
                results[i].type = "TL2"
              }
            }else{
              if(results[i].diameter < 50){
                results[i].type = "TL1"
              }else{
                results[i].type = "TL2"
              }
            }
          }
        }
        res.json({rows: results}).status(200)
      }
    })
}

const getDataByRef = async(req, res) =>{
  const ref = req.params.ref
  sql.query("SELECT unit, fluid, seq, spec_code, insulation, calc_notes FROM `lines` WHERE tag = ?", [ref], (err, results) =>{
    if(!results[0]){
      res.send({pipe: null}).status(401)
    }else{
      res.json({pipe: results}).status(200)
    }
  })
}

const submitModelledEstimatedPipes = async(req, res) =>{
  const new_pipes = req.body.rows
  const owners = req.body.owners
  for(let i = 0; i < new_pipes.length; i++){
    if(new_pipes[i]["Line reference"] == "deleted"){
      sql.query("DELETE FROM estimated_pipes WHERE id = ?", [new_pipes[i].id], (err, results) =>{
        if(err){
          console.log(err)
        }
      })
    }else{
      sql.query("SELECT id FROM `lines` WHERE tag = ?", [new_pipes[i]["Line reference"]], (err, results) =>{
        if(!results[0]){
          console.log("Line tag incorrecto")
        }else{
          const line_ref_id = results[0].id
          sql.query("SELECT id FROM areas WHERE name = ?", [new_pipes[i].Area], (err, results) =>{
            if(!results[0]){
              console.log("Area incorrecta")
            }else{
              const area_id = results[0].id
              if(new_pipes[i].id){
                sql.query("UPDATE estimated_pipes SET line_ref_id = ?, tag = ?, unit = ?, area_id = ?, fluid = ?, sequential = ?, spec = ?, diameter = ?, insulation = ?, train = ? WHERE id = ?", [line_ref_id, new_pipes[i].Tag, new_pipes[i].Unit, area_id, new_pipes[i].Fluid, new_pipes[i].Seq, new_pipes[i].Spec, new_pipes[i].Diameter, new_pipes[i].Insulation, new_pipes[i].Train, new_pipes[i].id], (err, results) =>{
                  if(err){
                    console.log(err)
                  }
                })
              }else{
                sql.query("INSERT INTO estimated_pipes(line_ref_id, tag, unit, area_id, fluid, sequential, spec, diameter, insulation, train) VALUES(?,?,?,?,?,?,?,?,?,?)", [line_ref_id, new_pipes[i].Tag, new_pipes[i].Unit, area_id, new_pipes[i].Fluid, new_pipes[i].Seq, new_pipes[i].Spec, new_pipes[i].Diameter, new_pipes[i].Insulation, new_pipes[i].Train], (err, results) =>{
                  if(err){
                    console.log(err)
                  }
                })
              }
            }
          })
        } 
      })
    }
  }

  for(let i = 1; i < owners.length; i++){
    await sql.query("SELECT id FROM users WHERE name = ?", owners[i][2], async (err, results) =>{
      if(!results){
        if(owners[i][0] == "IFC"){
          await sql.query("UPDATE owners SET owner_ifc_id = NULL WHERE tag = ?", [owners[i][1]], async(err, results) =>{
            if(err){
              console.log(err)
              res.status(401)
            }
          })
        }else{
          await sql.query("UPDATE owners SET owner_iso_id = NULL WHERE tag = ?", [owners[i][1]], async(err, results) =>{
            if(err){
              console.log(err)
              res.status(401)
            }
          })
        }
      }else{
        const user_id = results[0].id
        await sql.query("SELECT id FROM owners WHERE tag = ?", owners[i][1], async(err, results) =>{
          if(!results[0] && owners[i][1] != owners[i-1][1]){
            if(owners[i][0] == "IFC"){
              await sql.query("INSERT INTO owners(owner_ifc_id, tag) VALUES(?,?)", [user_id, owners[i][1]], async(err, results) =>{
                if(err){
                  console.log(err)
                  res.status(401)
                }
              })
            }else{
              let now = new Date()
              await sql.query("INSERT INTO owners(owner_iso_id, tag, assignation_date) VALUES(?,?,?)", [user_id, owners[i][1], now], async(err, results) =>{
                if(err){
                  console.log(err)
                  res.status(401)
                }
              })
            }
          }else{
            if(owners[i][0] == "IFC"){
              await sql.query("UPDATE owners SET owner_ifc_id = ? WHERE tag = ?", [user_id, owners[i][1]], async(err, results) =>{
                if(err){
                  console.log(err)
                  res.status(401)
                }
              })
            }else{
              let now = new Date()
              await sql.query("SELECT owner_iso_id FROM owners WHERE tag = ?", [owners[i][1]], async(err, results) =>{
                if(results[0]){
                  if(results[0].owner_iso_id != user_id){
                    await sql.query("UPDATE owners SET owner_iso_id = ?, assignation_date = ? WHERE tag = ?", [user_id, now, owners[i][1]], async(err, results) =>{
                      if(err){
                        console.log(err)
                        res.status(401)
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

  res.send({success: true}).status(200)
}

const modelledEstimatedHolds = async(req, res) =>{
  sql.query("SELECT estimated_pipes_view.tag , holds.has_holds, holds_isocontrol.`description` FROM estimated_pipes_view LEFT JOIN holds ON estimated_pipes_view.tag = holds.tag LEFT JOIN holds_isocontrol ON estimated_pipes_view.tag = holds_isocontrol.tag GROUP BY estimated_pipes_view.tag", (err, results)=>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      res.json({rows: results}).status(200)
    }
  })
}

const getAllHolds = async(req, res) =>{
  const tag = req.params.tag
  let holds3d = []
  let holdsIso = []
  sql.query("SELECT holds.* FROM holds WHERE holds.tag = ?", [tag], (err, results)=>{
    if(results[0]){
      holds3d = results
    }
    sql.query("SELECT holds_isocontrol.id, holds_isocontrol.description FROM holds_isocontrol WHERE holds_isocontrol.tag = ?", [tag], (err, results)=>{
      if(results[0]){
        for(let i = 0; i < results.length; i++){
          holdsIso.push({id: results[i].id, description: results[i].description})
        }
      }
      res.send({holds3d: holds3d, holdsIso: holdsIso})
    })
  })
}

const submitHoldsIso = async(req, res) =>{
  const holds = req.body.rows
  const tag = req.body.tag
  for(let i = 0; i < holds.length; i++){
    if(!holds[i]["description"]){
      sql.query("DELETE FROM holds_isocontrol WHERE id = ?", [holds[i].id], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }
      })
    }else if(!holds[i]["id"]){
      sql.query("INSERT INTO holds_isocontrol(tag, description) VALUES(?,?)", [tag, holds[i].description], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }
      })
    }else{
      sql.query("UPDATE holds_isocontrol SET description = ? WHERE id = ?", [holds[i].description, holds[i].id], (err, results) =>{
        if(err){
          console.log(err)
          res.status(401)
        }
      })
    }
  }
  res.send({success: true}).status(200)
}

const getIsocontrolHolds = async(req, res) =>{
  const tag = req.params.tag
  sql.query("SELECT description FROM holds_isocontrol WHERE tag = ?", [tag], (err, results) =>{
    if(!results[0]){
      res.send({holds: []}).status(200)
    }else{
      res.send({holds: results}).status(200)
    }
  })
}

const getEstimatedMatWeek = async(req, res) =>{
  sql.query("SELECT week, estimated, material_id, name FROM epipes_new LEFT JOIN materials ON material_id = materials.id ORDER BY material_id, week", (err, results) =>{
    if(!results[0]){
      res.json({estimated: []}).status(401)
    }else{
      let estimated = results
      sql.query("SELECT starting_date FROM project_span", (err, results) =>{
        const start = results[0].starting_date
        const oneJan = new Date(start.getFullYear(),0,1);
        const numberOfDays = Math.floor((start - oneJan) / (24 * 60 * 60 * 1000));
        const initial_week = Math.ceil(( start.getDay() + 1 + numberOfDays) / 7);
        let counter = 0
        let mat = estimated[0].material_id
        for(let i = 0; i < estimated.length; i++){
          if(mat == estimated[i].material_id){
            estimated[i].weekY = initial_week + counter
            counter += 1
          }else{
            mat = estimated[i].material_id
            estimated[i].weekY = initial_week
            counter = 1
          }
        }
        res.json({estimated: estimated}).status(200)
      })
      
    }
  })
}

const getForecastMatWeek = async(req, res) =>{
  sql.query("SELECT week, estimated, material_id, name FROM forecast LEFT JOIN materials ON material_id = materials.id ORDER BY material_id, week", (err, results) =>{
    if(!results[0]){
      res.json({forecast: []}).status(401)
    }else{
      res.json({forecast: results}).status(200)
    }
  })
}

const getMaterials = async(req, res) =>{
  sql.query("SELECT id, name FROM materials", (err, results) =>{
    if(!results[0]){
      res.json({materials: []}).status(401)
    }else{
      res.json({materials: results}).status(200)
    }
  })
}

const getMaterialsPipingClass = async(req, res) =>{
  sql.query("SELECT materials.id as material_id, materials.name as material, pipingclass.id as piping_id, pipingclass.name as piping FROM pipingclass LEFT JOIN materials ON materials.id = pipingclass.material_id", (err, results) =>{
    if(!results[0]){
      res.json({materials: []}).status(200)
    }else{
      res.json({materials: results}).status(200)
    }
  })
}

const getProjectSpan = async(req, res) =>{
  sql.query("SELECT starting_date, finishing_date FROM project_span", (err, results) =>{
    if(!results[0]){
      res.json({span: []}).status(200)
    }else{
      res.json({span: results}).status(200)
    }
  })
}

const submitProjectSpan = async(req, res) =>{
  const start = req.body.span["Starting date"].substring(6,10) + "-" +  req.body.span["Starting date"].substring(3,5) + "-" + req.body.span["Starting date"].substring(0,2)
  const finish = req.body.span["Finishing date"].substring(6,10) + "-" +  req.body.span["Finishing date"].substring(3,5) + "-" + req.body.span["Finishing date"].substring(0,2)
  sql.query("UPDATE project_span SET starting_date = ?, finishing_date = ?", [start, finish], (err, results) =>{
    if(err){
      console.log(err)
      res.send({success: false}).status(401)
    }else{
      const weeks = (new Date(finish) - new Date(start)) / (1000 * 60 * 60 * 24) / 7
      let currentWeeks = 0
      sql.query("SELECT DISTINCT week FROM epipes_new ORDER BY week DESC LIMIT 1", (err, results) =>{
        if(results[0]){
          currentWeeks = results[0].week
        }
        if(weeks < currentWeeks){
          sql.query("DELETE FROM epipes_new WHERE week > ?", [weeks], (err, results) =>{
            if(err){
              console.log(err)
              res.send({success: false}).status(401)
            }
          })
          sql.query("DELETE FROM forecast WHERE week > ?", [weeks], (err, results) =>{
            if(err){
              console.log(err)
              res.send({success: false}).status(401)
            }
          })
          sql.query("DELETE FROM epipes_ifd WHERE week > ?", [weeks], (err, results) =>{
            if(err){
              console.log(err)
              res.send({success: false}).status(401)
            }
          })
          sql.query("DELETE FROM forecast_ifd WHERE week > ?", [weeks], (err, results) =>{
            if(err){
              console.log(err)
              res.send({success: false}).status(401)
            }
          })
        }else if(weeks > currentWeeks){
          sql.query("SELECT id FROM materials", (err, results) =>{
            if(!results[0]){
              res.send({success: false}).status(401)
            }else{
              let materials_ids = []
              for(let i = 0; i < results.length; i++){
                materials_ids.push(results[i].id)
              }
              let newWeeks = []
              for (var i = currentWeeks + 1; i <= weeks; i++) {
                newWeeks.push(i);
              }
              for(let i = 0; i < newWeeks.length; i++){
                for(let j = 0; j < materials_ids.length; j++){
                  sql.query("INSERT INTO epipes_new(week, material_id) VALUES(?,?)", [newWeeks[i], materials_ids[j]], (err, results) => {
                    if(err){
                      console.log(err)
                    }
                  })
                  sql.query("INSERT INTO forecast(week, material_id) VALUES(?,?)", [newWeeks[i], materials_ids[j]], (err, results) => {
                    if(err){
                      console.log(err)
                    }
                  })
                  
                }
                sql.query("INSERT INTO epipes_ifd(week) VALUES(?)", [newWeeks[i]], (err, results) => {
                  if(err){
                    console.log(err)
                  }
                })
                sql.query("INSERT INTO forecast_ifd(week) VALUES(?)", [newWeeks[i]], (err, results) => {
                  if(err){
                    console.log(err)
                  }
                })
              }
            }
          })
        }
        sql.query("SELECT DISTINCT week FROM eweights ORDER BY week DESC LIMIT 1", (err, results) =>{
          let currentWeeks = 0
          const weeks = (new Date(finish) - new Date(start)) / (1000 * 60 * 60 * 24) / 7
          if(results[0]){
            currentWeeks = results[0].week
          }
          if(weeks < currentWeeks){
            sql.query("DELETE FROM eweights WHERE week > ?", [weeks], (err, results) =>{
              if(err){
                console.log(err)
                res.send({success: false}).status(401)
              }
            })
          }else if(weeks > currentWeeks){
            let newWeeks = []
            for (var i = currentWeeks + 1; i <= weeks; i++) {
              newWeeks.push(i);
            }
            for(let i = 0; i < newWeeks.length; i++){
              sql.query("INSERT INTO eweights(week) VALUES(?)", [newWeeks[i]], (err, results) => {
                if(err){
                  console.log(err)
                }
              })
            }
          }
        })
        res.send({success: true}).status(200)
        
      })
    }
  })
}

const submitPipingClass = async(req, res) =>{
  const pipingClass = req.body.piping
  for(let i = 0; i < pipingClass.length; i++){
    if(!pipingClass[i]["PipingClass"] || pipingClass[i]["PipingClass"] == "" || !pipingClass[i]["Material"] || pipingClass[i]["Material"] == ""){
      sql.query("DELETE FROM pipingclass WHERE id = ?", [pipingClass[i]["id"]], (err, results)=>{
          if(err){
              console.log(err)
              res.status(401)
          }
      })
    }else{
      sql.query("SELECT id FROM materials WHERE name = ?", [pipingClass[i]["Material"]], (err, results) =>{
        if(!results[0]){
          res.send({success: false}).status(401)
        }else{
          const material_id = results[0].id
          sql.query("SELECT * FROM pipingclass WHERE id = ?", [pipingClass[i]["id"]], (err, results) =>{
            if(!results[0]){
              sql.query("INSERT INTO pipingclass(name, material_id) VALUES(?,?)", [pipingClass[i]["PipingClass"], material_id], (err, results) =>{
                if(err){
                  console.log(err)
                }
              })
            }else{
              sql.query("UPDATE pipingclass SET name = ?, material_id = ? WHERE id = ?", [pipingClass[i]["PipingClass"], material_id, results[0].id], (err, results) =>{
                if(err){
                  console.log(err)
                }
              })
            }
          })
        }
      })
    }
  }
  res.send({success: true}).status(200)
}

const submitMaterials = async(req, res) =>{
  const materials = req.body.materials
  for(let i = 0; i < materials.length; i++){
    if(!materials[i]["Material"] || materials[i]["Material"] == ""){
      await sql.query("DELETE FROM materials WHERE id = ?", [materials[i]["id"]], (err, results)=>{
          if(err){
              console.log(err)
              res.status(401)
          }
      })
    }else{
      await sql.query("SELECT * FROM materials WHERE id = ?", [materials[i]["id"]], async(err, results) =>{
        if(!results[0]){
          await sql.query("INSERT INTO materials(name) VALUES(?)", [materials[i]["Material"]], async(err, results) =>{
            if(err){
              console.log(err)
            }else{
              await sql.query("SELECT id FROM materials WHERE name = ?", [materials[i]["Material"]], async(err, results)=>{
                const material_id = results[0].id
                /*
                await sql.query("SELECT DISTINCT week FROM epipes_new ORDER BY week DESC", async(err, results) =>{
                  if(results[0]){
                */
                  await sql.query("SELECT * FROM project_span", async(err, results) =>{
                      if(results[0]){
                        let week = Math.floor((new Date(results[0].finishing_date) - new Date(results[0].starting_date)) / (1000 * 60 * 60 * 24) / 7)
                        
                      for(let w = 1; w < week + 1; w++){
                      await sql.query("INSERT INTO epipes_new(week, material_id) VALUES(?,?)", [w, material_id], (err, results) =>{
                        if(err){
                          console.log(err)
                        }
                      })
                      await sql.query("INSERT INTO forecast(week, material_id) VALUES(?,?)", [w, material_id], (err, results) =>{
                        if(err){
                          console.log(err)
                        }
                      })
                    }
                  }
                })
              })
            }
          })
        }else{
          await sql.query("UPDATE materials SET name = ? WHERE id = ?", [materials[i]["Material"], materials[i]["id"]], (err, results) =>{
            if(err){
              console.log(err)
            }
          })
        }
      })
    }
  }
  res.send({success: true}).status(200)
}

const submitEstimatedForecast = async(req, res) =>{
  const material_id = req.body.material_id
  const estimated = req.body.estimated
  const forecast = req.body.forecast

  Object.keys(estimated).map(function(key, index) {
    sql.query("UPDATE epipes_new SET estimated = ? WHERE material_id = ? AND week = ?", [estimated[key], material_id, key], (err, results) =>{
      if(err){
        console.log(err)
      }
    })
  });

  Object.keys(forecast).map(function(key, index) {
    sql.query("UPDATE forecast SET estimated = ? WHERE material_id = ? AND week = ?", [forecast[key], material_id, key], (err, results) =>{
      if(err){
        console.log(err)
      }
    })
  });

  res.send({success: true}).status(200)
}

const getEstimatedByMaterial = async(req, res) =>{
  sql.query("SELECT * FROM estimated_materials_view", (err, results) =>{
    if(!results[0]){
      res.json({estimated: []}).status(200)
    }else{
      res.json({estimated: results}).status(200)
    }
  })
}

const getIssuedByMatWeek = async(req, res) =>{
  sql.query("SELECT * FROM issued_material_view", (err, results) =>{
    if(!results[0]){
      res.send({issued: []}).status(200)
    }else{
      const issued_isos = results
      sql.query("SELECT starting_date FROM project_span", (err, results) =>{
        if(!results[0]){
          res.send({issued: []}).status(200)
        }else{
          let start = results[0].starting_date
          let issued = {}
          let issued_mat = {}
          let material_id = issued_isos[0].material_id
          for(let i = 0; i < issued_isos.length; i++){
            let week = Math.floor((new Date(issued_isos[i].issuer_date) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
            if(material_id == issued_isos[i].material_id){
              if(issued_mat[week]){
                issued_mat[week] += 1
              }else{
                issued_mat[week] = 1
              }
            }else{
              issued[material_id] = issued_mat
              material_id = issued_isos[i].material_id
              issued_mat = {}
              issued_mat[week] = 1
            }
          }
          
          issued[material_id] = issued_mat
          res.send({issued: issued}).status(200)
        }
      })
    }
  })
}

const getIssuedWeightByMatWeek = async(req, res) =>{
  sql.query("SELECT * FROM isocontrol_issued_weight_view", (err, results) =>{
    if(!results[0]){
      res.send({issued: []}).status(200)
    }else{
      const issued_isos = results
      sql.query("SELECT starting_date FROM project_span", (err, results) =>{
        if(!results[0]){
          res.send({issued: []}).status(200)
        }else{
          let start = results[0].starting_date
          let issued = {}
          let issued_mat = {}
          let material_id = issued_isos[0].material_id
          for(let i = 0; i < issued_isos.length; i++){
            let week = Math.floor((new Date(issued_isos[i].issued_date) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
            if(material_id == issued_isos[i].material_id){
              if(issued_mat[week]){
                issued_mat[week] += issued_isos[i].total_weight
              }else{
                issued_mat[week] = issued_isos[i].total_weight
              }
            }else{
              issued[material_id] = issued_mat
              material_id = issued_isos[i].material_id
              issued_mat = {}
              issued_mat[week] = issued_isos[i].total_weight
            }
          }
          
          issued[material_id] = issued_mat
          res.send({issued: issued}).status(200)
        }
      })
    }
  })
}

const getEstimatedForecastWeight = async(req, res) =>{
  sql.query("SELECT * FROM eweights", (err, results) =>{
    if(!results[0]){
      res.send({estimated: []}).status(200)
    }else{
        res.send({estimated: results}).status(200)
    }
  })
}

const submitEstimatedForecastWeight = async(req, res) =>{
  const estimated = req.body.estimated
  const forecast = req.body.forecast
  Object.keys(estimated).map(function(key, index) {
    sql.query("UPDATE eweights SET estimated = ?, forecast = ? WHERE week = ?", [estimated[key], forecast[key], key], (err, results) =>{
      if(err){
        console.log(err)
      }
    })
  });

  res.send({success: true}).status(200)
}

const getIsosByUserWeekDesign = async(req, res) =>{
  sql.query("SELECT name, assignation_date FROM owners LEFT JOIN users ON owners.owner_iso_id = users.id ORDER BY name", (err, results) =>{
    if(!results[0]){
      res.send({user_isos: []}).status(200)
    }else{
      let assignations = results
      sql.query("SELECT starting_date, finishing_date FROM project_span", (err, results) =>{
        if(!results[0]){
          res.send({user_isos: []}).status(200)
        }else{
          const start = results[0].starting_date
          const finish = results[0].finishing_date
          let user_isos = {}
          let current_user = assignations[0].name
          let user = {}
          for(let i = 0; i < assignations.length; i++){
            let week = Math.floor((new Date(assignations[i].assignation_date) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
            if(current_user === assignations[i].name){
              if(user[week]){
                user[week] += 1
              }else{
                user[week] = 1
              }
            }else{
              user_isos[current_user] = {assigned: user}
              user = {}
              current_user = assignations[i].name
              user[week] = 1
            }
          }
          user_isos[current_user] = {assigned: user}

          sql.query("SELECT * FROM design_transactions_view", (err, results)=>{
            if(!results[0]){
              let total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
              Object.keys(user_isos).map(function(user, index) {
                user_isos[user]["sent"] = {}
                user_isos[user]["returned"] = {}

                user_isos[user]["remaining"] = {}
                for(let w = 1; w < total_weeks + 1; w++){
                  let remaining = 0
                  if(w > 1){
                    remaining = user_isos[user]["remaining"][w-1]
                  }
                  if(user_isos[user]["assigned"]){
                    if(user_isos[user]["assigned"][w]){
                      remaining += user_isos[user]["assigned"][w]
                    }
                  }
                  user_isos[user]["remaining"][w] = remaining
                }
                
              })
              res.send({design_isos: user_isos}).status(200)
            }else{
              let transactions = results
              let current_user = transactions[0].name
              let user_sent = {}
              let user_returned = {} 
              for(let i = 0; i < transactions.length; i++){
                let week = Math.floor((new Date(transactions[i].created_at) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
                if(current_user === transactions[i].name){
                  if(transactions[i].from === "Design" && transactions[i].to !== "Design"){
                    if(user_sent[week]){
                      user_sent[week] += 1
                    }else{
                      user_sent[week] = 1
                    }
                  }else if(transactions[i].to === "Cancel verify"){
                    if(user_returned[week]){
                      user_returned[week] += 1
                    }else{
                      user_returned[week] = 1
                    }
                  }else if(transactions[i].from === "Issued"){
                    if(user_isos[current_user]["assigned"][week]){
                      user_isos[current_user]["assigned"][week] += 1
                    }else{
                      user_isos[current_user]["assigned"][week] = 1
                    }
                  }else if(transactions[i].to === "Design"){
                    if(user_returned[week]){
                      user_returned[week] += 1
                    }else{
                      user_returned[week] = 1
                    }
                  }
                }else{
                  user_isos[current_user]["sent"] = user_sent
                  user_isos[current_user]["returned"] = user_returned
                  user_sent = {}
                  user_returned = {}
                  current_user = transactions[i].name
                  if(transactions[i].from === "Design" && transactions[i].to !== "Design"){
                    if(user_sent[week]){
                      user_sent[week] += 1
                    }else{
                      user_sent[week] = 1
                    }
                  }else if(transactions[i].to === "Cancel verify"){
                    if(user_returned[week]){
                      user_returned[week] += 1
                    }else{
                      user_returned[week] = 1
                    }
                  }else if(transactions[i].from === "Issued"){
                    if(user_isos[current_user]["assigned"][week]){
                      user_isos[current_user]["assigned"][week] += 1
                    }else{
                      user_isos[current_user]["assigned"][week] = 1
                    }
                  }else if(transactions[i].to === "Design"){
                    if(user_returned[week]){
                      user_returned[week] -= 1
                    }else{
                      user_returned[week] = 0
                    }
                  }
                }
              }
              user_isos[current_user]["sent"] = user_sent
              user_isos[current_user]["returned"] = user_returned

              let total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
              Object.keys(user_isos).map(function(key, index) {
                user_isos[key]["remaining"] = {}
                for(let w = 1; w < total_weeks + 1; w++){
                  let remaining = 0
                  if(w > 1){
                    remaining = user_isos[key]["remaining"][w-1]
                  }
                  if(user_isos[key]["assigned"]){
                    if(user_isos[key]["assigned"][w]){
                      remaining += user_isos[key]["assigned"][w]
                    }
                  }
                  if(user_isos[key]["sent"]){
                    if(user_isos[key]["sent"][w]){
                      remaining -= user_isos[key]["sent"][w]
                    }
                  }
                  if(user_isos[key]["returned"]){
                    if(user_isos[key]["returned"][w]){
                      remaining += user_isos[key]["returned"][w]
                    }
                  }
                  user_isos[key]["remaining"][w] = remaining
                }
                
              });
              res.json({design_isos: user_isos}).status(200)
            }
          })
        }
      })
      
    }
  })
}

const getWeightByUserWeekDesign = async(req, res) =>{
  sql.query("SELECT users.name, assignation_date, tpipes.weight FROM owners LEFT JOIN users ON owners.owner_iso_id = users.id LEFT JOIN dpipes_view ON owners.tag = dpipes_view.tag JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id ORDER BY name", (err, results) =>{
    if(!results[0]){
      res.send({user_isos: []}).status(200)
    }else{
      let assignations = results
      sql.query("SELECT starting_date, finishing_date FROM project_span", (err, results) =>{
        if(!results[0]){
          res.send({user_isos: []}).status(200)
        }else{
          const start = results[0].starting_date
          const finish = results[0].finishing_date
          let user_isos = {}
          let current_user = assignations[0].name
          let user = {}
          for(let i = 0; i < assignations.length; i++){
            let week = Math.floor((new Date(assignations[i].assignation_date) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
            if(current_user === assignations[i].name){
              if(user[week]){
                user[week] += assignations[i].weight
              }else{
                user[week] = assignations[i].weight
              }
            }else{
              user_isos[current_user] = {assigned: user}
              user = {}
              current_user = assignations[i].name
              user[week] = assignations[i].weight
            }
          }
          user_isos[current_user] = {assigned: user}

          sql.query("SELECT * FROM design_transactions_view", (err, results)=>{
            if(!results[0]){
                let total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
                Object.keys(user_isos).map(function(user, index) {
                  user_isos[user]["sent"] = {}
                  user_isos[user]["returned"] = {}
  
                  user_isos[user]["remaining"] = {}
                  for(let w = 1; w < total_weeks + 1; w++){
                    let remaining = 0
                    if(w > 1){
                      remaining = user_isos[user]["remaining"][w-1]
                    }
                    if(user_isos[user]["assigned"]){
                      if(user_isos[user]["assigned"][w]){
                        remaining += user_isos[user]["assigned"][w]
                      }
                    }
                    user_isos[user]["remaining"][w] = remaining
                  }
                  
                })
                res.send({design_isos: user_isos}).status(200)
            }else{
              let transactions = results
              let current_user = transactions[0].name
              let user_sent = {}
              let user_returned = {} 
              for(let i = 0; i < transactions.length; i++){
                let week = Math.floor((new Date(transactions[i].created_at) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
                if(current_user === transactions[i].name){
                  if(transactions[i].from === "Design" && transactions[i].to !== "Design"){
                    if(user_sent[week]){
                      user_sent[week] += transactions[i].weight
                    }else{
                      user_sent[week] = transactions[i].weight
                    }
                  }else if(transactions[i].to === "Cancel verify"){
                    if(user_returned[week]){
                      user_returned[week] += transactions[i].weight
                    }else{
                      user_returned[week] = transactions[i].weight
                    }
                  }else if(transactions[i].from === "Issued"){
                    if(user_isos[current_user]["assigned"][week]){
                      user_isos[current_user]["assigned"][week] += transactions[i].weight
                    }else{
                      user_isos[current_user]["assigned"][week] = transactions[i].weight
                    }
                  }else if(transactions[i].to === "Design"){
                    if(user_returned[week]){
                      user_returned[week] += transactions[i].weight
                    }else{
                      user_returned[week] = transactions[i].weight
                    }
                  }
                }else{
                  user_isos[current_user]["sent"] = user_sent
                  user_isos[current_user]["returned"] = user_returned
                  user_sent = {}
                  user_returned = {}
                  current_user = transactions[i].name
                  if(transactions[i].from === "Design" && transactions[i].to !== "Design"){
                    if(user_sent[week]){
                      user_sent[week] += transactions[i].weight
                    }else{
                      user_sent[week] = transactions[i].weight
                    }
                  }else if(transactions[i].to === "Cancel verify"){
                    if(user_returned[week]){
                      user_returned[week] += transactions[i].weight
                    }else{
                      user_returned[week] = transactions[i].weight
                    }
                  }else if(transactions[i].from === "Issued"){
                    if(user_isos[current_user]["assigned"][week]){
                      user_isos[current_user]["assigned"][week] += transactions[i].weight
                    }else{
                      user_isos[current_user]["assigned"][week] = transactions[i].weight
                    }
                  }else if(transactions[i].to === "Design"){
                    if(user_returned[week]){
                      user_returned[week] -= transactions[i].weight
                    }else{
                      user_returned[week] = transactions[i].weight
                    }
                  }
                }
              }
              user_isos[current_user]["sent"] = user_sent
              user_isos[current_user]["returned"] = user_returned

              let total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
              Object.keys(user_isos).map(function(key, index) {
                user_isos[key]["remaining"] = {}
                for(let w = 1; w < total_weeks + 1; w++){
                  let remaining = 0
                  if(w > 1){
                    remaining = user_isos[key]["remaining"][w-1]
                  }
                  if(user_isos[key]["assigned"]){
                    if(user_isos[key]["assigned"][w]){
                      remaining += user_isos[key]["assigned"][w]
                    }
                  }
                  if(user_isos[key]["sent"]){
                    if(user_isos[key]["sent"][w]){
                      remaining -= user_isos[key]["sent"][w]
                    }
                  }
                  if(user_isos[key]["returned"]){
                    if(user_isos[key]["returned"][w]){
                      remaining += user_isos[key]["returned"][w]
                    }
                  }
                  user_isos[key]["remaining"][w] = remaining
                }
                
              });
              res.json({design_isos: user_isos}).status(200)
            }
          })
        }
      })
      
    }
  })
}


const getIsosByUserWeek = async(req, res) =>{
 
  sql.query("SELECT starting_date, finishing_date FROM project_span", (err, results) =>{
    if(!results[0]){
      res.send({user_isos: []}).status(200)
    }else{
      const start = results[0].starting_date
      const finish = results[0].finishing_date
      const total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
      let user_isos = {}

      sql.query("SELECT `users`.`name` as `user`, `roles`.`name` as `role` FROM users JOIN model_has_roles ON users.id = model_has_roles.model_id LEFT JOIN roles ON model_has_roles.role_id = roles.id WHERE roles.id >= 2 AND roles.id <= 8 ORDER BY `roles`.`name`", (err, results)=>{
        if(!results[0]){
          res.send({user_isos: []}).status(200)
        }else{
          const roles = results
          const order = ["DesignLead", "Stress", "StressLead", "Supports", "SupportsLead", "Materials", "Issuer", "LDE/Isocontrol"]
          let role = results[0].role
          user_isos[role] = {}
          let weeksClaimed = {}
          let weeksSent = {}
          let weeksReturned = {}
          let weeksRemaining = {}
          for(let i = 0; i < roles.length; i++){
            
            if(role == results[i].role){
              user_isos[role][roles[i].user] = {}
              user_isos[role][roles[i].user]["claimed"] = {}
              user_isos[role][roles[i].user]["sent"] = {}
              user_isos[role][roles[i].user]["returned"] = {}
              user_isos[role][roles[i].user]["remaining"] = {}
            }else{
              role = results[i].role
              user_isos[role] = {}
              user_isos[role][roles[i].user] = {}
              user_isos[role][roles[i].user]["claimed"] = {}
              user_isos[role][roles[i].user]["sent"] = {}
              user_isos[role][roles[i].user]["returned"] = {}
              user_isos[role][roles[i].user]["remaining"] = {}
            }
          }
          
          sql.query("SELECT * FROM transactions_view", (err, results)=>{
            if(!results[0]){
              res.send({user_isos: user_isos}).status(200)
            }else{
              let transactions = results
              let owners_by_role = {}
              for(let i = 0; i < transactions.length; i++){
                let w = Math.floor((new Date(transactions[i].created_at) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
                if(transactions[i].to == "Claimed"){
                  if(!owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision]){
                    if(user_isos[transactions[i].role][transactions[i].name]["claimed"][w]){
                      user_isos[transactions[i].role][transactions[i].name]["claimed"][w] += 1
                    }else{
                      user_isos[transactions[i].role][transactions[i].name]["claimed"][w] = 1
                    }
                  }
                }else if(transactions[i].to == "Cancel verify"){
                  if(user_isos[transactions[i].role][transactions[i].name]["returned"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["returned"][w] += 1
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["returned"][w] = 1
                  }
                }else if(transactions[i].to == "Unclaimed"){
                  if(user_isos[transactions[i].role][transactions[i].name]["claimed"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["claimed"][w] -= 1
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["claimed"][w] = -1
                  }
                }else if(transactions[i].role == "SpecialityLead"){
                    let comments = transactions[i].comments.split("-")
                    if(comments[0] == "FU"){
                      if(owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision] == comments[1]){
                        if(user_isos[comments[2]][comments[1]]["returned"][w]){
                          user_isos[comments[2]][comments[1]]["returned"][w] -= 1
                        }else{
                          user_isos[comments[2]][comments[1]]["returned"][w] = -1
                        }
                        delete owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision]
                      }else{
                        if(user_isos[comments[2]][comments[1]]["claimed"][w]){
                          user_isos[comments[2]][comments[1]]["claimed"][w] -= 1
                        }else{
                          user_isos[comments[2]][comments[1]]["claimed"][w] = -1
                        }
                      }
                      
                    }else if(comments[0] == "FC"){
                      if(owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision] == comments[1]){
                        if(user_isos[comments[2]][comments[1]]["returned"][w]){
                          user_isos[comments[2]][comments[1]]["returned"][w] += 1
                        }else{
                          user_isos[comments[2]][comments[1]]["returned"][w] = 1
                        }
                      }else{
                        if(user_isos[comments[2]][comments[1]]["claimed"][w]){
                          user_isos[comments[2]][comments[1]]["claimed"][w] += 1
                        }else{
                          user_isos[comments[2]][comments[1]]["claimed"][w] = 1
                        }
                      }
                    }else{
                      if(owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision] && (order.indexOf(transactions[i].to) <= order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      
                        if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w]){
                          user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] += 1
                        }else{
                          user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] = 1
                        }
                      }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                        owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                      }
                      
                      if(owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] == transactions[i].comments && transactions[i].comments != null && transactions[i].role == "StressLead"){
                        if(user_isos["SupportsLead"][transactions[i].comments]["claimed"][w]){
                          user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] += 1
                        }else{
                          user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] = 1
                        }
                      }
                    }
                }else{
                  
                  if(user_isos[transactions[i].role][transactions[i].name]["sent"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["sent"][w] += 1
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["sent"][w] = 1 
                  }

                  if(transactions[i].role == "SupportsLead" && transactions[i].verify == 1){
                    if(owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision] && (order.indexOf(transactions[i].to) < order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w]){
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w] += 1
                      }else{
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w] = 1
                      }
                    }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                      owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                    }
                  }else{
                    if(owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision] && (order.indexOf(transactions[i].to) <= order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      
                      if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w]){
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] += 1
                      }else{
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] = 1
                      }
                    }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                      owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                    }
                    
                    if(owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] == transactions[i].comments && transactions[i].comments != null && transactions[i].role == "StressLead"){
                      if(user_isos["SupportsLead"][transactions[i].comments]["claimed"][w]){
                        user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] += 1
                      }else{
                        user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] = 1
                      }
                    }
                  }
                  
                }
              }

              Object.keys(user_isos).map(function(role, index) {
                Object.keys(user_isos[role]).map(function(user, index) {
                    for(let w = 1; w < total_weeks + 1; w++){
                      let remaining = 0
                      if(w > 1){
                        remaining = user_isos[role][user]["remaining"][w-1]
                      }
                      if(user_isos[role][user]["claimed"][w]){
                        remaining += user_isos[role][user]["claimed"][w]
                      }
                      if(user_isos[role][user]["sent"][w]){
                        remaining -= user_isos[role][user]["sent"][w]
                      }
                      if(user_isos[role][user]["returned"][w]){
                        remaining += user_isos[role][user]["returned"][w]
                      }
                      user_isos[role][user]["remaining"][w] = remaining
                    }
                })
              })
              res.json({user_isos: user_isos}).status(200)
            }
            
          })
        }
      })
    }
  })
  
}


const getWeightByUserWeek = async(req, res) =>{
  sql.query("SELECT starting_date, finishing_date FROM project_span", (err, results) =>{
    if(!results[0]){
      res.send({user_isos: []}).status(200)
    }else{
      const start = results[0].starting_date
      const finish = results[0].finishing_date
      const total_weeks = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
      let user_isos = {}

      sql.query("SELECT `users`.`name` as `user`, `roles`.`name` as `role` FROM users JOIN model_has_roles ON users.id = model_has_roles.model_id LEFT JOIN roles ON model_has_roles.role_id = roles.id WHERE roles.id >= 2 AND roles.id <= 8 ORDER BY `roles`.`name`", (err, results)=>{
        if(!results[0]){
          res.send({user_isos: []}).status(200)
        }else{
          const roles = results
          const order = ["DesignLead", "Stress", "StressLead", "Supports", "SupportsLead", "Materials", "Issuer", "LDE/Isocontrol"]
          let role = results[0].role
          user_isos[role] = {}
          let weeksClaimed = {}
          let weeksSent = {}
          let weeksReturned = {}
          let weeksRemaining = {}
          for(let i = 0; i < roles.length; i++){
            
            if(role == results[i].role){
              user_isos[role][roles[i].user] = {}
              user_isos[role][roles[i].user]["claimed"] = {}
              user_isos[role][roles[i].user]["sent"] = {}
              user_isos[role][roles[i].user]["returned"] = {}
              user_isos[role][roles[i].user]["remaining"] = {}
            }else{
              role = results[i].role
              user_isos[role] = {}
              user_isos[role][roles[i].user] = {}
              user_isos[role][roles[i].user]["claimed"] = {}
              user_isos[role][roles[i].user]["sent"] = {}
              user_isos[role][roles[i].user]["returned"] = {}
              user_isos[role][roles[i].user]["remaining"] = {}
            }
          }
          
          sql.query("SELECT * FROM transactions_view", (err, results)=>{
            if(!results[0]){
              res.send({user_isos: user_isos}).status(200)
            }else{
              let transactions = results
              let owners_by_role = {}
              for(let i = 0; i < transactions.length; i++){
                let w = Math.floor((new Date(transactions[i].created_at) - new Date(start)) / (1000 * 60 * 60 * 24) / 7)
                if(transactions[i].to == "Claimed"){
                  if(!owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision]){
                    if(user_isos[transactions[i].role][transactions[i].name]["claimed"][w]){
                      user_isos[transactions[i].role][transactions[i].name]["claimed"][w] += transactions[i].weight
                    }else{
                      user_isos[transactions[i].role][transactions[i].name]["claimed"][w] = transactions[i].weight
                    }
                  }
                }else if(transactions[i].to == "Cancel verify"){
                  if(user_isos[transactions[i].role][transactions[i].name]["returned"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["returned"][w] += transactions[i].weight
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["returned"][w] = transactions[i].weight
                  }
                }else if(transactions[i].to == "Unclaimed"){
                  if(user_isos[transactions[i].role][transactions[i].name]["claimed"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["claimed"][w] -= transactions[i].weight
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["claimed"][w] = -transactions[i].weight
                  }
                }else if(transactions[i].role == "SpecialityLead"){
                    let comments = transactions[i].comments.split("-")
                    if(comments[0] == "FU"){
                      if(owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision] == comments[1]){
                        if(user_isos[comments[2]][comments[1]]["returned"][w]){
                          user_isos[comments[2]][comments[1]]["returned"][w] -= transactions[i].weight
                        }else{
                          user_isos[comments[2]][comments[1]]["returned"][w] = -transactions[i].weight
                        }
                        delete owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision]
                      }else{
                        if(user_isos[comments[2]][comments[1]]["claimed"][w]){
                          user_isos[comments[2]][comments[1]]["claimed"][w] -= transactions[i].weight
                        }else{
                          user_isos[comments[2]][comments[1]]["claimed"][w] = -transactions[i].weight
                        }
                      }
                      
                    }else if(comments[0] == "FC"){
                      if(owners_by_role[transactions[i].filename + comments[2] + transactions[i].revision] == comments[1]){
                        if(user_isos[comments[2]][comments[1]]["returned"][w]){
                          user_isos[comments[2]][comments[1]]["returned"][w] += transactions[i].weight
                        }else{
                          user_isos[comments[2]][comments[1]]["returned"][w] = transactions[i].weight
                        }
                      }else{
                        if(user_isos[comments[2]][comments[1]]["claimed"][w]){
                          user_isos[comments[2]][comments[1]]["claimed"][w] += transactions[i].weight
                        }else{
                          user_isos[comments[2]][comments[1]]["claimed"][w] = transactions[i].weight
                        }
                      }
                    }else{
                      if(owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision] && (order.indexOf(transactions[i].to) <= order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      
                        if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w]){
                          user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] += transactions[i].weight
                        }else{
                          user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] = transactions[i].weight
                        }
                      }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                        owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                      }
                      
                      if(owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] == transactions[i].comments && transactions[i].comments != null && transactions[i].role == "StressLead"){
                        if(user_isos["SupportsLead"][transactions[i].comments]["claimed"][w]){
                          user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] += transactions[i].weight
                        }else{
                          user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] = transactions[i].weight
                        }
                      }
                    }
                }else{
                  
                  if(user_isos[transactions[i].role][transactions[i].name]["sent"][w]){
                    user_isos[transactions[i].role][transactions[i].name]["sent"][w] += transactions[i].weight
                  }else{
                    user_isos[transactions[i].role][transactions[i].name]["sent"][w] = transactions[i].weight
                  }

                  if(transactions[i].role == "SupportsLead" && transactions[i].verify == 1){
                    if(owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision] && (order.indexOf(transactions[i].to) < order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w]){
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w] += transactions[i].weight
                      }else{
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + "StressLead" + transactions[i].revision]]["returned"][w] = transactions[i].weight
                      }
                    }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                      owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                    }
                  }else{
                    if(owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision] && (order.indexOf(transactions[i].to) <= order.indexOf(transactions[i].from) || transactions[i].to == "Cancel verify") && transactions[i].to != "Design"  && transactions[i].to != "Verify"){
                      
                      if(user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w]){
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] += transactions[i].weight
                      }else{
                        user_isos[transactions[i].to][owners_by_role[transactions[i].filename + transactions[i].to + transactions[i].revision]]["returned"][w] = transactions[i].weight
                      }
                    }else if(order.indexOf(transactions[i].to) > order.indexOf(transactions[i].from)){
                      owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] = transactions[i].name
                    }
                    
                    if(owners_by_role[transactions[i].filename + transactions[i].role + transactions[i].revision] == transactions[i].comments && transactions[i].comments != null && transactions[i].role == "StressLead"){
                      if(user_isos["SupportsLead"][transactions[i].comments]["claimed"][w]){
                        user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] += transactions[i].weight
                      }else{
                        user_isos["SupportsLead"][transactions[i].comments]["claimed"][w] = transactions[i].weight
                      }
                    }
                  }
                  
                }
              }

              Object.keys(user_isos).map(function(role, index) {
                Object.keys(user_isos[role]).map(function(user, index) {
                    for(let w = 1; w < total_weeks + 1; w++){
                      let remaining = 0
                      if(w > 1){
                        remaining = user_isos[role][user]["remaining"][w-1]
                      }
                      if(user_isos[role][user]["claimed"][w]){
                        remaining += user_isos[role][user]["claimed"][w]
                      }
                      if(user_isos[role][user]["sent"][w]){
                        remaining -= user_isos[role][user]["sent"][w]
                      }
                      if(user_isos[role][user]["returned"][w]){
                        remaining += user_isos[role][user]["returned"][w]
                      }
                      user_isos[role][user]["remaining"][w] = remaining
                    }
                })
              })
              res.json({user_isos: user_isos}).status(200)
            }
            
          })
        }
      })
    }
  })
  
}

const trayCount = async(req, res) =>{
  sql.query("SELECT * FROM iquoxe_db.tray_count_view", (err, results) =>{
    if(!results[0]){
      res.send({isoCount: [{Design: 0, DesignLead: 0, Stress: 0, StressLead: 0, Supports:0, SupportsLead: 0, Materials: 0, Issuer: 0}]}).status(200)
    }else{
      res.send({isoCount: results}).status(200)
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
  modelled,
  toProcess,
  instrument,
  cancelProc,
  cancelInst,
  filesProcInst,
  uploadProc,
  uploadInst,
  getAttach,
  piStatus,
  uploadReport,
  uploadReportPeriod,
  checkPipe,
  toIssue,
  request,
  newRev,
  rename,
  unlock,
  unlockAll,
  uploadEquisModelledReport,
  uploadEquisEstimatedReport,
  uploadInstModelledReport,
  uploadInstEstimatedReport,
  uploadCivModelledReport,
  uploadCivEstimatedReport,
  uploadElecModelledReport,
  uploadElecEstimatedReport,
  uploadPipesEstimatedReport,
  downloadInstrumentationModelled,
  downloadEquipmentModelled,
  downloadCivilModelled,
  downloadElectricalModelled,
  navis,
  updateBom,
  exportModelled,
  exportNotModelled,
  holds,
  lastUser,
  uploadNotifications,
  exportFull,
  exportLineIdGroup,
  exportHolds,
  exportHoldsNoProgress,
  downloadBOM,
  getPids,
  timeTrack,
  exportTimeTrack,
  revision,
  submitRevision,
  excludeHold,
  sendHold,
  createByPass,
  getByPassData,
  acceptByPass,
  rejectByPass,
  naByPass,
  editByPass,
  closeByPass,
  deleteByPass,
  answerByPass,
  exportByPass,
  isCancellable,
  cancelRev,
  getFilenamesByUser,
  getDiameters,
  getLineRefs,
  getDesigners,
  modelledEstimatedPipes,
  getDataByRef,
  submitModelledEstimatedPipes,
  checkOwner,
  modelledEstimatedHolds,
  getAllHolds,
  submitHoldsIso,
  getIsocontrolHolds,
  getEstimatedMatWeek,
  getForecastMatWeek,
  getMaterials,
  getMaterialsPipingClass,
  getProjectSpan,
  submitProjectSpan,
  submitPipingClass,
  submitMaterials,
  submitEstimatedForecast,
  getEstimatedByMaterial,
  getIssuedByMatWeek,
  getIssuedWeightByMatWeek,
  getEstimatedForecastWeight,
  submitEstimatedForecastWeight,
  getIsosByUserWeekDesign,
  getWeightByUserWeekDesign,
  getIsosByUserWeek,
  getWeightByUserWeek,
  trayCount
};