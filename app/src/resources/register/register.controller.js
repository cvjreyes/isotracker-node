const sql = require("../../db.js");
const md5 = require("md5");

const registerUser = async(req, res) => {
    const { userName, email, role } = req.body;
    
    console.log(userName, email,role);

    sql.query('INSERT INTO users (name, email, password, remember_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [userName, email, md5("123456"), "asd", "2", "2"], async (err, result)=>{
        if(err){
            console.log(err)
            res.status(401).send("Error creating user");
        }else{
            res.status(200).send("User added");
        }
    })
    
};

module.exports = {
    registerUser
  };