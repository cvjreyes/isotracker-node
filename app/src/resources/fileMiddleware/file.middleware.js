const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024 * 100;
const fs = require('fs');

let storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    var exists = false;
    var where = "";
    var extension = "";
    var i = file.originalname.lastIndexOf('.');
    if (i > 0) {
      extension = file.originalname.substring(i+1);
    }
    if (extension == 'pdf'){
      console.log("entro a pdf")
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
        const childPath = './app/storage/isoctrl/design/limbo/' + file.originalname.split('.').slice(0, -1).join('.') + '.zip'
        if (fs.existsSync(childPath)) {
          const newChildPath = './app/storage/isoctrl/design/attach/' + file.originalname.split('.').slice(0, -1).join('.') + '.zip'
          fs.rename(childPath, newChildPath, function (err) {
            if (err) throw err
            console.log('Successfully renamed - AKA moved!')
          })
        }
        await cb(null, './app/storage/isoctrl/design')

      }else{
        cb("error", null)
      }
    }else if(extension == 'zip'){
      console.log("entro a zip")
      const parentPath = './app/storage/isoctrl/design/' + file.originalname.split('.').slice(0, -1).join('.') + '.pdf'
      console.log(parentPath)
      if (fs.existsSync(parentPath)) {
        await cb(null, './app/storage/isoctrl/design/attach')
      }else{
        await cb(null, './app/storage/isoctrl/design/limbo')
      }
    }else{
      await cb("error", null)
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