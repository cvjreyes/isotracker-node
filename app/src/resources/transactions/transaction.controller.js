const fs = require("fs");
const { env } = require("process");
const sql = require("../../db.js");

const transaction = async (req, res) => {

    console.log("Empieza la transaccion")

    sql.query("SELECT created_at FROM hisoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
        if (!results[0]){
            res.status(401).send("File not found");
        }else{
            sql.query("SELECT `to` FROM misoctrls WHERE filename = ?", req.body.fileName, (err, results) => {
                if (!results[0]){
                    res.status(401).send("File not found");
                }else{
                    console.log(results[0])
                    const from = results[0].to
                    let created_at = results[0].created_at
                    sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?)", 
                    [req.body.fileName, 0, 0, 0, 0, from, req.body.to, req.body.comment, req.body.user], (err, results) => {
                        if (err) {
                            console.log("error: ", err);
                        }else{
                            console.log("created transaction");
                            let origin_path = './app/storage/isoctrl/' + from + "/" + req.body.fileName
                            let destiny_path = './app/storage/isoctrl/' + req.body.to + "/" + req.body.fileName
                            let origin_attach_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '.zip'
                            let destiny_attach_path = './app/storage/isoctrl/' + req.body.to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '.zip'
                            let origin_cl_path = './app/storage/isoctrl/' + from + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'
                            let destiny_cl_path = './app/storage/isoctrl/' + req.body.to + "/attach/" + req.body.fileName.split('.').slice(0, -1).join('.') + '-CL.pdf'

                            if(fs.existsSync(origin_path)){
                                fs.rename(origin_path, destiny_path, function (err) {
                                    if (err) throw err
 
                                })
                                if(fs.existsSync(origin_attach_path)){
                                    fs.rename(origin_attach_path, destiny_attach_path, function (err) {
                                        if (err) throw err

                                    })
                                    if(fs.existsSync(origin_cl_path)){
                                        fs.rename(origin_cl_path, destiny_cl_path, function (err) {
                                            if (err) throw err
                                            console.log('Successfully renamed - AKA moved!')
                                        })
                                    }
                                }
                            }

                            let ld = 0;
                            if (process.env.REACT_APP_IFC == "1"){
                                if ((req.body.role == "StressLead" || req.body.role == "SupportsLead") && (from == "stress" && req.body.to == "supports" || from == "supports" && req.body.to == "stress")){
                                    ld = 1;
                                }
                            }

                            console.log(process.env.REACT_APP_ICF)
                            console.log(req.body.role)
                            console.log(from)
                            console.log(req.body.to)
                         
                            sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = ?, user = ?, role = ?, `from`= ?, `to`= ?, comments = ? WHERE filename = ?", [ld, "None", null, from, req.body.to, req.body.comment, req.body.fileName], (err, results) =>{
                                if (err) {
                                    console.log("error: ", err);
                                }else{
                                    console.log("iso moved" );
                                    res.status(200).send("moved")
                                }
                            })
                            
                        }

                    });
                }
            })

        }
    })


}

module.exports = {
  transaction
};