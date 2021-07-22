const fs = require('fs');
const sql = require("../../db.js");

exports.getFilesByTray = async(req, res) => {
    var myFiles = [];
    var folderNum = 3;
    var body = req.body;
    let role = body.currentRole;
    let user = body.currentUser;

    var username = "";
    sql.query('SELECT * FROM users WHERE email = ?', [user], (err, results) =>{
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }else{   
        username  = results[0].name
        sql.query('SELECT num FROM roles WHERE name = ?', [role], async (err, results) => {
          if (!results[0]){
            res.status(401).send("Username or password incorrect");
          }else{   
            var folder = '';
            folderNum = results[0].num;
            switch(folderNum){
              case 1:
                folder = "design";
                break;
              case 2:
                folder = "stress";
                break;
              case 3:
                folder = "supports";
                break;
              case 4:
                folder = "materials";
                break;
              case 5:
                folder = "issuer";
                break;
              case 6:
                folder = "LDE/Isocontrol";
                break;
            }
            
          }
          if(role == "Process"){
            sql.query('SELECT * FROM misoctrls WHERE spouser = ? AND spoclaimed = 1', [username], async (err, results) => { 
              res.json({
                rows: results
              })
            })
          }else if(role == "Instrument"){
            sql.query('SELECT * FROM misoctrls WHERE situser = ? AND sitclaimed = 1', [username], async (err, results) => { 
              res.json({
                rows: results
              })
            })
          }else{
            sql.query('SELECT * FROM misoctrls WHERE `to` = ? AND user = ? AND role = ? AND claimed = 1', [folder, username, role], async (err, results) => { 
              res.json({
                rows: results
              })
            })
          }
          
        });
      }
    });   
    
  }


