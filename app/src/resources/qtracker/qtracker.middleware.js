const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024 * 100;
const fs = require('fs');
const { SSL_OP_NO_QUERY_MTU } = require("constants");

let storage = multer.diskStorage({
  destination: async (req, file, cb) => {

    console.log("Se añade attach a qtracker")
    await cb(null, './app/storage/qtracker')

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

let uploadAttach = util.promisify(uploadFile);

module.exports = {
  uploadAttach
}