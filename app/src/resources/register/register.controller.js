const sql = require("../../db.js");
const md5 = require("md5");

const registerUser = async(req, res) => {
    const { userName, email, role } = req.body;
    

    sql.query('INSERT INTO users (name, email, password, remember_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [userName, email, md5("123456"), "asd", "2", "2"], async (err, result)=>{
        if(err){
            console.log(err)
            res.status(401).send("Error creating user");
        }else{
            sql.query('SELECT id FROM roles WHERE name = ?', [role], async(err, result) =>{
                if(err){
                    console.log(err)
                    res.status(401).send("Error creating user");
                }else{
                    const role_id = result[0].id;
                    sql.query('SELECT id FROM users WHERE email = ?', [email], async(err, result) =>{
                        if (err){
                            console.log(err);
                            res.status(401).send("Error creating user");
                        }else{
                            const user_id = result[0].id;
                            sql.query('INSERT INTO model_has_roles (role_id, model_id, model_type) VALUES (?,?,?)', [role_id, user_id, "App/User"], async(err, result) =>{
                                if (err) {
                                    console.log(err);
                                    res.status(401).send("Error creating user");
                                }else{
                                    sql.query('INSERT INTO model_has_roles (role_id, model_id, model_type) VALUES (?,?,?)', [15, user_id, "App/User"], async(err, result) =>{
                                        if (err) {
                                            console.log(err);
                                            res.status(401).send("Error creating user");
                                        }else{
                                            res.status(200).send("User added");
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
        
    })
};

module.exports = {
    registerUser
  };