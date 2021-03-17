const fs = require('fs');
const sql = require("../../db.js");

exports.getFilesByTray = async(req, res) => {
    var myFiles = [];
    var folderNum = 3;
    var role = req.body;
    role = role.currentRole;
    

    sql.query('SELECT num FROM roles WHERE name = ?', [role], async (err, results) => {
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        var folder = '';
        folderNum = results[0].num;
        switch(folderNum){
          case 1:
            folder = "design";
            break;
          case 2:
            folder = "stress";
            break;
          case 3:
            folder = "supports";
            break;
          case 4:
            folder = "materials";
            break;
          case 5:
            folder = "issuer";
            break;
          case 6:
            folder = "lde";
            break;
        }
        var path = require('path');
        myFolder = path.join('app/storage/isoctrl', folder)
        fs.readdir(myFolder, (err, files) => {
        files.forEach(file => {
            if(path.extname(file).toLowerCase() === '.pdf'){
            myFiles.push(file)
            
            }
        
        });
        res.json({
          files: myFiles
        });
      });
    }
  });
  }


