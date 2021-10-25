const sql = require("../../db.js");
const qtrackerMiddleware = require("../qtracker/qtracker.middleware");
const nodemailer = require("nodemailer");

const requestNWC = async(req, res) =>{
    const spref = req.body.spref
    const description = req.body.description
    const email = req.body.user
    let user_id = null
    let ref_code = "NWC000001"

    sql.query("SELECT id FROM qtracker_not_working_component ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "NWC000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_not_working_component(incidence_number, spref, description, user_id) VALUES(?,?,?,?)", [ref_code, spref, description, user_id], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.status(401)
                    }else{
                        

                        // create reusable transporter object using the default SMTP transport
                        var transporter = nodemailer.createTransport({
                            host: "es001vs0064",
                            port: 25,
                            secure: false,
                            auth: {
                                user: "alex.dominguez-ortega@external.technipenergies.com",
                                pass: "Technipenergies21"
                            }
                        });

                          transporter.sendMail({
                            from: 'alex.dominguez-ortega@external.technipenergies.com"',
                            to: 'alex.dominguez-ortega@external.technipenergies.com, jorge.reyes-sztayzel@technipenergies.com',
                            subject: 'Message',
                            text: 'I hope this message gets delivered!',
                            html: "<p>HTML version of the message</p>"
                        }, (err, info) => {
                            console.log(info.envelope);
                            console.log(info.messageId);
                        });
                          
                          sql.query("SELECT id FROM roles WHERE `code` = ?)", ["E3D"], (err, results)=>{
                            const admin_id = 14
                            sql.query("SELECT DISTINCT model_id FROM model_has_roles WHERE role_id = ?", [admin_id], (err, results)=>{
                                if(!results[0]){
                                    console.log("No users with materials role")
                                    res.status(200)
                                }else{
                                    const recievers = results
                                    sql.query("SELECT id, name FROM users WHERE email = ?", [email],(err, results)=>{
                                        const sender = results[0].id
                                        const sender_name = results[0].name
                                        for(let i = 0; i < recievers.length; i++){
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New NWC request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
                                                if(err){
                                                    console.log(err)
                                                    res.status(401)
                                                }else{
                                                    
                                                }
                                            })
                                        }
                                        console.log("Request sent")
            
                                    })
                                }
                            })
            
                        })
                        res.send({filename: ref_code}).status(200)
                    }
                })
            }
        })
       
    })
}

const uploadAttach = async(req, res) =>{
    try{   
        await qtrackerMiddleware.uploadAttach(req, res);
        
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }
        
            res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
        });
            
        
    }catch(err){
        res.json({
            error: true,
          }).status(401);
    }
}

module.exports = {
    requestNWC,
    uploadAttach
  };