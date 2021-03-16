const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const fs = require('fs');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    var exists = false;
    var where = "";
    
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
    './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
    for(let i = 0; i < folders.length; i++){
      const path = folders[i] + '/' + file.originalname;
      if (fs.existsSync(path)) {
        exists = true;
        where = folders[i]
      }
    }
    if(!exists){
      cb(null, './app/storage/isoctrl/design')
    }else{
      cb(where, null)
    }
  },
  filename: (req, file, cb) => {
    //console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;