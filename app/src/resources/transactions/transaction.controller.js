const fs = require("fs");
const sql = require("../../db.js");

const transaction = async (req, res) => {

    sql.query("SELECT created_at FROM hisoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
        if (!results[0]){
            res.status(401).send("File no found");
        }else{
            let created_at = results[0].created_at
            sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?)", 
            [req.body.fileName, 0, 0, 0, 0, req.body.from, req.body.to, "Moved", req.body.user], (err, res) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    console.log("created transaction");
                    let origin_path = './app/storage/isoctrl/' + req.body.from + "/" + req.body.fileName
                    let destiny_path = './app/storage/isoctrl/' + req.body.to + "/" + req.body.fileName
                    let origin_attach_path = './app/storage/isoctrl/' + req.body.from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '.zip'
                    let destiny_attach_path = './app/storage/isoctrl/' + req.body.to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '.zip'
                    
                    if(fs.existsSync(origin_path)){
                        fs.rename(origin_path, destiny_path, function (err) {
                            if (err) throw err
                            console.log('Successfully renamed - AKA moved!')
                        })
                          if(fs.existsSync(origin_attach_path)){
                            fs.rename(origin_attach_path, destiny_attach_path, function (err) {
                                if (err) throw err
                                console.log('Successfully renamed - AKA moved!')
                            })
                          }
                    }
                    
                }

            });
            res.status(200).send({
                message: "Transaction completed: moved " + req.body.fileName + " from " + req.body.from + " to " + req.body.to
              });
        }
    })


}

module.exports = {
  transaction
};