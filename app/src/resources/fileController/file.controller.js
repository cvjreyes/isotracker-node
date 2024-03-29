const uploadFile = require("../fileMiddleware/file.middleware");
const uploadBom = require("../fileMiddleware/bom.middleware");
const fs = require("fs");
const sql = require("../../db.js");
var format = require('date-format');
var cron = require('node-cron');
const csv=require('csvtojson')
const readXlsxFile = require('read-excel-file/node');
const nodemailer = require("nodemailer");
const { Console } = require("console");

const upload = async (req, res) => {
  try {
    await uploadFile.uploadFileMiddleware(req, res); //Envia el archivo al middleware

    if (req.file == undefined || req.file.originalname.split('.').length > 2) {
      return res.status(400).send({ message: "Please upload a file!" }); //Si se ha hecho un upload vacio
    }
    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname, //Se ha subido correctamente
    });

    //esta parte ya no se usa(creo)
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
    await uploadFile.updateFileMiddleware(req, res);//Se envia el archivo al middleware

    if (req.file == undefined) {
      console.log("undef")
      return res.status(401).send({ message: "Please upload a file!" }); //No se envia archivo
    }

    var extension = "";
    var cl = false;
    var i = req.file.originalname.lastIndexOf('.');
    if (i > 0) {
      extension = req.file.originalname.substring(i+1);
      if (req.file.originalname.substring(i-2) == 'CL.pdf'){ //Se comprueba si el archivo subido es el clean de la iso (acaba en -CL)
        cl = true
      }
    }
    if(extension == 'pdf' && !cl){ //Si es un pdf pero no es el clean(por lo tanto es el master)

      const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
      for(let i = 0; i < folders.length; i++){//Buscas donde esta el master en el storage
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

      if (!fs.existsSync(where +'/bak/')){ //Se guarda el anteior master en el bak
        fs.mkdirSync(where +'/bak/');
      }
      
      //Se guarda el nuevo master
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
  if(process.env.NODE_PROGRESS === "1"){ //Si el proyecto va con progreso los datos de las isos se sacan de misoctrls y dpipes
    sql.query('SELECT misoctrls.*, dpipes_view.*, tpipes.`name`, tpipes.weight, tpipes.`code` FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id WHERE misoctrls.`to` = ? AND (onhold != 1 || onhold IS NULL)', [tab], (err, results) =>{
      
      res.json({
        rows: results
      })
    
  })
  }else{ //Si no se saca solo de misoctrls
    if(tab === "On hold"){//Si el ususario esta en la tabla de holds se devuelve solo las holds
      sql.query('SELECT * FROM misoctrls WHERE onhold = 1', [tab], (err, results) =>{
      
        res.json({
          rows: results
        })
      
      })
      
    }else{//Si esta en cualquier otra bandeja se devuevlen todas las isos que no estan en holds
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

const piStatus = (req, res) =>{ //Se obtiene el status de procesos e instrumentacion
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

const download = (req, res) => { //Descarga de todos los archivos correspondientes a una iso
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
  sql.query("SELECT issued, transmittal, issued_date FROM misoctrls WHERE filename = ?", master, (err, results)=>{//Seleccionas el transmittal y fecha de emision para acceder a esa carpeta en el storage en caso de estar emitida
    if(!results[0]){
      res.status(401)
    }else{
      if(results[0].issued != 1){ //Si no esta emitida
        const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
        './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/attach', './app/storage/isoctrl/issuer/attach', './app/storage/isoctrl/lde/attach', 
        './app/storage/isoctrl/materials/attach', './app/storage/isoctrl/stress/attach','./app/storage/isoctrl/supports/attach','./app/storage/isoctrl/design/TRASH', './app/storage/isoctrl/issuer/TRASH', './app/storage/isoctrl/lde/TRASH', 
        './app/storage/isoctrl/materials/TRASH', './app/storage/isoctrl/stress/TRASH','./app/storage/isoctrl/supports/TRASH','./app/storage/isoctrl/design/TRASH/tattach', './app/storage/isoctrl/issuer/TRASH/tattach', './app/storage/isoctrl/lde/TRASH/tattach', 
        './app/storage/isoctrl/materials/TRASH/tattach', './app/storage/isoctrl/stress/TRASH/tattach','./app/storage/isoctrl/supports/TRASH/tattach', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', 
        './app/storage/isoctrl/materials/HOLD', './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD','./app/storage/isoctrl/design/HOLD/hattach', './app/storage/isoctrl/issuer/HOLD/hattach', './app/storage/isoctrl/lde/HOLD/hattach', 
        './app/storage/isoctrl/materials/HOLD/hattach', './app/storage/isoctrl/stress/HOLD/hattach','./app/storage/isoctrl/supports/HOLD/hattach'];

        for(let i = 0; i < folders.length; i++){//Buscas los archivos en el storage
          path = folders[i] + '/' + req.params.fileName
          if (fs.existsSync(path)) {
            exists = true;
            where = folders[i]
          }
        }
        res.download(where + '/' + fileName, fileName, (err) => {//Los descargas
          if (err) {
            res.status(500).send({
              message: "Could not download the file. " + err,
            });
          }else{
            res.status(200)
          }
        });
      }else{ //Si esta emitida
        const trn = results[0].transmittal
        const date = results[0].issued_date
        res.download('./app/storage/isoctrl/lde/transmittals/' + trn + '/' + date + '/' + fileName, fileName, (err) => { //Descargas todos los archivos que haya en el transmittal correspondiente
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
    if(!results[0].transmittal){//Si no esta emitida
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

      if(where.includes("TRASH")){//Sacas los paths de todos los archivos que hay en el storage
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


      fs.readdir(origin_attach_path, (err, files) => { //Guardas los filenames de los archivos
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
        
        res.status(200).json(allFiles) //Devuelve los nombres
      });
    }else{//Si esta emitida
      folders = ['./app/storage/isoctrl/lde/transmittals/' + results[0].transmittal + "/" + results[0].issued_date];
  
      for(let i = 0; i < folders.length; i++){ //Sacas los archivos que hay en el transmittal
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

      fs.readdir(origin_attach_path, (err, files) => { //Obtienes los filenames
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
        
        res.status(200).json(allFiles)//Los devuelves
      });
    }
  })
  

  
}

const uploadHis = async (req, res) => {
  var username = "";
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Coges los datos el usuario que ha hecho el upload
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name //Guardas el nombre
      sql.query("INSERT INTO hisoctrls (filename, revision, claimed, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, 0, 1, 0, 0, "Design","Design", "Uploaded", username, "Design"], (err, results) => { //Guardas en el historial los datos de la transaccion
        if (err) {
          console.log("error: ", err);
          res.status(401)
        }else{ 
          if(process.env.NODE_PROGRESS == "1"){//Si el proyecto tiene progreso
            let type = ""

            //A partir de aqui obtienes cual es el progreso actual de la iso en funcion el tipo de proyecto (IDF/IFC) y el tipo de linea (TL1, TL2, TL3) 
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
                sql.query(q, ["Design", tl], (err, results)=>{
                  if(!results[0]){
                    res.status(401)
                  }else{
                    let progress = null
                    //Obtienes el progreso
                    if(type == "value_ifc"){
                      progress = results[0].value_ifc
                    }else{
                      progress = results[0].value_ifd
                    }
                    //Guardas los datos en misoctrls
                    sql.query("INSERT INTO misoctrls (filename, isoid, revision, claimed, spo, sit, `from`, `to`, comments, user, role, progress, realprogress, max_tray) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 1, 0, 0, " ","Design", "Uploaded", username, "Design", progress, progress, "Design"], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                        res.status(401)
                      }else{
                        res.status(200).send("created misoctrls")
                      }
                    });
                    
                  }
                })
              }
            })
          }else{//Si el proyecto no tiene progreso guardas los datos en misoctrls directamete ya que el progreso no importa
            sql.query("INSERT INTO misoctrls (filename, isoid, revision, claimed, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 1, 0, 0, " ","Design", "Uploaded", username, "Design", null], (err, results) => {
              if (err) {
                console.log("error: ", err);
                res.status(401)
              }else{
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
          [fileName, last.revision, last.spo, last.sit, "Updated", last.from, "Updated", username, req.body.role], (err, results) => { //Actualizas el historial con la informacion de la transaccion
            if (err) {
              console.log("error: ", err);
              res.send({success:1}).status(200)
            }else{
              res.send({success:1}).status(200)
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
  for(let i = 0; i < folders.length; i++){ //Buscas el master de la iso requerida y lo descargas 
    let path = folders[i] + '/' + fileName;
    if (fs.existsSync(path)) {
      var file = fs.createReadStream(path);
      file.pipe(res);
    }
  }

}


const updateStatus = async(req,res) =>{
  //Contadores para cada bandeja en cada revision
  let designR0 = 0, designR1 = 0, designR2 = 0, designHold = 0, designDeleted = 0, designStock = 0, stressR0 = 0, stressR1 = 0, stressR2 = 0, stressHold = 0, stressDeleted = 0, stressStock = 0, supportsR0 = 0, supportsR1 = 0, supportsR2 = 0, supportsHold = 0, supportsDeleted = 0, supportsStock = 0, materialsR0 = 0, materialsR1 = 0, materialsR2 = 0, materialsHold = 0, materialsDeleted = 0, materialsStock = 0, issuerR0 = 0, issuerR1 = 0, issuerR2 = 0, issuerHold = 0, issuerDeleted = 0, issuerStock = 0, toIssueR0 = 0, toIssueR1 = 0, toIssueR2 = 0, toIssueHold = 0, toIssueDeleted = 0, toIssueStock = 0, issuedR0 = 0, issuedR1 = 0, issuedR2 = 0, issuedDeleted = 0, issuedStock = 0, totalR0 = 0, totalR1 = 0, totalR2 = 0, totalHold = 0, totalDeleted = 0, totalStock = 0, modelCount = 0
  //Obtenemos la bandeja en la que esta cada iso, si esta emitida para r0
  sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE (revision = 0 OR revision = 1) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{ 
    if(!results[0]){
      results = []
    }
      //Recuento por bandeja
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
      //Obtenemos la bandeja en la que esta cada iso, si esta emitida para r1
      sql.query("SELECT `to`,issued, revision FROM misoctrls WHERE (revision = 1 OR revision = 2) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{
        if(!results[0]){
          results = []
        }
          for(let i = 0; i < results.length; i++){//Recuento por bandeja
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
    
          //Obtenemos la bandeja en la que esta cada iso, si esta emitida para r2
          sql.query("SELECT `to`, issued, revision FROM misoctrls WHERE (revision = 2 OR revision = 3) AND (onhold != 1 || onhold IS NULL)", (err, results) =>{
            if(!results[0]){
              results = []
            }
              //Recuento por bandeja
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
              //Obtenemos las isos en hold
              sql.query("SELECT `from` FROM misoctrls WHERE onhold = 1", (err, results) =>{
                if(!results[0]){
                  results = []
                }
                  for(let i = 0; i < results.length; i++){
                    if(results[i].from == "Design"){
                      designHold += 1
                    }else if(results[i].from == "Stress" || results[i].to == "stress"){
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
                      let q
                      //Las isos con un diametro inferior al umbral no cuentan
                      if(process.env.NODE_PROGRESS_DIAMETER_FILTER){
                        q = "SELECT COUNT(dpipes.id) as totalC FROM dpipes JOIN diameters ON dpipes.diameter_id = diameters.id WHERE dn " + process.env.NODE_PROGRESS_DIAMETER_FILTER
                      }else{
                        q = "SELECT COUNT(id) as totalC FROM dpipes"
                      }
                      sql.query(q, (err, results) =>{
                        if(!results[0]){
                          results = []
                        }
                          modelCount = results[0]["totalC"]

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
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{//Cogemos el usuario
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name //Guardamos el nombre
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{ //Cogemos la iso a restaurar
      if(!results[0]){
          res.status(401).send("No files found");
      }else if((results[0].deleted == 0 || results[0].deleted == null) && (results[0].onhold == 0 || results[0].onhold == null)){   
        res.status(401).send("This isometric has already been restored!");
      }else{
          let destiny = results[0].from
          let origin = results[0].to
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, results[0].revision, results[0].spo, results[0].sit, 0, 0, origin, destiny, "Restored", username, role], (err, results) => { //Guardamos la transaccion en el hisorial
            if (err) {
              console.log("error: ", err);
            }else{
              sql.query("UPDATE misoctrls SET deleted = 0, onhold = 0, `from` = ?, `to` = ?, `comments` = ?, role = ? WHERE filename = ?", 
              [origin, destiny, "Restored", role, fileName], (err, results) => { //Devolvemos la iso a la bandeja original desde donde se elimino
                if (err) {
                  console.log("error: ", err);
                }else{
                  if(destiny == "LDE/Isocontrol"){
                    destiny = "lde"
                  }
                  
                  //Movemos los archivos del storage de vuelta a la bandeja
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

                    if(fs.existsSync(origin_proc_path)){
                      fs.rename(origin_proc_path, destiny_proc_path, function (err) {
                          if (err) throw err
                      })
                  }

                  if(fs.existsSync(origin_inst_path)){
                      fs.rename(origin_inst_path, destiny_inst_path, function (err) {
                          if (err) throw err
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
  if(process.env.NODE_PROGRESS == "1"){ //Si el proyecto tiene progreso
    //Leemos los datos de misoctls y dpipes
    sql.query('SELECT * FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid JOIN tpipes ON tpipes.id = dpipes_view.tpipes_id', (err, results) =>{
      if(!results[0]){
        console.log("No files found");
        res.status(200).send({
          rows : results
        })
      }else{
        for(let i = 0; i < results.length; i++){
          //Ajustes de los nombres de las bandejas en funcion de si estan en los lideres o no
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
          //recuento de holds
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
    sql.query('SELECT * FROM misoctrls', (err, results) =>{ //Cogemos las isos de misoctrls
      if(!results[0]){
        console.log("No files found");
        res.status(200).send({
          rows : results
        })
      }else{

        for(let i = 0; i < results.length; i++){
          //Ajustes de los nombres de las bandejas en funcion de si estan en los lideres o no
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
  sql.query('SELECT * FROM hisoctrls ORDER BY created_at DESC', (err, results) =>{ //Get del historial ordenado por tiempo
    if(!results[0]){
      res.status(401).send("No files found");
    }else{
      res.status(200).send({
        rows : results
      })
    }
  })
}

const modelled = (req,res) =>{ //Select de todas las modeladas
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
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Cogemos el usuario que ha hecho la transaccion
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      let spoclaimed = 0
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', fileName, (err, results) =>{ //Cogemos la iso
        if(err){
          res.status(401).send("No files found")
        }else{
          let file = results[0]
          let prevProcess = file.spo
          let nextProcess = 0
          let from = file.to
          let to = "Process"
          //Establecemos el siguiente estado
          if (action === "accept"){//
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
          //Guardamos la transaccion en el historial
          sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, file.revision, nextProcess, file.sit, file.deleted, file.onhold, spoclaimed, from, to, "Process", req.body.role, username], (err, results) => {
            if (err) {
              console.log("error: ", err);
            }else{
              //Aplicamos los cambios a la iso
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

const instrument = (req,res) =>{ //Lo mismo que toProcess pero con instruments
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
  sql.query('SELECT `from`,`to`, id, user, role FROM hisoctrls WHERE filename = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, "Process"], (err, results) =>{ //Obtenemos el estado actual de la peticion a procesos
    if(!results[0]){
      prev = 0
    }else if(results[0].from == "Denied Proc"){
      prev = 3
    }else{
      prev = 0
    }
    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Cogemos el usuario
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
    
        sql.query("INSERT INTO hisoctrls (filename, spo, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?)",
        [fileName, prev, "Cancelled PRO", "Process", "Cancelled PRO", req.body.role, username], (err, results)=>{ //Guardamos la transaccion en el historial
          if(err){
            res.status(401)
          }
        })
      }
    })
    
    sql.query('UPDATE misoctrls SET spo = ? WHERE filename = ?', [prev, fileName], (err, results) =>{ //Actualizamos los datos de misoctrls
      if(err){
        res.status(401)
      }else{
        res.status(200).send("cancelado proc")
      }
    })
  })
}

const cancelInst = (req,res) =>{ //Lo mismo que cancelProc pero con instrumentos
  const fileName = req.body.file
  let prev = 0
  sql.query('SELECT `from` FROM hisoctrls WHERE filename = ? AND role = ? ORDER BY id DESC LIMIT 1', [fileName, "Instrument"], (err, results) =>{
    if(!results[0]){
      prev = 0
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
  if(type == "Process"){//Cogemos todas las isos en procesos
    sql.query('SELECT * FROM misoctrls WHERE spo = 1 OR spo = 4 or spo = 5', (err, results) =>{
      if(err){
        res.status(401).send("No files found")
      }else{
        res.status(200).send({
          rows : results
        })
      }
    })
  }else{//Cogemos todas las isos en instrumentacion
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

  await uploadFile.uploadFileProcMiddleware(req, res); //Se envia el archivo al middleware
  if (req.file == undefined) {
    return res.status(400).send({ message: "Please upload a file!" }); //Si no hay archivo da error
  }else{
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
      './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
      for(let i = 0; i < folders.length; i++){ //Se obtiene el path del archivo original
        const path = folders[i] + '/' + req.file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
      if(where.includes("HOLD")){ //Si estaba en hold se reemplaza en la carpeta hold
        fs.rename(where + '/hattach/' + req.file.originalname, where + '/hattach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-PROC.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }else{ //Si no esta en hold se reemplaza en la carpeta correspondiente
        fs.rename(where + '/attach/' + req.file.originalname, where + '/attach/' +  req.file.originalname.split('.').slice(0, -1).join('.') + '-PROC.pdf', function(err) {
          if ( err ) console.log('ERROR: ' + err);
        });
      }
    res.status(200).send("File uploaded")
  }

}

const uploadInst = async(req, res) =>{ //Lo mismo que uploadProc pero con instrumentos
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

  //Indices de los atributos dentro del csv de dpipes para acceder a ellos mas tarde
  const area_index = req.body[0].indexOf("area")
  const tag_index = req.body[0].indexOf("tag")
  const diameter_index = req.body[0].indexOf("diameter")
  const calc_index = req.body[0].indexOf("calc_notes")
 
  if(area_index == -1 || tag_index == -1 || diameter_index == -1 || calc_index == -1){ //Si en alguna de las lineas faltan datos
    console.log("error",area_index,tag_index,diameter_index,calc_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE dpipes", (err, results)=>{ //Se elimina la informacion de dpipes
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){ //Por cada fila del csv
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{ //Obtenemos el id del area a partir del nombre
          let areaid = null
          if(results[0]){
            areaid = results[0].id
          }
          if(process.env.NODE_MMDN == 1){ //Si el proyecto esta en pulgadas
            sql.query("SELECT id FROM diameters WHERE nps = ?", [req.body[i][diameter_index]], (err, results) =>{ //Obtenemos el id del diametro a partir del valor
              if(!results[0]){
                console.log("ivalid diameter")
              }else{
                const diameterid = results[0].id
                let calc_notes = 0
                if(req.body[i][calc_index] != "" && req.body[i][calc_index] != null){
                  calc_notes = 1
                }
    
                let tl = 0
                //Obtenemos el tipo de linea en funcion del CN y del diametro
                if(calc_notes == 1){
                  tl = 3
                }else{
                  if(req.body[i][diameter_index] < 50){
                    tl = 1
                  }else{
                    tl = 2
                  }
                }

                //Insertamos la linea en dpipes
                sql.query("INSERT INTO dpipes(area_id, tag, diameter_id, calc_notes, tpipes_id) VALUES (?,?,?,?,?)", [areaid, req.body[i][tag_index], diameterid, calc_notes, tl], (err, results)=>{
                  if(err){
                    console.log(err)
                  }
                })
              }
            })
          }else{ //Si el proyecto esta en milimetros
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
                //Obtenemos el tipo de linea en funcion del CN y del diametro
                if(calc_notes == 0){
                  tl = 3
                }else{
                  if(req.body[i][diameter_index] < 2.00){
                    tl = 1
                  }else{
                    tl = 2
                  }
                }
                //Insertamos la linea en dpipes
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
  sql.query("SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?", [fileName], (err, results) =>{ //Comprobamos si la linea esta en dpipes
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

const toIssue = async(req,res) =>{
  const fileName = req.body.file
  const transmittal = req.body.transmittal
  const date = req.body.date
  const user = req.body.user
  const role = req.body.role


  sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{ //Comprobamos que la linea es correcta
    if(!results[0] && process.env.NODE_PROGRESS == "1"){
      sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
        res.status(200).send({blocked:"1"})
        
      })
    }else{
      sql.query("SELECT isoid, revision FROM misoctrls WHERE filename = ?", [fileName], (err, results)=>{ //Cogemos los datos de la linea
        if(!results[0]){
          res.status(401).send("File not found")
        }else{
          const revision = results[0].revision
          const newFileName = fileName.split('.').slice(0, -1).join('.') + '-' + revision + '.pdf'
          const isoid = results[0].isoid
          let masterName, origin_path, destiny_path, origin_attach_path, destiny_attach_path, origin_cl_path, destiny_cl_path
    
          //Si el transmittal con esa fecha no existe se crea
          if (!fs.existsSync('./app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date)){
            fs.mkdirSync('./app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date);
          }
    
          masterName = fileName.split('.').slice(0, -1) 
    
          //Paths de los posibles archivos
          origin_path = './app/storage/isoctrl/lde/' + fileName
          destiny_path = './app/storage/isoctrl/lde/' + newFileName
          origin_attach_path = './app/storage/isoctrl/lde/attach/'
          destiny_attach_path = './app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date +'/'
          origin_cl_path = './app/storage/isoctrl/lde/attach/' + fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
          destiny_cl_path = './app/storage/isoctrl/lde/transmittals/' + transmittal + '/' + date + '/' + newFileName
    
          fs.rename(origin_path, destiny_path, function (err) {
            if (err) throw err
          })
    
          fs.readdir(origin_attach_path, (err, files) => { //Buscamos los adjuntos y los movemos al transmittal
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
    
        if(fs.existsSync(origin_cl_path)){ //Movemos el clean al transmittal
            fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                if (err) throw err
                console.log('Moved CL to transmittal')
            })
        }
    
    
    
          sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{ //Cogemos el usuario
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
                    //Guardamos la transaccion en el historial
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, issued, transmittal, issued_date, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, revision, last.spo, last.sit, 1, transmittal, date, last.deleted, last.onhold, last.spoclaimed, "LDE/IsoControl", "Issued", "Issued", role, username], (err, results) => {
                      if (err) {
                        console.log("error: ", err);
                      }else{
                        sql.query("UPDATE misoctrls SET filename = ?  WHERE filename = ?", [newFileName, fileName], (err, results)=>{
                          if (err) {
                            console.log("error: ", err);
                          }else{
                            if(process.env.NODE_PROGRESS == "0"){//Si el proyecto no tiene progreso
                              //Actualizamos misoctrls con la emsision
                              sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, transmittal = ?, issued_date = ?, user = ?, role = ? WHERE filename = ?", [revision + 1, transmittal, date, "None", null, newFileName], (err, results)=>{
                                if (err) {
                                  console.log("error: ", err);
                                }else{
                                  res.status(200).send({issued: "issued"})
                                }
                              })
                            }else{//Si tiene progeso
                                //Obtenemos el progreso de la iso que se va a emitir
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
                                          //Actualizamos misoctrls con la emision
                                          sql.query("UPDATE misoctrls SET revision = ?, claimed = 0, issued = 1, user = ?, role = ?, progress = ?, realprogress = ?, transmittal = ?, issued_date = ?, max_tray = ? WHERE filename = ?", [revision + 1, "None", null, newprogress, newprogress, transmittal, date, "Transmittal",newFileName], (err, results)=>{
                                            if (err) {
                                              console.log("error: ", err);
                                            }else{
                                              //Cerramos lo bypass de la iso 
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

  sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{ //Cogemos el usuario
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{ //Cogemos los datos de la iso
        if(!results[0]){
            res.status(401).send("No files found");
        }else{
            let last = results[0]
            for (let i = 1; i < results.length; i++){
                if(results[i].updated_at > last.updated_at){
                    last = results[i]
                }
            }

            //Guardamos la transaccion en el historico
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, deleted, onhold, spoclaimed, `from`, `to`, comments, role, user) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, last.revision, last.spo, last.sit, last.deleted, last.onhold, last.spoclaimed, "LDE/IsoControl", "Requested", "Requested", role, username], (err, results) => {
              if (err) {
                console.log("error: ", err);
              }else{
                
                sql.query("SELECT requested FROM misoctrls WHERE filename = ?", [fileName], (err, results)=>{//Comprobamos que la request sobre esa iso no existia 
                  if(results[0].requested !== null){
                    res.status(401).send("Isometric already requested")
                  }else{
                    sql.query("UPDATE misoctrls SET requested = 1  WHERE filename = ?", [fileName], (err, results)=>{//Actualizamos la iso con la request
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
      sql.query("SELECT requested FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{ //Comprobamso que no exisita ya una nueva revision
        if(!results[0]){
          res.status(401).send("file not found")
        }else{
          if(results[0].requested == 2){
            res.status(401).send({already: "Already sent for revision"})
          }else{
            fs.copyFile(origin_path, destiny_path, (err) => { //Copiamos el master de la bandela LOS a diseño para empezar la nueva revision
              if (err) throw err;
            });
            sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Cogemos el usuario
              if (!results[0]){
                res.status(401).send("Username or password incorrect");
              }else{   
                username  = results[0].name
                sql.query("SELECT id, revision FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{ //Cogemos la revision actual
                  if(!results[0]){
                    res.status(401).send("File not found")
                  }else{
                    const iso_id = results[0].id
                    const revision = results[0].revision
                    if(process.env.NODE_PROGRESS == "0"){ //Si no hay progreso
                      sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
                      [newFileName, revision+1, 0, 0, "Issued","Design", comments, username, "SpecialityLead"], (err, results) => { //Guardamos la transaccion en el historico
                        if (err) {
                          console.log("error: ", err);
                        }else{
                          //Creamos en misoctrls el registro de la nueva revision
                          sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                          [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", comments, username, "SpecialityLead", null], (err, results) => {
                            if (err) {
                              console.log("error: ", err);
                            }else{
                              sql.query("UPDATE misoctrls SET requested = 2 WHERE filename = ?", [fileName], (err, results) =>{ //Actualizamos la revision anterior para indicar que ya se ha hecho una nueva
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
                    }else{ //Si hay progreso se hace lo mismo pero incluyendo el valor del progreso
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
                                    sql.query("INSERT INTO misoctrls (filename, isoid, revision, spo, sit, `from`, `to`, comments, user, role, progress, realprogress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                                    [newFileName, newFileName.split('.').slice(0, -1).join('.'), revision, 0, 0, "Issued","Design", comments, username, "SpecialityLead", newprogress, newprogress], (err, results) => {
                                      if (err) {
                                        console.log("error: ", err);
                                      }else{
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

          sql.query('SELECT `to` FROM misoctrls WHERE filename = ?', [oldName], (err, results)=>{ //Cogemos los datos de la iso
            if(!results[0]){
              res.status(401)
            }else{
              let local_from = results[0].to
              sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?)", 
              [newName, last.revision, last.spo, last.sit, last.from, last.to, "Rename", last.user, last.role], (err, results) => { //Guardamos la transaccion en el historial
                if (err) {
                  console.log("error: ", err);
                }else{
                  //Actualizamos en misoctrls el nombre de la isometrica
                  sql.query('UPDATE misoctrls SET filename = ?, isoid COLLATE utf8mb4_unicode_ci = ? WHERE filename = ?', [newName, newName.split('.').slice(0, -1), oldName], (err, results)=>{
                    if(err){
                      res.status(401)
                    }else{

                      //Hacemos los cambios del nombre en todos los archivos correspondientes a la iso en el storage
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
    sql.query('UPDATE misoctrls SET blocked = 0 WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [isoid],(err, results)=>{//Desbloqueo de una iso
      if(err){
        res.status(401)
      }else{
        res.status(200)
      }
    })
  }

  const unlockAll = (req, res) =>{
    sql.query('UPDATE misoctrls JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid SET blocked = 0', (err, results)=>{//Desbloqueo de todas las isos bloqueadas
      if(err){
        console.log(err)
        res.status(401)
      }else{
        res.send({success: true}).status(200)
      }
    })
  }

  
cron.schedule('0 */10 * * * *', () => { //Actualzacion periodica del .mac que se comunica con el E3D
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    downloadStatus3DPeriod() 
  }
  
})

function downloadStatus3DPeriod(){
  //Cogemos los datos de dpipes y misoctrls
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

    //Se guarda en un array cada linea resultado de la informacion obtenida
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
    for(let i = 0; i < log.length; i++){ //Pasamos el array a string
      logToText += log[i]+"\n"
    }
    fs.writeFile("fromIsoTrackerTo3d.mac", logToText, function (err) { //Escribimos el string en el .mac
      if (err) return console.log(err);
      fs.copyFile('./fromIsoTrackerTo3d.mac', process.env.NODE_STATUS_ROUTE, (err) => { //Guardamos el resultado en la ruta especificada
        if (err) throw err;
      });
    });

  })
  console.log("Generated 3d report")
}

cron.schedule('0 */7 * * * *', async () => { //De esta parte se encarga ahora node-controller
  /*
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS == "1"){
    await uploadReportPeriod()
    if(process.env.NODE_ISSUER == "1"){
      const timeoutObj = setTimeout(() => {
        downloadIssuedTo3D()
      }, 15000)
      
    }
  }
  */
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

                      }else{
                        
                        const newProgress = results[0].newp
                        sql.query("UPDATE misoctrls SET progress = ?, realprogress = ? WHERE filename = ?", [newRealRrogress, newProgress, lines[i].filename], (err, results) =>{
                          if (err) {
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


//El proceso explicado en este metodo es el mismo para todos los siguientes que consistan en subir un archivo a la bd
const uploadEquisModelledReport = (req, res) =>{ 

  //Se obtienen los indices de los atributos
  const area_index = req.body[0].indexOf("AREA")
  const type_index = req.body[0].indexOf("TYPE")  
  const tag_index = req.body[0].indexOf("TAG")
  const progress_index = req.body[0].indexOf("PROGRESS")
  const elements_index = req.body[0].indexOf("ELEMENTS")
 
  if(area_index == -1 || tag_index == -1 || type_index == -1 || progress_index == -1 || elements_index == -1){ //Se comprueba que no falte info
    console.log("error",area_index,tag_index,type_index,progress_index)
    res.status(401).send("Missing columns!")
  }else{
    sql.query("TRUNCATE dequis", (err, results)=>{ //Borramos la tabla de los equipos modelados
      if(err){
        console.log(err)
      }
    })
    for(let i = 1; i < req.body.length; i++){ //Por cada fila
      if(req.body[i] != '' && req.body[i][0] != null && req.body[i][1] != null && req.body[i][1] != '' && !req.body[i][1].includes("/") && !req.body[i][1].includes("=") && !req.body[i][2] != null){
        sql.query("SELECT id FROM areas WHERE name = ?", [req.body[i][area_index]], (err, results) =>{ //Obtenemos el id del area a partir del nombre
          const areaid = results[0].id
            sql.query("SELECT id FROM tequis WHERE code = ?", [req.body[i][type_index]], (err, results) =>{//Obtenemos el id del tipo a partir del nombre
              if(!results[0]){
                res.json({invalid: i}).status(401)
                return;
              }else{
                const typeid = results[0].id
                sql.query("SELECT id FROM pequis WHERE percentage = ?", [req.body[i][progress_index]], (err, results) =>{ //Obtenemos el id del progreso a partir del porcentage
                  if(!results[0]){
                    res.json({invalid: i}).status(401)
                    return;
                  }else{
                    const percentageid = results[0].id
                    
                    //Guardamos la linea en dequis con esta informacion
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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

//Ver uploadEquisModelledReport
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
  sql.query('SELECT area, tag, type_inst, weight, status, progress FROM dinstsfull_view', (err, results) =>{ //Obtenemos los datos de los instrumentos modelados
    if(!results[0]){
      res.status(401).send("El historial esta vacio")
    }else{
      let rows = []
      for(let i = 0; i < results.length;i++){

        if(results[i].progress != 100){ //Calculamos los progresos
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
  sql.query('SELECT object, value FROM navis', (err, results) =>{ //Datos de navis
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
    await uploadBom.uploadFileMiddleware(req, res); //Se envia al middleware el nuevo archivo de la bom table

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
    

  readXlsxFile(process.env.NODE_BOM_ROUTE).then((rows) => { //Leemos el archivo que se acaba de guardar
    sql.query("TRUNCATE bomtbl", (err, results) =>{ //Borramos la tabla de la bd 
      if(err){
        console.log(err)
      }else{
        for(let i = 9; i < rows.length; i++){    //Por cada linea del archivo añadimos un registro
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

cron.schedule("0 */4 * * * *", () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_PROGRESS === "1"){ //Actualizamos las holds del proyecto
    updateHolds()
  }
})

cron.schedule("0 */30 * * * *", () => {
  if(process.env.NODE_CRON == "1" && process.env.NODE_ISOCONTROL === "1"){ //Actualizamos las lineas del proyecto
	updateLines()
	const timeoutObj = setTimeout(() => {
        updateIsocontrolModelled()
		updateIsocontrolNotModelled()
      }, 5000)
  }
})

async function updateIsocontrolNotModelled(){ //Creamos la tabla de no modeladas de isocontrol a partir de una vista de la bd
  sql.query("DROP TABLE IF EXISTS isocontrol_not_modelled") 
  sql.query("CREATE TABLE isocontrol_not_modelled AS (SELECT * FROM isocontrol_not_modelled_def_view)", (err, results)=>{
    if(err){
      console.log(err)
    }else{
      console.log("isocontrol not modelled updated")
    }
  })       
}

async function updateIsocontrolModelled(){ //Creamos la tabla de modeladas de isocontrol a partir de una vista de la bd
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

  sql.query("TRUNCATE `lines`", (err, results) =>{ //Borramos la tabla de lineas
    if(err){
      console.log(err)
    }
  })

  await csv()
  .fromFile(process.env.NODE_LINES_ROUTE) //Leemos el csv de lineas
  .then((jsonObj)=>{
    const csv = jsonObj
    for(let i = 0; i < csv.length; i++){    
      if(!(csv[i].tag + csv[i].unit + csv[i].fluid + csv[i].seq).includes("unset")){ //Por cada linea creamos un registro en la tabla de la bd
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
          for(let i = 0; i < rows.length; i++){ //Por cada linea hay que cambiar algunos nombres de las variables para que coincidan con el nombre de las modeladas y asi poder leerlo en el front
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
  sql.query("SELECT holds.*, dpipes_view.isoid, misoctrls.filename, misoctrls.onhold, tpipes.code, misoctrls.revision, misoctrls.updated_at, misoctrls.`to`, misoctrls.user, misoctrls.role FROM holds LEFT JOIN dpipes_view on holds.tag = dpipes_view.tag LEFT JOIN misoctrls ON dpipes_view.isoid COLLATE utf8mb4_unicode_ci = misoctrls.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id WHERE misoctrls.onhold = 1", (err, results)=>{
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
  .fromFile(process.env.NODE_HOLDS_ROUTE) //Leemos el csv de holds
  .then((jsonObj)=>{
    data = jsonObj
  })

  const timeoutObj = setTimeout(() => {
    sql.query("TRUNCATE holds", (err, results) =>{ //Borramos la tabla de holds
      if(err){
        console.log(err)
      }else{
        sql.query("UPDATE misoctrls SET onhold = 0 WHERE misoctrls.onhold = 1",  (err, results)=>{ //En misoctrls ponemos que ninguna iso esta en hold
          if(err){
            console.log(err)
            res.status(401)
          }else{
            for(let i = 0; i < data.length; i++){    
              let has_holds = data[i].hold1 + data[i].hold2 + data[i].hold3 + data[i].hold4 + data[i].hold5 + data[i].hold6 + data[i].hold7 + data[i].hold8 + data[i].hold9 + data[i].hold10
              if(data[i].tag && has_holds && has_holds != ""){
                //Hacemos el insert a la tabla de holds por cada linea del csv
                sql.query("INSERT INTO holds (tag, hold1, description1, hold2, description2, hold3, description3, hold4, description4, hold5, description5, hold6, description6, hold7, description7, hold8, description8, hold9, description9, hold10, description10) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [data[i].tag, data[i].hold1, data[i].description1, data[i].hold2, data[i].description2, data[i].hold3, data[i].description3, data[i].hold4, data[i].description4, data[i].hold5, data[i].description5, data[i].hold6, data[i].description6, data[i].hold7, data[i].description7, data[i].hold8, data[i].description8, data[i].hold9, data[i].description9, data[i].hold10, data[i].description10], (err, results)=>{
                  if(err){
                    console.log(err)
                  }else{
                    if(has_holds){ //Actualizamos misoctrls indicando los nuevos holds
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

const exportFull = async(req, res) =>{ //EXport de todo isocontrol
  sql.query("SELECT unit as line_id, unit, area, unit as line, train, fluid, seq, spec_code, diameter, pid, stress_level, calc_notes, insulation, total_weight, diameter as modelled, tray, progress, isocontrol_holds_view.hold1, BOM, LDL, bom_unit, bom_area, bom_train, bom_spec_code FROM isocontrol_all_view LEFT JOIN isocontrol_holds_view ON isocontrol_all_view.tag COLLATE utf8mb4_unicode_ci = isocontrol_holds_view.tag", (err, results) =>{
    if(err){
      console.log(err)
      res.status(401)
    }else{
      let rows = results
      for(let i = 0; i < rows.length; i++){

        //Se construyen algunos campos a partir de otros
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

        if(rows[i].diameter === null){ //Se comprueba si esta modelada o no
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
  sql.query("SELECT * FROM isocontrol_lineid_group WHERE line_id is not null", (err, results)=>{ //Select de una vista de la bd donde se agrpan las modeladas por line id
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

  //Rellenamos los campos de issuer con los datos que ha introducido el usuario
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
  await sql.query("UPDATE misoctrls SET onhold = 2, `to` = `from` WHERE filename = ?", [fileName], async (err, results) =>{ //Sacamos la iso de hold
    if(err){
      console.log(err)
      res.status(401)
    }else{
      
      await sql.query("UPDATE misoctrls SET `from` = ? WHERE filename = ?", ["On hold", fileName], (err, results) =>{ //Indicamos la bandeja donde cae la iso
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
  sql.query("UPDATE misoctrls SET onhold = 1, `from` = `to` WHERE filename = ?", [fileName], (err, results) =>{ //Enviamos una iso a hold
    if(err){
      console.log(err)
      res.status(401)
    }else{
      sql.query("UPDATE misoctrls SET `to` = ? WHERE filename = ?", ["On hold", fileName], (err, results) =>{ //Indicamos la bandeja donde cae la iso (bandeja de holds)
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
  sql.query('SELECT id FROM users WHERE email = ?', [email], (err, results) =>{ //Cogemos el usuario
    if (!results[0]){
      res.status(401)
    }else{   
      const user_id = results[0].id
      sql.query("SELECT id FROM bypass ORDER BY id DESC LIMIT 1", (err, results) =>{ //Cogemos el id del ultimo bypass realizado
        let tag = "BP000001"
        if(results[0]){ //A partir de este codigo y la id obtenida formamos el nuevo codigo (parecido a pitrequest)
          tag = "BP000001".substring(0, tag.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
          console.log(tag)
        }
        //Creamos el bypass
        sql.query("INSERT INTO bypass(misoctrls_id, tbypass_id, tag, note, user_id) VALUES(?,?,?,?,?)", [iso_id, type, tag, notes, user_id], (err, results)=>{
          if(err){
            console.log(err)
            res.status(401)
          }else{

            //Enviamos un correo a todos los administradores del proyecto con la informacion del bypass
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
  sql.query("UPDATE bypass SET bstatus_id = ? WHERE id = ?", [type, id], (err, results) =>{ //Guardamos la respuesta al bypass
    if(err){
      console.log(err)
      res.status(401)
    }else{
      //Enviamos un correo al usuario que creo el bypass para informar de la respuesta
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

const rejectByPass = async(req, res) =>{ //Lo mismo que el anterior pero rechazando con comentarios
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

const naByPass = async(req, res) =>{ //Lo mismo que el anterior pero indicando que no aplica(N/A) con comentarios
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
  sql.query("SELECT isoid, revision FROM misoctrls WHERE filename = ?",[filename], (err, results) =>{ //cogemos el isoid y la revision de la iso
    if(!results[0]){
      res.status(401)
    }else{
      const isoid = results[0].isoid
      const revision = results[0].revision
      sql.query("SELECT * FROM misoctrls WHERE isoid = ? AND revision > ?", [isoid, revision], (err, results) =>{ //Si no tiene una revision nueva no hay nada que cancelar
        if(results[0]){
          res.send({cancellable: false})
        }else{
          sql.query("SELECT `to` FROM misoctrls WHERE isoid = ? AND (issued = 0 OR issued IS NULL)", [isoid, revision], (err, results) =>{ //Si la tiene
            if(!results[0]){
              res.send({cancellable: false})
            }else{
              const tray = results[0].to
              if(tray == "Design"){ //Si aun no ha avanzado de diseño es cancelable, en caso contrario no se puede cancelar
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

  sql.query("SELECT isoid, revision FROM misoctrls WHERE filename = ?",[filename], (err, results) =>{
    if(!results[0]){
      res.status(401)
    }else{
      const isoid = results[0].isoid
      const revision = results[0].revision
      sql.query("SELECT * FROM misoctrls WHERE isoid = ? AND revision > ?", [isoid, revision], (err, results) =>{
        if(results[0]){
          res.send({success: false})
        }else{
          sql.query("SELECT `to` FROM misoctrls WHERE isoid = ? AND (issued = 0 OR issued IS NULL)", [isoid, revision], (err, results) =>{
            if(!results[0]){
              res.send({success: false})
            }else{
              const tray = results[0].to
              if(tray == "Design"){
                sql.query("SELECT isoid FROM misoctrls WHERE filename = ?",[filename], (err, results) =>{
                  if(!results[0]){
                    res.status(401)
                  }else{
                    const isoid = results[0].isoid
                    sql.query("SELECT filename FROM misoctrls WHERE isoid = ?", [isoid], (err, results) =>{
                      const newRevFilename = results[0].filename
                      sql.query("DELETE FROM misoctrls WHERE isoid = ? AND (issued = 0 OR issued IS NULL) AND `to` = ?", [isoid, "Design"], (err, results) =>{ //Borramos la nueva revision de misoctrls
                        if(err){
                          console.log(err)
                          res.status(401)
                        }else{
                          sql.query("SELECT name FROM users WHERE email = ?", [user], (err, results)=>{
                            const username = results[0].name
                            sql.query("INSERT INTO hisoctrls (filename, isoid, user, role) VALUES (?,?,?,?)", [filename, isoid,  username, "SpecialityLead"], (err, results) => { //Guardamos la transaccion en el historial
                              if(err){
                                console.log(err)
                              }
                            })
                          })
                          //Eliminamos la nueva revision del storage
                          fs.unlink('./app/storage/design/' + newRevFilename, function(err){
                            if(err){
                              console.log(err)
                            } 
                          }); 
                          sql.query("UPDATE misoctrls SET requested = 0 WHERE filename = ?", [filename], (err, results) =>{ //Actualizamos la revision anterior para que sea posible hacer una revision nueva en un futuro
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
              }else{
                res.send({success: false})
              }
            }
          })
        }
      })
    }
  })
}

const issuedFiles = async(req, res) =>{
  if(process.env.NODE_PROGRESS === "1"){
    sql.query('SELECT misoctrls.*, dpipes_view.*, tpipes.`name`, tpipes.weight, tpipes.`code` FROM misoctrls LEFT JOIN dpipes_view ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id WHERE misoctrls.to = "LDE/IsoControl" && issued = 1 ORDER BY issued_date DESC', (err, results) =>{
      
      res.json({
        rows: results
      })
    
    })
  }else{
    sql.query('SELECT * FROM misoctrls WHERE misoctrls.to = "LDE/IsoControl" && issued = 1', (err, results) =>{
      
      res.json({
        rows: results
      })
    
    })
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
  getFilenamesByUser,
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
  issuedFiles
};