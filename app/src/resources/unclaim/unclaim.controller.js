const sql = require("../../db.js");
const { findByEmail } = require("../users/user.model.js");

const singleUnclaim = async (req, res) => {
    const user = req.body.user
    const fileName = req.body.file
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
            sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, claimed, `from`, `to`, comments, user, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, 0, 0, last.from, last.to , last.comments, "None", last.created_at], (err, results) => {
            if (err) {
                console.log("error: ", err);
            }else{
                console.log("created unclaim in hisoctrls");
                sql.query("UPDATE misoctrls SET claimed = 0, verifydesign = 0, user = ?, role = ? WHERE filename = ?", ["None", null, fileName], (err, results) =>{
                    if (err) {
                        console.log("error: ", err);
                    }else{
                      console.log("unclaimed iso " + fileName);
                      res.status(200).send("unclaimed")
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

const singleUnclaimProc = async(req, res) =>{
  const user = req.body.user
  const fileName = req.body.file
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
          sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, claimed, spoclaimed, `from`, `to`, comments, user, spouser, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
          [fileName, 0, 0, 0, 0, last.claimed, 0, last.from, last.to , last.comments, last.user, "None", last.created_at], (err, results) => {
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

const singleUnclaimInst = async(req, res) =>{
    const user = req.body.user
    const fileName = req.body.file
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
            sql.query("INSERT INTO hisoctrls (filename, revision, tie, spo, sit, claimed, sitclaimed, `from`, `to`, comments, user, situser, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", 
            [fileName, 0, 0, 0, 0, last.claimed, 0, last.from, last.to , last.comments, last.user, "None", last.created_at], (err, results) => {
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

module.exports = {
    singleUnclaim,
    singleUnclaimProc,
    singleUnclaimInst
  };