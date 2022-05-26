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
    let cl = false
    if (i > 0) {
      extension = file.originalname.substring(i+1);
      if(file.originalname.substring(i-2) == 'CL.pdf'){
        cl = true
      }
    }
    if (extension == 'pdf' && !cl){
      const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD', './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD', './app/storage/isoctrl/design/TRASH', './app/storage/isoctrl/issuer/TRASH', './app/storage/isoctrl/lde/TRASH', './app/storage/isoctrl/materials/TRASH', './app/storage/isoctrl/stress/TRASH','./app/storage/isoctrl/supports/TRASH'];
      for(let i = 0; i < folders.length; i++){
        const revisions = [".pdf", "-0.pdf", "-1.pdf", "-2.pdf", "-3.pdf", "-4.pdf"]
        for(let j = 0; j < revisions.length; j++){
          const path = folders[i] + '/' + file.originalname.split('.').slice(0, -1) + revisions[j];
          if (fs.existsSync(path)) {
            exists = true;
            where = folders[i]
          }
        }      
      }

      if(!exists){

        const childPath = './app/storage/isoctrl/design/limbo/'
        const newChildPath = './app/storage/isoctrl/design/attach/'
        masterName = file.originalname.split('.').slice(0, -1)

        fs.readdir(childPath, (err, files) => {
          try{
            files.forEach(file => {                          
              let attachName = file.split('.').slice(0, -1)
              if(String(masterName).trim() == String(attachName).trim()){
                fs.rename(childPath+file, newChildPath+file, function (err) {
                    console.log("moved attach "+ file)
                    if (err) throw err
  
                })
              }
            });
          }catch(err){
            console.log(err)
          }
          
      });
        console.log("Se añade")
        await cb(null, './app/storage/isoctrl/design')

      }else{
        cb("error", null)
      }
    }else{
      let parentPath
      if (cl){
        parentPath = './app/storage/isoctrl/design/' + file.originalname.substring(0,file.originalname.length-7) + '.pdf'
      }else{
        parentPath = './app/storage/isoctrl/design/' + file.originalname.split('.').slice(0, -1).join('.') + '.pdf'
      }
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

let uploadProcStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
      './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
      './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
      if(where.includes("HOLD")){
        cb(null, where + '/hattach')
      }else{
        cb(null, where + '/attach')
      }

  },
  filename: (req, file, cb) => {
    //console.log(file.originalname);
    cb(null, file.originalname);
  }
})

let uploadInstStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folders = ['./app/storage/isoctrl/design', './app/storage/isoctrl/issuer', './app/storage/isoctrl/lde', './app/storage/isoctrl/materials',
    './app/storage/isoctrl/stress','./app/storage/isoctrl/supports', './app/storage/isoctrl/design/HOLD', './app/storage/isoctrl/issuer/HOLD', './app/storage/isoctrl/lde/HOLD', './app/storage/isoctrl/materials/HOLD',
    './app/storage/isoctrl/stress/HOLD','./app/storage/isoctrl/supports/HOLD'];
      for(let i = 0; i < folders.length; i++){
        const path = folders[i] + '/' + file.originalname;
        if (fs.existsSync(path)) {
          exists = true;
          where = folders[i]
        }
      }
      
      if(where.includes("HOLD")){
        cb(null, where + '/hattach')
      }else{
        cb(null, where + '/attach')
      }


  },
  filename: (req, file, cb) => {
    //console.log(file.originalname);
    cb(null, file.originalname);
  }
})

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let updateFile = multer({
  storage: updateStorage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileProc = multer({
  storage: uploadProcStorage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileInst = multer({
  storage: uploadInstStorage,
  limits: {fileSize: maxSize}
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
let updateFileMiddleware = util.promisify(updateFile);
let uploadFileProcMiddleware = util.promisify(uploadFileProc);
let uploadFileInstMiddleware = util.promisify(uploadFileInst);

module.exports = {
  uploadFileMiddleware,
  updateFileMiddleware,
  uploadFileProcMiddleware,
  uploadFileInstMiddleware
}