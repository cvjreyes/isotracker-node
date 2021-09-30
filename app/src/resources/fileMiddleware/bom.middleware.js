const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024 * 1000;
const fs = require('fs');

let storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    
    await cb(null, process.env.NODE_BOM_ROUTE_UPDATE)   
    
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

module.exports = {
  uploadFileMiddleware,
}