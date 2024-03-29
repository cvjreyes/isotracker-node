const sql = require("../../db.js");
const { findByEmail } = require("../users/user.model.js");

const singleUnclaim = async (req, res) => {
    const user = req.body.user
    const fileName = req.body.file
    let username = ""

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Cogemos el email
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{
            username  = results[0].name
            sql.query("SELECT forced, returned FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{ //Esta parte no se usa
                /*if(results[0].forced == 1){
                    res.status(401).send({"error": "forced"})
                }else if(results[0].returned == 1){
                    res.status(401).send({"error": "returned"})
                }else{*/
                    sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
                        if(!results[0]){
                            res.status(401).send("No files found");
                        }else{
                            let last = results[0]
                            for (let i = 1; i < results.length; i++){
                                if(results[i].updated_at > last.updated_at){
                                    last = results[i]
                                }
                            }
                            //Guardamos la transaccion en el historial
                            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                            [fileName, last.revision, last.spo, last.sit, 0, last.from, last.to, "Unclaimed", username, req.body.role], (err, results) => {
                            if (err) {
                                console.log("error: ", err);
                            }else{
                                let ld = 0;
                                if(req.body.role == "DesignLead" || req.body.role == "SupportsLead" || req.body.role == "StressLead"){
                                    ld = 1
                                }
                                //Actualizamos en misoctrls la iso
                                sql.query("UPDATE misoctrls SET claimed = 0, verifyDesign = ?, user = ?, role = ? WHERE filename = ?", [ld,"None", null, fileName], (err, results) =>{
                                    if (err) {
                                        console.log("error: ", err);
                                    }else{
                                      res.status(200).send({"unclaimed": true})
                                    }
                                })
                                }
                            })
                        }
                    })
                //}
            })   
        
        }
    });
}

const forceUnclaim = async(req,res) =>{
    const fileName = req.body.file
    let username = ""

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{ //Cogemos el user
        if (!results[0]){
            res.status(401).send("Username or password incorrect");
        }else{   
            username  = results[0].name
            sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
                if(!results[0]){
                    res.status(401).send("No files found");
                }else{
                    let last = results[0]
                    for (let i = 1; i < results.length; i++){
                        if(results[i].updated_at > last.updated_at){
                            last = results[i]
                        }
                    }
                    //Guardamos la transaccion en el historial
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, 0, last.spo, last.sit, 0, last.from, last.to, "Forced unclaim", username, req.body.role], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        //Actualizamos en misoctrls la iso
                        sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 0, user = ?, role = ? WHERE filename = ?", ["None", null, fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                            res.status(200).send({"unclaimed": true})
                            }
                        })
                        }
                    })
                }
            })
        }
    });
}

const singleUnclaimProc = async(req, res) =>{ //Mismo proceso pero para procesos
  const user = req.body.user
  const fileName = req.body.file
  sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
      if(!results[0]){
          res.status(401).send("No files found");
      }else{
        sql.query("SELECT forced, claimed, comments, user FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{
            /*if(results[0].forced == 1){
                res.status(401).send("Iso is forced")
            }else{*/
                let last = results[0]
                for (let i = 1; i < results.length; i++){
                    if(results[i].updated_at > last.updated_at){
                        last = results[i]
                    }
                }
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, spoclaimed, `from`, `to`, comments, user, role, spouser) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                [fileName, 0, 0, 0, last.claimed, 0, "Claimed", "Process" , last.comments, last.user, req.body.role, "None"], (err, results) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    sql.query("UPDATE misoctrls SET spoclaimed = 0, spo = 5, spouser = ? WHERE filename = ?", ["None", fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
                            res.status(200).send("unclaimed")
                        }
                    })
                    }
                })
            //}
        })
      }
  })
}

const singleUnclaimInst = async(req, res) =>{ //Mismo proceso pero para instrumentos
    const user = req.body.user
    const fileName = req.body.file
    sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if(!results[0]){
            res.status(401).send("No files found");
        }else{
            sql.query("SELECT * FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{
                /*if(results[0].forced == 1){
                    res.status(401).send("Iso is forced")
                }else{*/
                    let last = results[0]
                    for (let i = 1; i < results.length; i++){
                        if(results[i].updated_at > last.updated_at){
                            last = results[i]
                        }
                    }
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, sitclaimed, `from`, `to`, comments, user, role, situser, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, 0, 0, 0, last.claimed, 0, "Claimed", "Instrument" , last.comments, last.user, req.body.role, "None", last.created_at], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        sql.query("UPDATE misoctrls SET sitclaimed = 0, sit = 5, situser = ? WHERE filename = ?", ["None", fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                            }
                        })
                        }
                    })
               // }
            })
        }
    })
}

module.exports = {
    singleUnclaim,
    forceUnclaim,
    singleUnclaimProc,
    singleUnclaimInst
  };