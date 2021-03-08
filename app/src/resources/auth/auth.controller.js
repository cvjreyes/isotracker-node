const jwt = require('jsonwebtoken');
const sql = require("../../db.js");
const md5 = require("md5");

const login = async(req, res) => {
    const { email, password } = req.body;
    
    sql.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }
      else if(md5(password) !== results[0].password){
        res.status(401).send("Username or password incorrect");
      }else{
        const user_id = results[0].id;
        const token = jwt.sign({email: email, role: 'admin'}, "oXJYM2pcaH5S0LlNgirrBwHOo4s5Dbeh2MMHZNYqCvLA8fGM5OGm9ddxQM8UrGoFCzW1pyN4ZZMBj5dL");
        sql.query('SELECT * FROM model_has_roles WHERE model_id = ?', [user_id], async (err, results) =>{
          if (err){
            res.status(401).send("Roles not found");
          }else{
            var q = 'SELECT name FROM roles WHERE id IN (';
            if (results.length === 1){
              q += results[0].role_id + ")";
            }else if(results.length === 2){
              q += results[0].role_id + "," + results[1].role_id + ")";
            }else{
              for (var i = 0; i < results.length; i++){
                if(i === 0){
                  q += results[i].role_id;
                }else if(i === results.length - 1){
                  q += results[i].role_id + ")";                
                }else{
                  q += "," + results[i].role_id + ",";
                }
              }
            }
            console.log(q)
            sql.query(q, async (err, results) =>{
              if(err){
                console.log(err)
                res.status(401).send("Roles not found");
              }else{
                var user_roles = [];
                for (var i = 0; i < results.length; i++){
                  user_roles.push(results[i].name)
                }

                res.json({
                  token: token,
                  user: email,
                  roles: user_roles
                });
              }
            })
         
          }
        })
        
        console.log("connected");
      }
    });
    
};

module.exports = {
  login
};

