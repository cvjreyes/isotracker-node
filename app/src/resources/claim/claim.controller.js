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


    sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
      if (!results[0]){
        res.status(401).send("The file does not exist");
      }else if (results[0].claimed == 1 && role != "DesignLead" && role != "StressLead" && role != "SupportsLead" && 
                results[0].role == "DesignLead" && results[0].role == "StressLead" && results[0].role == "SupportsLead"){   
        res.status(401).send("This isometric has already been claimed");
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
              sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, claimed, verifydesign, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
              [fileName, 0, 0, 0, 0, 1, 0, last.from, last.to , last.comments, username, role, last.created_at], (err, results) => {
              if (err) {
                  console.log("error: ", err);
              }else{
                  console.log("created claim in hisoctrls");
                  sql.query("UPDATE misoctrls SET claimed = 1, verifydesign = 0, user = ?, role = ? WHERE filename = ?", [username, role, fileName], (err, results) =>{
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
      }
    });
}

module.exports = {
    singleClaim
  };