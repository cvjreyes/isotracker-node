const sql = require("../../db.js");
const { findByEmail } = require("../users/user.model.js");

const singleUnclaim = async (req, res) => {
    const user = req.body.user
    const fileName = req.body.file
    let username = ""

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
        if (!results[0]){
        res.status(401).send("Username or password incorrect");
        }else{
            username  = results[0].name
            sql.query("SELECT forced, returned FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{
                if(results[0].forced == 1){
                    res.status(401).send({"error": "forced"})
                }else if(results[0].returned == 1){
                    res.status(401).send({"error": "returned"})
                }else{
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
                            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                            [fileName, 0, 0, last.spo, last.sit, "Unclaimed", last.from, last.comments, username, req.body.role, last.created_at], (err, results) => {
                            if (err) {
                                console.log("error: ", err);
                            }else{
                                let ld = 0;
                                if(req.body.role == "DesignLead" || req.body.role == "SupportsLead" || req.body.role == "StressLead"){
                                    ld = 1
                                }
                                console.log("created unclaim in hisoctrls");
                                sql.query("UPDATE misoctrls SET claimed = 0, verifyDesign = ?, user = ?, role = ? WHERE filename = ?", [ld,"None", null, fileName], (err, results) =>{
                                    if (err) {
                                        console.log("error: ", err);
                                    }else{
                                      console.log("unclaimed iso " + fileName);
                                      res.status(200).send({"unclaimed": true})
                                    }
                                })
                                }
                            })
                        }
                    })
                }
            })   
        
        }
    });
}

const forceUnclaim = async(req,res) =>{
    const fileName = req.body.file
    let username = ""

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
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
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, 0, 0, last.spo, last.sit, "Forced unclaim", last.from, last.comments, username, req.body.role, last.created_at], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        console.log("created unclaim in hisoctrls");
                        sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 0, user = ?, role = ? WHERE filename = ?", ["None", null, fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                            console.log("unclaimed iso " + fileName);
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

const singleUnclaimProc = async(req, res) =>{
  const user = req.body.user
  const fileName = req.body.file
  sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
      if(!results[0]){
          res.status(401).send("No files found");
      }else{
        sql.query("SELECT forced, claimed, comments, user FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{
            if(results[0].forced == 1){
                res.status(401).send("Iso is forced")
            }else{
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
                    console.log("created unclaim in hisoctrls");
                    sql.query("UPDATE misoctrls SET spoclaimed = 0, spouser = ? WHERE filename = ?", ["None", fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
                            console.log("spo unclaimed iso " + fileName);
                            res.status(200).send("unclaimed")
                        }
                    })
                    }
                })
            }
        })
      }
  })
}

const singleUnclaimInst = async(req, res) =>{
    const user = req.body.user
    const fileName = req.body.file
    sql.query('SELECT * FROM hisoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if(!results[0]){
            res.status(401).send("No files found");
        }else{
            sql.query("SELECT * FROM misoctrls WHERE filename = ?", [fileName],(err, results) =>{
                if(results[0].forced == 1){
                    res.status(401).send("Iso is forced")
                }else{
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
                        console.log("created unclaim in hisoctrls");
                        sql.query("UPDATE misoctrls SET sitclaimed = 0, situser = ? WHERE filename = ?", ["None", fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                            console.log("sit unclaimed iso " + fileName);
                            res.status(200).send("unclaimed")
                            }
                        })
                        }
                    })
                }
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