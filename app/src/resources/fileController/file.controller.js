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
  const fileName = req.params.name;
  const directoryPath = "./app/storage/isoctrl/Design";

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
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
    }
  });

  sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?)", 
  [req.body.fileName, 0, 0, 0, 0, " ","Design", "Uploaded", username], (err, results) => {
    if (err) {
      console.log("error: ", err);
    }else{
      console.log("created hisoctrls");
      sql.query("INSERT INTO misoctrls (filename, isoid, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, 0, " ","Design", "Uploaded", username], (err, results) => {
        if (err) {
          console.log("error: ", err);
        }else{
          console.log("created misoctrls");
          res.status(200).send("uploaded to his")
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
    }
  });

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
        [fileName, 0, 0, 0, 0, "Updated", last.from, "Updated", username], (err, results) => {
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

const getMaster = async(req, res) =>{
  fileName = req.params.fileName
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
  let designUploadedCount, designProgressCount, stressCount, supportsCount = 0
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
                  res.status(200).send({
                    designUploaded: designUploadedCount,
                    designProgress: designProgressCount,
                    stress: stressCount,
                    supports: supportsCount
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
  
module.exports = {
  upload,
  update,
  getListFiles,
  download,
  uploadHis,
  updateHis,
  getMaster,
  updateStatus
};