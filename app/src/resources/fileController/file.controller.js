const uploadFile = require("../fileMiddleware/file.middleware");
const uploadBom = require("../fileMiddleware/bom.middleware");
const fs = require("fs");
const bodyParser = require('body-parser')
const sql = require("../../db.js");
const pathPackage = require("path")
var format = require('date-format');
var cron = require('node-cron');
const csv=require('csvtojson')
const readXlsxFile = require('read-excel-file/node');
const { verify } = require("crypto");

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
  if(process.env.NODE_PROGRESS === "1"){
    sql.query('SELECT misoctrls.*, dpipes_view.*, tpipes.`name`, tpipes.weight, tpipes.`code` FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id WHERE misoctrls.`to` = ? GROUP BY misoctrls.isoid', [tab], (err, results) =>{
      
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
            console.log("error")
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
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
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
            sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid = ?", [req.body.fileName.split('.').slice(0, -1)], (err, results)=>{
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
    
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
            [fileName, last.revision, last.spo, last.sit, "Updated", last.from, "Updated", username, req.body.role], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
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
  sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE revision = 0 OR revision = 1", (err, results) =>{
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
        }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 0 && results[i].issued == null){
          toIssueR0 += 1
        }else if(results[i].to == "LDE/Isocontrol" && results[i].issued == 1 && results[i].revision == 1){
          issuedR0 += 1
        }
      }


      totalR0 = designR0 + stressR0 + supportsR0 + materialsR0 + issuerR0 + toIssueR0 + issuedR0
      sql.query("SELECT `to`,issued, revision FROM misoctrls WHERE revision = 1 OR revision = 2", (err, results) =>{
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
            }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 1 && results[i].issued == null){
              toIssueR1 += 1
            }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 2 && results[i].issued == 1){
              issuedR1 += 1
            }
          }
    
          totalR1 = designR1 + stressR1 + supportsR1 + materialsR1 + issuerR1 + toIssueR1 + issuedR1
    
        
          sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE revision = 2 OR revision = 3", (err, results) =>{
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
                }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 2 && results[i].issued == null){
                  toIssueR2 += 1
                }else if(results[i].to == "LDE/Isocontrol" && results[i].revision == 3 && results[i].issued == 1){
                  issuedR2 += 1
                }
              }
        
              totalR2 = designR2 + stressR2 + supportsR2 + materialsR2 + issuerR2 + toIssueR2 + issuedR2
              sql.query("SELECT `from` FROM misoctrls WHERE `to` = ?", ["On hold"], (err, results) =>{
                if(!results[0]){
                  results = []
                }
                  for(let i = 0; i < results.length; i++){
                    if(results[i].from == "Design"){
                      designHold += 1
                    }else if(results[i].from == "Stress" || results[i].from == "stress"){
                      stressHold += 1
                    }else if(results[i].from == "Supports"){
                      supportsHold += 1
                    }else if(results[i].from == "Materials"){
                      materialsHold += 1
                    }else if(results[i].from == "Issuer"){
                      issuerHold += 1
                    }else if(results[i].from == "LDE/Isocontrol"){
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
                          totalStock = designStock + stressStock + supportsStock + materialsStock + issuerStock + toIssueStock + issuedStock
    
    
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
                            totalStock: totalR0,
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

const modelled = (req,res) =>{
  sql.query('SELECT tag, isoid, code FROM dpipes_view RIGHT JOIN tpipes ON tpipes.id = dpipes_view.tpipes_id', (err, results)=>{
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
  sql.query("SELECT isoid, deleted, onhold, issued, `from`, role, verifydesign FROM misoctrls ORDER BY isoid ASC", (err, results)=>{
    const delhold = results
    if(process.env.NODE_PROGRESS === "1"){
      sql.query("SELECT misoctrls.isoid, misoctrls.created_at, misoctrls.updated_at, code, revision, `to` FROM misoctrls JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id ORDER BY misoctrls.isoid ASC", (err, results) =>{
        if(!results[0]){
          res.status(401).send("El historial esta vacio")
        }else{
          pattern = "MM/dd/yyyy hh:mm:ss";
          for(let i = 0; i < results.length; i++){
    
            if(delhold[i].issued == null){
              results[i].revision = "ON GOING R" + results[i].revision
            }else{
              results[i].revision = "ISSUED"
            }
            if(delhold[i].deleted == 1){
              results[i].revision = "DELETED"
              results[i].to =  delhold[i].from
              
            }else if (delhold[i].onhold == 1){
              results[i].revision = "ON HOLD"
              results[i].to =  delhold[i].from
            }
            
            if(results[i].to == "LDE/Isocontrol"){
              results[i].to = "LOS/Isocontrol"
            }

            if(results[i].to == "Design"){
              if(delhold[i].verifydesign == 1 || delhold[i].role == "DesignLead"){
                results[i].to = "DESIGN LEAD"
              }
            }

            if(results[i].to == "Stress"){
              if(delhold[i].verifydesign == 1 || delhold[i].role == "StressLead"){
                results[i].to = "STRESS LEAD"
              }
            }

            if(results[i].to == "Supports"){
              if(delhold[i].verifydesign == 1 || delhold[i].role == "SupportsLead"){
                results[i].to = "SUPPORTS LEAD"
              }
            }

            results[i].to = results[i].to.toUpperCase()

            results[i].created_at = format(pattern, results[i].created_at)
            results[i].updated_at = format(pattern, results[i].updated_at)
          }
          res.json(JSON.stringify(results)).status(200)
        }
      })
   }else{             
    sql.query("SELECT misoctrls.isoid, misoctrls.created_at, misoctrls.updated_at, revision, `to` FROM misoctrls ORDER BY misoctrls.isoid ASC", (err, results) =>{
      if(!results[0]){
        res.status(401).send("El historial esta vacio")
      }else{
        pattern = "MM/dd/yyyy hh:mm:ss";
        for(let i = 0; i < results.length; i++){                          

          if(delhold[i].issued == null){             
            results[i].revision = "ON GOING R" + results[i].revision
          }else{
            results[i].revision = "ISSUED"
          }
          if(delhold[i].deleted == 1){
            results[i].revision = "DELETED"
            results[i].to =  delhold[i].from
            
          }else if (delhold[i].onhold == 1){
            results[i].revision = "ON HOLD"
            results[i].to =  delhold[i].from
          }
          
          if(results[i].to == "LDE/Isocontrol"){
            results[i].to = "LOS/Isocontrol"
          }

          if(results[i].to == "Design"){
            if(delhold[i].verifydesign == 1 || delhold[i].role == "DesignLead"){
              results[i].to = "DESIGN LEAD"
            }
          }

          if(results[i].to == "Stress"){
            if(delhold[i].verifydesign == 1 || delhold[i].role == "StressLead"){
              results[i].to = "STRESS LEAD"
            }
          }

          if(results[i].to == "Supports"){
            if(delhold[i].verifydesign == 1 || delhold[i].role == "SupportsLead"){
              results[i].to = "SUPPORTS LEAD"
            }
          }

          
          results[i].to = results[i].to.toUpperCase()


          results[i].created_at = format(pattern, results[i].created_at)
          results[i].updated_at = format(pattern, results[i].updated_at)
        }
        
        res.json(JSON.stringify(results)).status(200)
      }
    })
   }
  })
  
  
}

const downloadPI = async(req,res) =>{
    sql.query("SELECT isoid, spo, sit, updated_at FROM misoctrls WHERE spo != 0 OR sit != 0", (err, results) =>{
      if(!results[0]){
        res.status(401).send("El historial esta vacio")
      }else{
        pattern = "MM/dd/yyyy hh:mm:ss";
        for(let i = 0; i < results.length; i++){
  
          if(results[i].spo == 0){
            results[i].spo = "---"
          }else if(results[i].spo == 1){
            results[i].spo = "TO CHECK"
          }else if(results[i].spo == 2){
            results[i].spo = "ACCEPTED"
          }else if(results[i].spo == 3){
            results[i].spo = "REJECTED"
          }else{
            results[i].spo = "TO CHECK (+)"
          }

          if(results[i].sit == 0){
            results[i].sit = "---"
          }else if(results[i].sit == 1){
            results[i].sit = "TO CHECK"
          }else if(results[i].sit == 2){
            results[i].sit = "ACCEPTED"
          }else if(results[i].sit == 3){
            results[i].sit = "REJECTED"
          }else{
            results[i].sit = "TO CHECK (+)"
          }
          
          results[i].updated_at = format(pattern, results[i].updated_at)
        }
        
        res.json(JSON.stringify(results)).status(200)
      }
    })
}
const downloadIssued = async(req,res) =>{
  sql.query("SELECT filename FROM misoctrls", (err, results) =>{
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      sql.query("SELECT isoid, revision, issued, issued_date FROM misoctrls", (err, results) =>{
        if(!results[0]){
          res.status(401).send("El historial esta vacio")
        }else{
          const pattern = "MM/dd/yyyy hh:mm:ss";
          let isos_index = []
          let isos = []
          for(let i = 0; i < results.length; i++){

            if(isos_index.includes(results[i].isoid)){
              index = isos_index.indexOf(results[i].isoid)
            }else{
              isos_index.push(results[i].isoid)
              isos.push({isoid: results[i].isoid, rev0: "", rev1: "", rev2: "", rev3: "", rev4: ""})
              index = isos.length-1
            }

            if(results[i].revision == 1){
              if(results[i].issued == 1){
                isos[index].rev0 = results[i].issued_date
              }
            }
            if(results[i].revision == 2){
              if(results[i].issued == 1){
                isos[index].rev1 = results[i].issued_date
              }
            }
            if(results[i].revision == 3){
              if(results[i].issued == 1){
                isos[index].rev2 = results[i].issued_date
              }
            }
            if(results[i].revision == 4){
              if(results[i].issued == 1){
                isos[index].rev3 = results[i].issued_date
              }
            }
            if(results[i].revision == 5){
              if(results[i].issued == 1){
                isos[index].rev4 = results[i].issued_date
              }
            }
            
          }
          res.json(JSON.stringify(isos)).status(200)
        }
        
      })
      
      
      
    }
  })
}

const downloadStatus3D = async(req, res) =>{
  sql.query('SELECT tag, tpipes_id, `to`, `from`, claimed, issued FROM dpipes_view RIGHT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid', (err, results) =>{
    
    let log = []
    let ifc_ifd = ""
    let status = ""
    if(process.env.NODE_IFC == 0){
      ifc_ifd = "IFD"
    }else{
      ifc_ifd = "IFC"
    }
    log.push("DESIGN")
    log.push("ONERROR CONTINUE")
    for(let i = 0; i < results.length;i++){
      log.push("/" + results[i].tag + " STM ASS /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd)
      log.push("HANDLE ANY")
      log.push("ENDHANDLE")
      status = results[i].to
      if(status == "Design" && results[i].from == "" && results[i].claimed == 0){
        status = "New"
      }else if(status == "LDE/Isocontrol" && results[i].issued == 0){
        status = "Isoctrl"
      }else if(results[i].issued == 1){
        status = "Transmittal"
      }else if(status == "On hold"){
        status = results[i].from
      }

      if(status != "Recycle bin"){
        log.push("/" + results[i].tag + " STM SET /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd + " /TL" + results[i].tpipes_id + "-" + status)
      }
      
    }
    log.push("FINISH")
    res.json({
      log : log
    }).status(200)
  })
}

const downloadModelled = async(req, res) =>{
  
  sql.query('SELECT tag, isoid, tpipes_id FROM dpipes_view', (err, results) =>{
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
          const areaid = results[0].id
          if(process.env.NODE_MMDN == 1){
            sql.query("SELECT id FROM diameters WHERE nps = ?", [req.body[i][diameter_index]], (err, results) =>{
              if(!results[0]){
                console.log("ivalid diameter")
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
                console.log("ivalid diameter")
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
  const fileName = req.params.fileName.split('.').slice(0, -1)
  sql.query("SELECT * FROM dpipes_view WHERE isoid = ?", [fileName], (err, results) =>{
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
  sql.query("SELECT SUM(progress) FROM misoctrls WHERE revision = 0 OR (revision = 1 AND issued = 1)", (req, results) =>{
    const progress = results[0]["SUM(progress)"]
    sql.query("SELECT SUM(realprogress) FROM misoctrls WHERE requested is null OR requested = 1", (req, results) =>{
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


  sql.query('SELECT * FROM dpipes_view WHERE isoid = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
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
                                sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
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
                                              res.status(200).send({issued: "issued"})
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

  sql.query('SELECT * FROM dpipes_view WHERE isoid = ?', [fileName.split('-').slice(0, -1)], (err, results)=>{
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
                sql.query("SELECT revision FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
                  if(!results[0]){
                    res.status(401).send("File not found")
                  }else{
                    const revision = results[0].revision
                    if(process.env.NODE_PROGRESS == "0"){
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
                      sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid = ?", [newFileName.split('.').slice(0, -1)], (err, results)=>{
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
                  sql.query('UPDATE misoctrls SET filename = ?, isoid = ? WHERE filename = ?', [newName, newName.split('.').slice(0, -1), oldName], (err, results)=>{
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
                        console.log("existe",origin_path)
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
    fileName = req.body.fileName
    sql.query('UPDATE misoctrls SET blocked = 0 WHERE filename = ?', [fileName],(err, results)=>{
      if(err){
        res.status(401)
      }else{
        console.log("unlocked")
        res.status(200)
      }
    })
  }

  
cron.schedule('0 0 0 * * *', () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    downloadStatus3DPeriod()
  }
  
})

cron.schedule('0 0 12 * * *', () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    downloadStatus3DPeriod()
  }
 
})

function downloadStatus3DPeriod(){
  sql.query('SELECT tag, tpipes_id, `to`, `from`, claimed, issued FROM dpipes_view RIGHT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid', (err, results) =>{
    
    let log = []
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
      log.push("/" + results[i].tag + " STM ASS /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd)
      log.push("HANDLE ANY")
      log.push("ENDHANDLE")
      status = results[i].to
      if(status == "Design" && results[i].from == "" && results[i].claimed == 0){
        status = "New"
      }else if(status == "LDE/Isocontrol" && results[i].issued == 0){
        status = "Isoctrl"
      }else if(results[i].issued == 1){
        status = "Transmittal"
      }else if(status == "On hold"){
        status = results[i].from
      }

      if(status != "Recycle bin"){
        log.push("/" + results[i].tag + " STM SET /TPI-EP-PROGRESS/PIPING/TOTAL-" + ifc_ifd + " /TL" + results[i].tpipes_id + "-" + status)
      }
    }
    log.push("\n")
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
cron.schedule('0 */1 * * * *', () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    uploadReportPeriod()
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
            sql.query('UPDATE misoctrls set before_tpipes_id = ? WHERE isoid = ?', [isoids[i].tpipes_id, isoids[i].isoid], (err, results)=>{
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
        if(csv[i].area != '' && csv[i].area != null && !csv[i].tag.includes("/") && !csv[i].tag.includes("=") && !csv[i].diameter != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [csv[i].area], (err, results) =>{
            if(!results[0]){
            }
            const areaid = results[0].id
            if(process.env.NODE_MMDN == 1){
              sql.query("SELECT id FROM diameters WHERE nps = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){
                  console.log("invalid diameter")
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
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id, diameter, calc_notes_description, pid, stress_level, insulation, unit, fluid, seq, train) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl, csv[i].diameter, csv[i].calc_notes, csv[i].pid, csv[i].stresslevel, csv[i].insulation, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].train], (err, results)=>{
                    if(err){
                      console.log(err)
                    }
                  })
                }
              })
            }else{
              sql.query("SELECT id FROM diameters WHERE dn = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){
                  console.log("invalid diameter: ", csv[i].diameter)
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
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id, diameter, calc_notes_description, pid, stress_level, insulation, unit, fluid, seq, train) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl, csv[i].diameter, csv[i].calc_notes, csv[i].pid, csv[i].stresslevel, csv[i].insulation, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].train], (err, results)=>{
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
      console.log("Dpipes updated")
      
  })
  const timeoutObj = setTimeout(() => {
    refreshProgress()
  }, 5000)
  
}


async function refreshProgress(){

  sql.query('SELECT filename, isoid, `to`, before_tpipes_id FROM misoctrls', (err, results) =>{
    if(!results[0]){
      console.log("Empty misoctrls")
    }else{
      const lines = results
      if(process.env.NODE_IFC == "0"){
        type = "value_ifd"
      }else{
        type = "value_ifc"
      }
      for(let i = 0; i < lines.length; i++){
        sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid = ?", [lines[i].isoid], (err, results)=>{
          if(!results[0]){
            console.log("No existe en dpipes ", lines[i].isoid)
          }else{
            tl = results[0].tpipes_id
            const q = "SELECT "+type+" FROM ppipes WHERE level = ? AND tpipes_id = ?"
            let level = lines[i].to
            if(level == "LDE/Isocontrol"){
                level = "Issuer"
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

const equipSteps = (req, res) =>{
  sql.query('SELECT percentage FROM pequis', (err, results)=>{
    const steps = results
    sql.query('SELECT name FROM pequis', (err, results)=>{
      const names = results
      res.json({
        steps: steps,
        names: names
      }).status(200)
    })
  })
}

const equipWeight = (req,res) =>{

  sql.query('SELECT qty, weight FROM eequis RIGHT JOIN tequis ON eequis.tequis_id = tequis.id', (err, results)=>{
    const elines = results
    let eweight = 0
    for(let i = 0; i < elines.length; i++){
      eweight += elines[i].qty * elines[i].weight
    }
    sql.query('SELECT SUM(weight) as w FROM dequis JOIN tequis ON dequis.tequis_id = tequis.id', (err, results)=>{
      if(!results[0].w){
        res.json({
          weight: eweight,
          progress: 0
        })
      }else{
        const maxweight = results[0].w
        
        sql.query('SELECT weight, percentage FROM dequis JOIN tequis ON dequis.tequis_id = tequis.id JOIN pequis ON dequis.pequis_id = pequis.id', (err, results) =>{
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

const equipTypes = (req, res) =>{
  sql.query('SELECT code, name, weight FROM tequis', (err, results)=>{
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
  sql.query('SELECT areas.`name` as area, dequis.tag as tag, tequis.`name` as type, tequis.weight as weight, pequis.`name` as status, pequis.percentage as progress FROM dequis JOIN areas ON dequis.areas_id = areas.id JOIN tequis ON dequis.tequis_id = tequis.id JOIN pequis ON dequis.pequis_id = pequis.id', (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      res.json({
        rows: results
      }).status(200)
    }
  })
}

const uploadEquisModelledReport = (req, res) =>{
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")  
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1){
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
                    
                    sql.query("INSERT INTO dequis(areas_id, tag, pequis_id, tequis_id) VALUES (?,?,?,?)", [areaid, req.body[i][tag_index], percentageid, typeid], (err, results)=>{
                      if(err){
                        console.log(err)
                      }
                    })
                    
                  }
                })       
              }
            })
          })
        }else{
          res.json({invalid: i}).status(401)
          
          return;
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

const instSteps = (req, res) =>{

  sql.query('SELECT percentage FROM pinsts', (err, results)=>{
    const steps = results
    sql.query('SELECT name FROM pinsts', (err, results)=>{
      const names = results
      res.json({
        steps: steps,
        names: names
      }).status(200)
    })
  })

}


const instEstimated = (req, res) =>{
  let rows = []
  let percentages = []
  
  sql.query('SELECT einstsfull_view.area, einstsfull_view.type_inst, einstsfull_view.qty, dinstsmodelled_view.modelled FROM einstsfull_view LEFT JOIN dinstsmodelled_view ON einstsfull_view.area = dinstsmodelled_view.area AND einstsfull_view.type_inst = dinstsmodelled_view.type_inst', (err, results1) =>{
    if(!results1[0]){
      res.status(401)
    }else{

      sql.query('SELECT percentage FROM pinsts', (err, results)=>{
        if(!results[0]){
          res.status(401)
        }else{
          for(let i = 0; i < results.length; i++){
            percentages.push(results[i].percentage)
          }
          for(let i = 0; i < results1.length; i++){
            let row = ({"area": results1[i].area, "type": results1[i].type_inst, "quantity": results1[i].qty, "modelled": results1[i].modelled})
            for(let i = 0; i < percentages.length; i++){
              row[percentages[i]] = 0
            }
            rows.push(row)
          }

          sql.query('SELECT area, type_inst, progress, count(*) as amount FROM dinstsfull_view group by area, type_inst, progress' ,(err, results)=>{
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

const instWeight = (req,res) =>{

  sql.query('SELECT qty, weight FROM einsts RIGHT JOIN tinsts ON einsts.tinsts_id = tinsts.id', (err, results)=>{
    const elines = results
    let eweight = 0
    for(let i = 0; i < elines.length; i++){
      eweight += elines[i].qty * elines[i].weight
    }
    sql.query('SELECT SUM(weight) as w FROM dinsts JOIN tinsts ON dinsts.tinsts_id = tinsts.id', (err, results)=>{
      if(!results[0].w){
        res.json({
          weight: eweight,
          progress: 0
        })
      }else{
        const maxweight = results[0].w
        
        sql.query('SELECT weight, percentage FROM dinsts JOIN tinsts ON dinsts.tinsts_id = tinsts.id JOIN pinsts ON dinsts.pinsts_id = pinsts.id', (err, results) =>{
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

const instModelled = (req, res) =>{
  sql.query('SELECT areas.`name` as area, dinsts.tag as tag, tinsts.`name` as type, tinsts.weight as weight, pinsts.`name` as status, pinsts.percentage as progress FROM dinsts JOIN areas ON dinsts.areas_id = areas.id JOIN tinsts ON dinsts.tinsts_id = tinsts.id JOIN pinsts ON dinsts.pinsts_id = pinsts.id', (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      res.json({
        rows: results
      }).status(200)
    }
  })
}

const instTypes = (req, res) =>{
  sql.query('SELECT code, name, weight FROM tinsts', (err, results)=>{
    if(!results[0]){
      res.status(401)
    }else{
      res.json({
        rows: results
      }).status(200)
    }
  })
}

const civSteps = (req,res) =>{
  sql.query('SELECT percentage FROM pcivils', (err, results)=>{
    const steps = results
    sql.query('SELECT name FROM pcivils', (err, results)=>{
      const names = results
      res.json({
        steps: steps,
        names: names
      }).status(200)
    })
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
  sql.query('SELECT code, name, weight FROM tcivils', (err, results)=>{
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

const elecSteps = (req,res) =>{
  sql.query('SELECT percentage FROM pelecs', (err, results)=>{
    const steps = results
    sql.query('SELECT name FROM pelecs', (err, results)=>{
      const names = results
      res.json({
        steps: steps,
        names: names
      }).status(200)
    })
  })
}

const elecModelled = (req, res) =>{
  sql.query('SELECT areas.`name` as area, delecs.tag as tag, telecs.`name` as type, telecs.weight as weight, pelecs.`name` as status, pelecs.percentage as progress FROM delecs JOIN areas ON delecs.areas_id = areas.id JOIN telecs ON delecs.telecs_id = telecs.id JOIN pelecs ON delecs.pelecs_id = pelecs.id', (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      res.json({
        rows: results
      }).status(200)
    }
  })
}

const elecTypes = (req, res) =>{
  sql.query('SELECT code, name, weight FROM telecs', (err, results)=>{
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
    sql.query('SELECT SUM(weight) as w FROM delecs JOIN telecs ON delecs.telecs_id = telecs.id', (err, results)=>{
      if(!results[0].w){
        res.json({
          weight: eweight,
          progress: 0
        })
      }else{
        const maxweight = results[0].w
        
        sql.query('SELECT weight, percentage FROM delecs JOIN telecs ON delecs.telecs_id = telecs.id JOIN pelecs ON delecs.pelecs_id = pelecs.id', (err, results) =>{
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

const pipingEstimated = (req, res) =>{
  sql.query('SELECT areas.name as area, tpipes.name as type, epipes.qty as quantity FROM epipes JOIN areas ON epipes.areas_id = areas.id JOIN tpipes ON epipes.tpipes_id = tpipes.id', (err, results) =>{
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

const downloadInstrumentationModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_inst, weight, status, progress FROM dinstsfull_view', (err, results) =>{
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

const downloadEquipmentModelled = (req, res) =>{
  sql.query('SELECT area, tag, type_equi, weight, status, progress FROM dequisfull_view', (err, results) =>{
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

const submitEquipTypes = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE tequis", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Code"] != null && rows[i]["Name"] != null && rows[i]["Weight"] != null){
          sql.query("INSERT INTO tequis(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitEquipSteps = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE pequis", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Name"] != null && rows[i]["Percentage"] != null){
          sql.query("INSERT INTO pequis(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitEquipEstimated = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE eequis", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Area"] != null && rows[i]["Type"] != null && rows[i]["Quantity"] != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results) =>{
            const areaid = results[0].id
              sql.query("SELECT id FROM tequis WHERE name = ?", [rows[i]["Type"]], (err, results) =>{
                if(!results[0]){
                  res.json({error: i}).status(401)
                  return;
                }else{
                  const typeid = results[0].id
                  sql.query("INSERT INTO eequis(areas_id, tequis_id, qty) VALUES(?,?,?)", [areaid, typeid, rows[i]["Quantity"]], (err, results)=>{
                    if(err){
                      console.log(err)
                      res.send({error:1}).status(401)
                    }
                  })
                }
              })
            })
        }  
      }
      res.status(200)
    }
  })

}

const submitInstTypes = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE tinsts", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Code"] != null && rows[i]["Name"] != null && rows[i]["Weight"] != null){
          sql.query("INSERT INTO tinsts(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitInstSteps = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE pinsts", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Name"] != null && rows[i]["Percentage"] != null){
          sql.query("INSERT INTO pinsts(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitInstEstimated = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE einsts", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Area"] != null && rows[i]["Type"] != null && rows[i]["Quantity"] != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results) =>{
            const areaid = results[0].id
              sql.query("SELECT id FROM tinsts WHERE name = ?", [rows[i]["Type"]], (err, results) =>{
                if(!results[0]){
                  res.json({error: i}).status(401)
                  return;
                }else{
                  const typeid = results[0].id
                  sql.query("INSERT INTO einsts(areas_id, tinsts_id, qty) VALUES(?,?,?)", [areaid, typeid, rows[i]["Quantity"]], (err, results)=>{
                    if(err){
                      console.log(err)
                      res.send({error:1}).status(401)
                    }
                  })
                }
              })
            })
        }  
      }
      res.status(200)
    }
  })

}

const submitCivilTypes = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE tcivils", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Code"] != null && rows[i]["Name"] != null && rows[i]["Weight"] != null){
          sql.query("INSERT INTO tcivils(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitCivilSteps = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE pcivils", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Name"] != null && rows[i]["Percentage"] != null){
          sql.query("INSERT INTO pcivils(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitCivilEstimated = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE ecivils", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Area"] != null && rows[i]["Type"] != null && rows[i]["Quantity"] != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results) =>{
            const areaid = results[0].id
              sql.query("SELECT id FROM tcivils WHERE name = ?", [rows[i]["Type"]], (err, results) =>{
                if(!results[0]){
                  res.json({error: i}).status(401)
                  return;
                }else{
                  const typeid = results[0].id
                  sql.query("INSERT INTO ecivils(areas_id, tcivils_id, qty) VALUES(?,?,?)", [areaid, typeid, rows[i]["Quantity"]], (err, results)=>{
                    if(err){
                      console.log(err)
                      res.send({error:1}).status(401)
                    }
                  })
                }
              })
            })
        }  
      }
      res.status(200)
    }
  })

}

const submitElecTypes = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE telecs", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Code"] != null && rows[i]["Name"] != null && rows[i]["Weight"] != null){
          sql.query("INSERT INTO telecs(code, name, weight) VALUES(?,?,?)", [rows[i]["Code"], rows[i]["Name"], rows[i]["Weight"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitElecSteps = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE pelecs", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Name"] != null && rows[i]["Percentage"] != null){
          sql.query("INSERT INTO pelecs(name, percentage) VALUES(?,?)", [rows[i]["Name"], rows[i]["Percentage"]], (err, results)=>{
            if(err){
              console.log(err)
              res.send({error:1}).status(401)
            }
          })
        }  
      }
      res.status(200)
    }
  })

}

const submitElecEstimated = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE eelecs", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Area"] != null && rows[i]["Type"] != null && rows[i]["Quantity"] != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results) =>{
            const areaid = results[0].id
              sql.query("SELECT id FROM telecs WHERE name = ?", [rows[i]["Type"]], (err, results) =>{
                if(!results[0]){
                  res.json({error: i}).status(401)
                  return;
                }else{
                  const typeid = results[0].id
                  sql.query("INSERT INTO eelecs(areas_id, telecs_id, qty) VALUES(?,?,?)", [areaid, typeid, rows[i]["Quantity"]], (err, results)=>{
                    if(err){
                      console.log(err)
                      res.send({error:1}).status(401)
                    }
                  })
                }
              })
            })
        }  
      }
      res.status(200)
    }
  })

}

const submitPipingEstimated = (req, res) =>{
  const rows = req.body.rows
  sql.query("TRUNCATE epipes", (err,results) =>{
    if(err){
      res.send({error:1}).status(401)
    }else{
      for(let i = 1; i < rows.length; i++){
        if(rows[i]["Area"] != null && rows[i]["Type"] != null && rows[i]["Quantity"] != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [rows[i]["Area"]], (err, results) =>{
            const areaid = results[0].id
              sql.query("SELECT id FROM tpipes WHERE name = ?", [rows[i]["Type"]], (err, results) =>{
                if(!results[0]){
                  res.json({error: i}).status(401)
                  return;
                }else{
                  const typeid = results[0].id
                  sql.query("INSERT INTO epipes(areas_id, tpipes_id, qty) VALUES(?,?,?)", [areaid, typeid, rows[i]["Quantity"]], (err, results)=>{
                    if(err){
                      console.log(err)
                      res.send({error:1}).status(401)
                    }
                  })
                }
              })
            })
        }  
      }
      res.status(200)
    }
  })

}

const getBom = async(req, res) =>{
  sql.query("SELECT * FROM isocontrol_modelled", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.json({rows: results}).status(200)
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
  sql.query("SELECT SUM(total_weight) as modelledWeight FROM isocontrol_modelled", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      modelledWeight = results[0].modelledWeight
      sql.query("SELECT SUM(total_weight) as notModelledWeight FROM isocontrol_not_modelled", (err, results)=>{
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
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS === "1"){
    updateHolds()
  }
})

cron.schedule("0 */30 * * * *", () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_ISOCONTROL === "1"){
    updateIsocontrolNotModelled()
    updateIsocontrolModelled()
    updateLines()
  }
})

async function updateIsocontrolNotModelled(){
    sql.query("DROP TABLE isocontrol_not_modelled", (err, results) =>{
      if(err){
        console.log(err)
      }
    })
    sql.query("CREATE TABLE isocontrol_not_modelled AS (SELECT * FROM isocontrol_not_modelled_def_view)", (err, results)=>{
      if(err){
        console.log(err)
      }else{
        console.log("isocontrol not modelled updated")
      }
    })       
}

async function updateIsocontrolModelled(){
  sql.query("DROP TABLE isocontrol_modelled", (err, results) =>{
    if(err){
      console.log(err)
    }
  })
  sql.query("CREATE TABLE isocontrol_modelled AS ( SELECT unit, area, line, train, spec_code, diameter, pid, stress_level, calc_notes, insulation, fluid, seq, total_weight FROM isocontrolfull_view)", (err, results)=>{
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
      if(!(csv[i].tag + csv[i].unit + csv[i].fluid + csv[i].seq + csv[i].spec).includes("unset")){
        sql.query("INSERT INTO `lines`(tag, unit, fluid, seq, spec_code) VALUES(?,?,?,?,?)", [csv[i].tag, csv[i].unit, csv[i].fluid, csv[i].seq, csv[i].spec], (err, results)=>{
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

const getIsocontrolFull = async(req, res)=>{
  sql.query("SELECT DISTINCT isocontrol_all_view.*, misoctrls.`to`, misoctrls.progress, isocontrol_holds_view.* FROM isocontrol_all_view LEFT JOIN misoctrls ON CONCAT(isocontrol_all_view.area, isocontrol_all_view.unit, isocontrol_all_view.fluid, isocontrol_all_view.seq, isocontrol_all_view.spec_code,'_', isocontrol_all_view.train) COLLATE utf8mb4_unicode_ci = misoctrls.isoid LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN isocontrol_holds_view ON CONCAT(isocontrol_all_view.area, isocontrol_all_view.unit, isocontrol_all_view.fluid,isocontrol_all_view.seq, isocontrol_all_view.spec_code,'_', isocontrol_all_view.train) COLLATE utf8mb4_unicode_ci = isocontrol_holds_view.isoid", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.send({rows: results}).status(200)
    }
  })
}

const isoControlGroupLineId = async(req, res) =>{
  sql.query("SELECT * FROM isocontrol_lineid_group WHERE line_id is not null", (err, results)=>{
    if(err){
      res.status(401)
    }else{
      res.send({rows: results}).status(200)
    }
  })
}

const holds = async(req, res) =>{
  sql.query("SELECT holds.*, dpipes_view.isoid, misoctrls.filename, tpipes.code, misoctrls.revision, misoctrls.updated_at, misoctrls.`from`, misoctrls.user, misoctrls.role FROM holds LEFT JOIN dpipes_view on holds.tag = dpipes_view.tag LEFT JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id", (err, results)=>{
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

  sql.query("TRUNCATE holds", (err, results) =>{
    if(err){
      console.log(err)
    }else{
      sql.query("UPDATE misoctrls SET onhold = 0, `to` = misoctrls.`from`, `from` = ? WHERE misoctrls.onhold = 1", ["On hold"])
      for(let i = 0; i < data.length; i++){    
        if(data[i].tag && data[i].hold1 && data[i].hold != ""){
          sql.query("INSERT INTO holds (tag, hold1, description1, hold2, description2, hold3, description3, hold4, description4, hold5, description5, hold6, description6, hold7, description7, hold8, description8, hold9, description9, hold10, description10) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [data[i].tag, data[i].hold1, data[i].description1, data[i].hold2, data[i].description2, data[i].hold3, data[i].description3, data[i].hold4, data[i].description4, data[i].hold5, data[i].description5, data[i].hold6, data[i].description6, data[i].hold7, data[i].description7, data[i].hold8, data[i].description8, data[i].hold9, data[i].description9, data[i].hold10, data[i].description10], (err, results)=>{
            if(err){
              console.log(err)
            }else{
              if(data[i].hold1){
                sql.query("UPDATE misoctrls JOIN dpipes_view ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid SET misoctrls.onhold = 1, misoctrls.`from` = misoctrls.`to`, misoctrls.`to` = ? WHERE dpipes_view.tag = ?", ["On hold", data[i].tag], (err, results)=>{                  
                  if(err){
                    console.log(err)
                  }
                })
              }
            }
          })
          
          
        }      
        
      }
      console.log("Holds updated")
    }
  })

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
  sql.query("SELECT spec_ldl as line_id, unit, area, line, train, fluid, seq, unit as iso_id, spec_code, diameter, pid, stress_level, isocontrol_all_view.calc_notes, insulation, total_weight, diameter as modelled, misoctrls.`to`, misoctrls.progress, holds.hold1, LDL, BOM FROM isocontrol_all_view LEFT JOIN misoctrls ON CONCAT(isocontrol_all_view.area, isocontrol_all_view.unit, isocontrol_all_view.fluid, isocontrol_all_view.seq, isocontrol_all_view.spec_code,'_', isocontrol_all_view.train) COLLATE utf8mb4_unicode_ci = misoctrls.isoid LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN holds ON dpipes_view.tag COLLATE utf8mb4_unicode_ci = holds.tag", (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      let rows = results
      for(let i = 0; i < rows.length; i++){

        if(rows[i].line_id === null){
            rows[i].modelled = "Not modelled"
        }else{
            rows[i].modelled = "Modelled"
        }

        rows[i].line_id = rows[i].unit + rows[i].line
        rows[i].iso_id = rows[i].unit + rows[i].area + rows[i].line + rows[i].train

        if(rows[i].LDL === "In LDL" && rows[i].BOM === "Not in BOM"){
            rows[i].line_id = rows[i].LDL_unit + rows[i].fluid + rows[i].seq
            rows[i].iso_id = " "

            rows[i].unit = rows[i].LDL_unit
            rows[i].line = rows[i].fluid + rows[i].seq
            rows[i].spec_code = rows[i].spec_code_ldl
        }else{
            rows[i].line_id = rows[i].unit + rows[i].line
            rows[i].iso_id = rows[i].unit + rows[i].area + rows[i].line + rows[i].train

            rows[i].unit = rows[i].unit
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

        if(rows[i].hold1 && rows[i].hold != ""){
          rows[i].hold1 = "Yes"
        }else{
          rows[i].hold1 = "No"
        }

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
    console.log(results)
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
  downloadHistory,
  downloadStatus,
  downloadPI,
  downloadIssued,
  downloadStatus3D,
  downloadModelled,
  uploadReport,
  uploadReportPeriod,
  checkPipe,
  currentProgress,
  getMaxProgress,
  currentProgressISO,
  toIssue,
  request,
  newRev,
  rename,
  unlock,
  equipEstimated,
  equipSteps,
  equipWeight,
  equipTypes,
  equipModelled,
  uploadEquisModelledReport,
  uploadEquisEstimatedReport,
  instEstimated,
  instSteps,
  instWeight,
  instModelled,
  instTypes,
  civSteps,
  civEstimated,
  civModelled,
  civTypes,
  civWeight,
  elecEstimated,
  elecSteps,
  elecModelled,
  elecTypes,
  elecWeight,
  uploadInstModelledReport,
  uploadInstEstimatedReport,
  uploadCivModelledReport,
  uploadCivEstimatedReport,
  uploadElecModelledReport,
  uploadElecEstimatedReport,
  uploadPipesEstimatedReport,
  pipingEstimated,
  pipingTypes,
  downloadInstrumentationModelled,
  downloadEquipmentModelled,
  downloadCivilModelled,
  downloadElectricalModelled,
  navis,
  submitEquipTypes,
  submitEquipSteps,
  submitEquipEstimated,
  submitInstTypes,
  submitInstSteps,
  submitInstEstimated,
  submitCivilTypes,
  submitCivilSteps,
  submitCivilEstimated,
  submitElecTypes,
  submitElecSteps,
  submitElecEstimated,
  submitPipingEstimated,
  getBom,
  updateBom,
  getNotModelled,
  isocontrolWeights,
  exportModelled,
  exportNotModelled,
  getIsocontrolFull,
  holds,
  lastUser,
  uploadNotifications,
  isoControlGroupLineId,
  exportFull,
  exportLineIdGroup,
  exportHolds,
  exportHoldsNoProgress,
  downloadBOM,
  getPids
};