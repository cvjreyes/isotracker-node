const fs = require('fs');
const sql = require("../../db.js");

const getPipesByStatus = async(req, res) =>{
    const tray = req.params.status

    sql.query("SELECT id FROM pipes_status WHERE name = ?", [tray], (err, results) =>{
        if(!results[0]){
            console.log("Status not found")
            res.status(401)
        }else{
            const status_id = results[0].id
            sql.query("SELECT pipectrls.id, pipectrls.tag, tpipes.code, pipectrls.updated_at, users.name FROM pipectrls LEFT JOIN dpipes ON pipectrls.tag = dpipes.tag LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id LEFT JOIN users ON pipectrls.user_id = users.id WHERE status_id = ?", [status_id], (err, results) =>{
                if(!results[0]){
                    console.log("Status not found")
                    res.status(401)
                }else{
                    res.json({rows: results}).status(200)
                }
            })
        }
    })
}

const claimPipes = async(req, res) =>{
    const user = req.body.user
    const pipes = req.body.pipes

    sql.query("SELECT id FROM users WHERE email = ?", [user], (err, results) =>{
        if(!results[0]){
            console.log("User does not exist")
            res.send({success: false}).status(401)
        }else{
            const user_id = results[0].id
            for(let i = 0; i < pipes.length; i++){
                sql.query("UPDATE pipectrls SET claimed = 1, user_id = ? WHERE id = ?", [user_id, pipes[i]], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.send({success: false}).status(401)
                    }
                })
            }
            res.send({success: true}).status(200)

        }
    })
}

module.exports = {
    getPipesByStatus,
    claimPipes
}