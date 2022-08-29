const sql = require("../../db.js");

const verify = async(req, res) => {
    const user = req.body.user
    const fileName = req.body.file
    const role = req.body.role

    var username = "";
    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
      }
    });
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
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, verifydesign, `from`, `to`, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, last.claimed, 1, last.from, "Verify" ,  username, role], (err, results) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    sql.query("UPDATE misoctrls SET verifydesign = 1, returned = 0, user = ?, role = ? WHERE filename = ?", [username, role, fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
                            res.status(200).send("verified")
                        }
                    })
                }
            })
        }
    })
};

const cancelVerify = async(req, res) => {
    const user = req.body.user
    const fileName = req.body.file
    const role = req.body.role

    var username = "";
    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
      }
    });
    sql.query("SELECT `to` FROM misoctrls WHERE filename = ?", [fileName], (err, results) =>{
        const tray = results[0].to
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
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed,verifydesign, `from`, `to`, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                [fileName, 0, 0, 0, last.claimed, 0,  tray , "Cancel verify", username, role], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        console.log("cancelled verification in hisoctrls")
                        sql.query("UPDATE misoctrls SET verifydesign = 0 WHERE filename = ?", [fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
                                console.log("cancelled verifification of iso " + fileName);
                                res.status(200).send("cancelled verification")
                            }
                        })
                    }
                })
            }
        })
    })
    
}

module.exports = {
    verify,
    cancelVerify
  };
  