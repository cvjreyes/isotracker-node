const jwt = require('jsonwebtoken');
const sql = require("../../db.js");
const md5 = require("md5");

const login = async(req, res) => {
    const { email, password } = req.body;
    
    sql.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (!results[0]){
        res.status(401).send("Username or password incorrect");
      }
      else if(md5(password) !== results[0].password){
        res.status(401).send("Username or password incorrect");
      }else{
        const token = jwt.sign({email: email, role: 'admin'}, "oXJYM2pcaH5S0LlNgirrBwHOo4s5Dbeh2MMHZNYqCvLA8fGM5OGm9ddxQM8UrGoFCzW1pyN4ZZMBj5dL");
        res.json({
          token: token,
          user: email
        });
        console.log("connected");
      }
    });
    
};

module.exports = {
  login
};

