const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024 * 100;
const fs = require('fs');

let storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const path_pdf = './app/storage/drawings/' + file.originalname.split('.').slice(0, -1) + ".pdf";
    const path_png = './app/storage/drawings/' + file.originalname.split('.').slice(0, -1) + ".png";


    if (!fs.existsSync(path_pdf) && !fs.existsSync(path_png)) {
        console.log("Se añade")
        await cb(null, './app/storage/drawings')
    }else{
        
        cb("error", null)
        console.log("Ya existe")
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
    var extension = "";
    var cl = false;
    var i = file.originalname.lastIndexOf('.');
    if (i > 0) {
      extension = file.originalname.substring(i+1);
      if (file.originalname.substring(i-2) == 'CL.pdf'){
        cl = true
      }
    }

    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
    './app/storage/isoctrl/stress','./app/storage/isoctrl/supports'];
    for(let i = 0; i < folders.length; i++){
      let path = null
      if (cl){
        path = folders[i] + '/' + file.originalname.split('.').slice(0, -1);
        path = path.slice(0,-3);
      }else{
        path = folders[i] + '/' + file.originalname.split('.').slice(0, -1);
      }
      
      if (fs.existsSync(path +'.pdf')) {
        exists = true;
        where = folders[i]
      }
    }
    if(exists){
      if (extension == 'pdf' && !cl){ 
        await cb(null, where)
      }else{
        await cb(null, where+'/attach')
      }

    }else{
      cb("error", null)
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