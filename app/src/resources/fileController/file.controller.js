const uploadFile = require("../fileMiddleware/file.middleware");
const fs = require("fs");
const bodyParser = require('body-parser')
const sql = require("../../db.js");
const pathPackage = require("path")
var format = require('date-format');
var cron = require('node-cron');
const csv=require('csvtojson')

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
  console.log("Empieza el uploadhis de  " , req.body.fileName)
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
          if(process.env.REACT_APP_PROGRESS == "1"){
            let type = ""
            if(process.env.REACT_APP_IFC == "0"){
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
                    console.log(results[0])
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
            sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
            [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, " ","Design", "Uploaded", username, "Design", null], (err, results) => {
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
            console.log(last, req.body.role)
    
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
  })
}

const statusFiles = (req,res) =>{
  sql.query('SELECT * FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid', (err, results) =>{
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
  sql.query('SELECT `from`,id FROM hisoctrls WHERE filename = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, "Process"], (err, results) =>{
    if(!results[0]){
      prev = 0
    }else if(results[0].from == "Accepted Proc"){
      prev = 2
    }else{
      prev = 3
    }
    console.log(results)
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
    }else{
      prev = 3
    }
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
  sql.query("SELECT deleted, onhold, issued, `from` FROM misoctrls", (err, results)=>{
    const delhold = results
    sql.query("SELECT isoid, created_at, updated_at, revision, `to` FROM misoctrls", (err, results) =>{
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

          results[i].to = results[i].to.toUpperCase()

          results[i].created_at = format(pattern, results[i].created_at)
          results[i].updated_at = format(pattern, results[i].updated_at)
        }
        
        res.json(JSON.stringify(results)).status(200)
      }
    })
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
      sql.query("SELECT isoid, revision, issued, updated_at FROM misoctrls", (err, results) =>{
        if(!results[0]){
          res.status(401).send("El historial esta vacio")
        }else{
          const pattern = "MM/dd/yyyy hh:mm:ss";
          let isos_index = []
          let isos = []
          for(let i = 0; i < results.length; i++){

            if(isos_index.includes(results[i].isoid)){
              index = isos_index.indexOf(results[i].isoid)
              console.log("ya existe")
            }else{
              isos_index.push(results[i].isoid)
              isos.push({isoid: results[i].isoid, rev0: "", rev1: "", rev2: "", rev3: "", rev4: ""})
              index = isos.length-1
            }

            if(results[i].revision == 1){
              if(results[i].issued == 1){
                isos[index].rev0 = format(pattern, results[i].updated_at)
              }
            }
            if(results[i].revision == 2){
              if(results[i].issued == 1){
                isos[index].rev1 = format(pattern, results[i].updated_at)
              }
            }
            if(results[i].revision == 3){
              if(results[i].issued == 1){
                isos[index].rev2 = format(pattern, results[i].updated_at)
              }
            }
            if(results[i].revision == 4){
              if(results[i].issued == 1){
                isos[index].rev3 = format(pattern, results[i].updated_at)
              }
            }
            if(results[i].revision == 5){
              if(results[i].issued == 1){
                isos[index].rev4 = format(pattern, results[i].updated_at)
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
    if(process.env.REACT_APP_IFC == 0){
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
      if(req.body[i] != '' && req.body[i][0] != null && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{
          const areaid = results[0].id
          if(process.env.REACT_APP_MMDN == 0){
            sql.query("SELECT id FROM diameters WHERE dn = ?", [req.body[i][diameter_index]], (err, results) =>{
              if(!results[0]){
                res.status(401).send({invalid: "Invaid diameter in some lines"})
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

}

const checkPipe = async(req,res) =>{
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
  const fileName = req.params.fileName.split('.').slice(0, -1)
  console.log("Se comprueba si existe ", fileName)
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
              console.log(progress , realprogress)
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

  sql.query('SELECT * FROM dpipes_view WHERE isoid = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
    if(!results[0]){
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
                                sql.query("SELECT tpipes_id FROM dpipes_view WHERE isoid = ?", [fileName.split('.').slice(0, -1)], (err, results)=>{
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
                                          sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, user = ?, role = ?, progress = ?, realprogress = ?, transmittal = ?, issued_date = ?, max_tray WHERE filename = ?", [revision + 1, "None", null, newprogress, newprogress, transmittal, date, "Transmittal",newFileName], (err, results)=>{
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
  console.log(fileName)
  sql.query('SELECT * FROM dpipes_view WHERE isoid = ?', [fileName.split('-').slice(0, -1)], (err, results)=>{
    if(!results[0]){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
      })
    }else{
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
                                  res.status(200).send({revision: "newRev"})
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
  downloadStatus3DPeriod()
})

cron.schedule('0 0 12 * * *', () => {
  downloadStatus3DPeriod()
})

function downloadStatus3DPeriod(){
  sql.query('SELECT tag, tpipes_id, `to`, `from`, claimed, issued FROM dpipes_view RIGHT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid', (err, results) =>{
    
    let log = []
    let ifc_ifd = ""
    let status = ""
    if(process.env.REACT_APP_IFC == 0){
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
      console.log('downloaded');
      fs.copyFile('./fromIsoTrackerTo3d.mac', process.env.NODE_STATUS_ROUTE, (err) => {
        if (err) throw err;
      });
    });

  })
  console.log("Generated 3d report")
}
cron.schedule('0 */5 * * * *', () => {
  uploadReportPeriod()
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
      for(let i = 1; i < csv.length; i++){
        if(csv[i].area != '' && csv[i].area != null && !csv[i].tag.includes("/") && !csv[i].tag.includes("=") && !csv[i].diameter != null){
          sql.query("SELECT id FROM areas WHERE name = ?", [csv[i].area], (err, results) =>{
            if(!results[0]){
              console.log(csv[i].area)
            }
            const areaid = results[0].id
            if(process.env.REACT_APP_MMDN == 0){
              sql.query("SELECT id FROM diameters WHERE dn = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){
                  console.log("indalid diameter: ", csv[i].diameter)
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
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id) VALUES (?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl], (err, results)=>{
                    if(err){
                      console.log(err)
                    }
                  })
                }
              })
            }else{
              sql.query("SELECT id FROM diameters WHERE nps = ?", [csv[i].diameter], (err, results) =>{
                if(!results[0]){
                  console.log("indalid diameter: ", csv[i].diameter)
                }else{
                  const diameterid = results[0].id
                  let calc_notes = 0
                  if(csv[i].calc_notes != null){
                    calc_notes = 1
                    
                  }
      
                  let tl = 0
      
                  if(calc_notes == 0){
                    tl = 3
                  }else{
                    if(csv[i].diameter < 2.00){
                      tl = 1
                    }else{
                      tl = 2
                    }
                  }
                  sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id) VALUES (?,?,?,?,?)", [areaid, csv[i].tag, diameterid, calc_notes, tl], (err, results)=>{
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
      if(process.env.REACT_APP_IFC == "0"){
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
  console.log("updaed progress" );
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
  unlock
};