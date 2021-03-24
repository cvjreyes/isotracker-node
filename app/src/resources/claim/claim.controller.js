const sql = require("../../db.js");
const { findByEmail } = require("../users/user.model.js");

const singleClaim = async (req, res) => {
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
    console.log(username)
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
            sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, claimed, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, 0, 1, last.from, last.to , last.comments, username, role, last.created_at], (err, results) => {
            if (err) {
                console.log("error: ", err);
            }else{
                console.log("created claim in hisoctrls");
                sql.query("UPDATE misoctrls SET claimed = 1, user = ?, role = ? WHERE filename = ?", [username, role, fileName], (err, results) =>{
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        console.log("claimed iso " + fileName);
                        res.status(200).send("claimed")
                    }
                })
                }
            })
        }
    })
    /*
    sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?)", 
    [fileName, 0, 0, 0, 0, " ","Design", "Uploaded", user], (err, res) => {
      if (err) {
        console.log("error: ", err);
      }else{
        console.log("created hisoctrls");
        sql.query("INSERT INTO misoctrls (filename, isoid, revision, tie, spo, sit, `from`, `to`, comments, user) VALUES (?,?,?,?,?,?,?,?,?,?)", 
        [req.body.fileName, req.body.fileName.split('.').slice(0, -1).join('.'), 0, 0, 0, 0, " ","Design", "Uploaded", req.body.user], (err, res) => {
          if (err) {
            console.log("error: ", err);
          }else{
            console.log("created misoctrls");
          }
        });
      }
    });
    */
}

module.exports = {
    singleClaim
  };