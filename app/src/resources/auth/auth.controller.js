const jwt = require('jsonwebtoken');
const sql = require("../../db.js");
const md5 = require("md5");

//Login en 3dtracker/isotracker
const login = async(req, res) => {
    const { email, password } = req.body; //Se trae el usuario y contraseña que ha puesto el usuario
    
    sql.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {//Select a la bd por el email del user
      if (!results[0]){
        res.status(401).send("Username or password incorrect");//Si no encuentra el user da error
      }
      else if(md5(password) !== results[0].password){//Con md5 se comprueba si el input es igual a la contraseña encriptada en la bd
        res.status(401).send("Username or password incorrect");
      }else{
        const token = jwt.sign({email: email, role: 'admin'}, process.env.NODE_TOKEN_SECRET);//Token de sesion
        
        res.json({
          token: token,
          user: email
        }).status(200); //Se devuelve el token de la sesion
        console.log("The user "+ email +" logged in.");    
      }
    })       
    
};

module.exports = {
  login
};

