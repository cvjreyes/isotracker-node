const fs = require('fs');

exports.getFilesByTray = async(req, res) => {
    var myFiles = [];
    const role = req.body;
    var path = require('path');
    myFolder = path.join('app/myTray', role.currentRole)
    fs.readdir(myFolder, (err, files) => {
    files.forEach(file => {
        if(path.extname(file).toLowerCase() === '.pdf'){
        myFiles.push(file)
        
    }
    
  });
});
    console.log(myFiles)
    res.json({
        files: ["AS","AS"]
    });
}