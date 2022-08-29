const sql = require("../../db.js");
const { findByEmail } = require("../users/user.model.js");

const singleClaim = async (req, res) => {
    const user = req.body.user
    const fileName = req.body.file
    const role = req.body.role

    var username = ""

    sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
      }
    });

    sql.query('SELECT * FROM dpipes_view WHERE isoid COLLATE utf8mb4_unicode_ci = ?', [fileName.split('.').slice(0, -1)], (err, results)=>{
      if(!results[0] && process.env.NODE_PROGRESS == "1"){
        sql.query('UPDATE misoctrls SET blocked = 1 WHERE filename = ?', [fileName], (err, results)=>{
          res.status(200).send({blocked:"1"})
          
        })
      }else{
        sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
          if (!results[0]){
            res.status(401).send("The file does not exist");
          }else if (results[0].claimed == 1 && role !== "DesignLead" && role !== "SupportsLead" && role !== "StressLead" && results.verifydesign === 1){   
            res.status(401).send("This isometric has already been claimed");
          }else{
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
                  sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, `from`, `to`, comments, user, role) VALUES (?,?,?,?,?,?,?,?,?,?)", 
                  [fileName, last.revision, last.spo, last.sit, 1, tray, "Claimed" , null, username, role, 0], (err, results) => {
                  if (err) {
                      console.log("error: ", err);
                  }else{
                      sql.query("UPDATE misoctrls SET claimed = 1, forced = 0, verifydesign = 0, user = ?, role = ? WHERE filename = ?", [username, role, fileName], (err, results) =>{
                          if (err) {
                              console.log("error: ", err);
                          }else{
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
    
  })
}

const singleClaimProc = async(req, res) =>{
  const user = req.body.user
  const fileName = req.body.file
  const role = req.body.role

  var username = "";


  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if (!results[0]){
          res.status(401).send("The file does not exist");
        }else if (results[0].spoclaimed == 1){   
          res.status(401).send("This isometric has already been claimed");
        }else{
          let spouser = results[0].spouser
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
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, spoclaimed, verifydesign, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                [fileName, last.revision, last.spo, last.sit, 1, last.verifydesign, "Process", "Claimed" , last.comments, username, role, last.created_at], (err, results) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    let spo = 1
                    if(spouser){
                      spo = 4
                    }
                    sql.query("UPDATE misoctrls SET spoclaimed = 1, spouser = ?, spo = ? WHERE filename = ?", [username, spo, fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
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
  });
}

const singleClaimInst = async(req, res) =>{
  const user = req.body.user
  const fileName = req.body.file
  const role = req.body.role

  var username = "";


  sql.query('SELECT * FROM users WHERE email = ?', [req.body.user], (err, results) =>{
    if (!results[0]){
      res.status(401).send("Username or password incorrect");
    }else{   
      username  = results[0].name
      sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
        if (!results[0]){
          res.status(401).send("The file does not exist");
        }else if (results[0].sitclaimed == 1){   
          res.status(401).send("This isometric has already been claimed");        
        }else{
          situser = results[0].situser
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
                sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, sitclaimed, verifydesign, `from`, `to`, comments, user, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", 
                [fileName, last.revision, last.spo, last.sit, 1, last.verifydesign, "Instrument", "Claimed" , last.comments, username, role, last.created_at], (err, results) => {
                if (err) {
                    console.log("error: ", err);
                }else{
                    let sit = 1
                    if(situser){
                      sit = 4
                    }
                    sql.query("UPDATE misoctrls SET sitclaimed = 1, situser = ?, sit = ? WHERE filename = ?", [username, sit, fileName], (err, results) =>{
                        if (err) {
                            console.log("error: ", err);
                        }else{
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
  });
}

const forceClaim = async(req,res) =>{
  sql.query('SELECT * FROM users WHERE email = ?', [req.body.los], (err, results) =>{
    if (!results[0]){
      res.status(401).send("User not found");
    }else{   
      const los  = results[0].name
      const fileName = req.body.file
      const role_acr = req.body.user.substring(0,3)
      const user = req.body.user.substring(6,req.body.user.length)
      sql.query('SELECT name FROM roles WHERE code = ?', [role_acr], (err, results) =>{
        if (!results[0]){
          res.status(401).send("Role not found");
        }else{
          const role = results[0].name
          sql.query('SELECT * FROM misoctrls WHERE filename = ?', [fileName], (err, results) =>{
            if (!results[0]){
              res.status(401).send("The file does not exist");
            }else if (results[0].claimed == 1){   
              res.status(401).send("This isometric has already been claimed");
            }else{
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
                    sql.query("INSERT INTO hisoctrls (filename, revision, spo, sit, claimed, verifydesign, `from`, `to`, comments, user, role, forced, forceduser, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
                    [fileName, last.revision, last.spo, last.sit, 1, 0, tray, tray , "FC-" + user + "-" + role , los, "SpecialityLead", 1, user,last.created_at], (err, results) => {
                    if (err) {
                        console.log("error: ", err);
                    }else{
                        sql.query("UPDATE misoctrls SET claimed = 1, verifydesign = 0, user = ?, role = ?, forced = 1, forceduser = ? WHERE filename = ?", [user, role, los, fileName], (err, results) =>{
                            if (err) {
                                console.log("error: ", err);
                            }else{
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
      })
    }
  });
}



module.exports = {
    singleClaim,
    singleClaimProc,
    singleClaimInst,
    forceClaim,
  };