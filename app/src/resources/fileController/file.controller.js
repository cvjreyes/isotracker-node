const uploadFile = require("../fileMiddleware/file.middleware");
const fs = require("fs");
const bodyParser = require('body-parser')
const sql = require("../../db.js");

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
    var extension = "";
    var i = req.file.originalname.lastIndexOf('.');
    if (i > 0) {
      extension = req.file.originalname.substring(i+1);
    }
    if (extension == 'pdf'){
      
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

const getListFiles = (req, res) => {
  const directoryPath = "./app/storage/isoctrl/Design";

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

  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();

  let cuerrentDateAndTime = (year + "-" + month + "-" + date + " " + date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds())

  sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
  [req.body.fileName, 0, 0, 0, 0, " ","Design", "Uploaded", req.body.user, cuerrentDateAndTime, cuerrentDateAndTime], (err, res) => {
    if (err) {
      console.log("error: ", err);
    }else{
      console.log("created hisoctrls");
      sql.query("INSERT INTO misoctrls (filename, isoid, revision, tie, spo, sit, `from`, `to`, comments, user, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
      [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, 0, " ","Design", "Uploaded", req.body.user, cuerrentDateAndTime, cuerrentDateAndTime], (err, res) => {
        if (err) {
          console.log("error: ", err);
        }else{
          console.log("created misoctrls");
        }
      });
    }
  });
}

module.exports = {
  upload,
  getListFiles,
  download,
  uploadHis
};