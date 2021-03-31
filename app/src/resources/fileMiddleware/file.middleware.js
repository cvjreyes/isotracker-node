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

        const childPath = './app/storage/isoctrl/design/limbo/'
        const newChildPath = './app/storage/isoctrl/design/attach/'
        masterName = file.originalname.split('.').slice(0, -1)

        fs.readdir(childPath, (err, files) => {
          files.forEach(file => {                          
            let attachName = file.split('.').slice(0, -1)
            if(String(masterName).trim() == String(attachName).trim()){
              fs.rename(childPath+file, newChildPath+file, function (err) {
                  console.log("moved attach "+ file)
                  if (err) throw err

              })
            }
          });
      });
        console.log("Se añade")
        await cb(null, './app/storage/isoctrl/design')

      }else{
        cb("error", null)
      }
    }else{
      console.log("entro a zip")
      const parentPath = './app/storage/isoctrl/design/' + file.originalname.split('.').slice(0, -1).join('.') + '.pdf'
      console.log(parentPath)
      if (fs.existsSync(parentPath)) {
        await cb(null, './app/storage/isoctrl/design/attach')
      }else{
        await cb(null, './app/storage/isoctrl/design/limbo')
      }
    }
  },
  filename: (req, file, cb) => {
    //console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let updateStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    
    var exists = false;
    var where = "";

      console.log("entro a pdf master")
      const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports','./app/storage/isoctrl/design/attach', './app/storage/isoctrl/issuer/attach', './app/storage/isoctrl/lde/attach', 
      './app/storage/isoctrl/materials/attach', './app/storage/isoctrl/stress/attach','./app/storage/isoctrl/supports/attach'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }

      if(exists){

        await cb(null, where)

      }else{
        cb("error", null)
      }
    

      /*
      console.log("entro a zip")
      const parentPath = './app/storage/isoctrl/design/' + file.originalname.split('.').slice(0, -1).join('.') + '.pdf'
      console.log(parentPath)
      if (fs.existsSync(parentPath)) {
        await cb(null, './app/storage/isoctrl/design/attach')
      }else{
        await cb(null, './app/storage/isoctrl/design/limbo')
      }*/
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

let updateFile = multer({
  storage: updateStorage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
let updateFileMiddleware = util.promisify(updateFile);

module.exports = {
  uploadFileMiddleware,
  updateFileMiddleware
}