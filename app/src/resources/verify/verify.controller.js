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
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed,verifydesign, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, last.claimed, 1, last.from, "Verify" , last.comments, username, role, last.created_at], (err, results) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    console.log("verified in hisoctrls")
                    sql.query("UPDATE misoctrls SET verifydesign = 1, returned = 0, user = ?, role = ? WHERE filename = ?", [username, role, fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
                            console.log("verified iso " + fileName);
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
            sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed,verifydesign, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, last.claimed, 0,  "Cancel verify" , last.to, last.comments, username, role, last.created_at], (err, results) => {
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
}

module.exports = {
    verify,
    cancelVerify
  };
  