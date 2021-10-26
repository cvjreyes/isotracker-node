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

                        const html_message = "<p><b>INCIDENCE</b> NOT WORKING COMPONENT</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>SPREF</b> " + spref + "</p> <p><b>DESCRIPTION</b> " + description + "</p>"

                          transporter.sendMail({
                            from: 'alex.dominguez-ortega@external.technipenergies.com"',
                            to: 'alex.dominguez-ortega@external.technipenergies.com',
                            subject: 'Not working component '+ ref_code,
                            text: ref_code,
                            
                            html: html_message
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

const requestNVN = async(req, res) =>{
    const name = req.body.name
    const description = req.body.description
    const email = req.body.user
    let user_id = null
    let ref_code = "NVN000001"

    sql.query("SELECT id FROM qtracker_not_view_in_navis ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "NVN000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_not_view_in_navis(incidence_number, name, description, user_id) VALUES(?,?,?,?)", [ref_code, name, description, user_id], (err, results) =>{
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

                        const html_message = "<p><b>INCIDENCE</b> NOT VIEW IN NAVIS</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>NAME</b> " + name + "</p> <p><b>DESCRIPTION</b> " + description + "</p>"

                        transporter.sendMail({
                          from: 'alex.dominguez-ortega@external.technipenergies.com"',
                          to: 'alex.dominguez-ortega@external.technipenergies.com',
                          subject: 'Not view in Navis '+ ref_code,
                          text: ref_code,
                          
                          html: html_message
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
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New NVN request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
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

const requestNRI = async(req, res) =>{
    const pipe = req.body.pipe
    const description = req.body.description
    const email = req.body.user
    let user_id = null
    let ref_code = "NRI000001"

    sql.query("SELECT id FROM qtracker_not_reporting_isometric ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "NRI000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_not_reporting_isometric(incidence_number, pipe, description, user_id) VALUES(?,?,?,?)", [ref_code, pipe, description, user_id], (err, results) =>{
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

                        const html_message = "<p><b>INCIDENCE</b> NOT REPORTING IN ISOMETRIC</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>PIPE</b> " + pipe + "</p> <p><b>DESCRIPTION</b> " + description + "</p>"

                        transporter.sendMail({
                          from: 'alex.dominguez-ortega@external.technipenergies.com"',
                          to: 'alex.dominguez-ortega@external.technipenergies.com',
                          subject: 'Not reporting in Isometric '+ ref_code,
                          text: ref_code,
                          
                          html: html_message
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
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New NRI request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
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

const requestNRB = async(req, res) =>{
    const pipe = req.body.pipe
    const description = req.body.description
    const email = req.body.user
    let user_id = null
    let ref_code = "NRB000001"

    sql.query("SELECT id FROM qtracker_not_reporting_bfile ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "NRB000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_not_reporting_bfile(incidence_number, pipe, description, user_id) VALUES(?,?,?,?)", [ref_code, pipe, description, user_id], (err, results) =>{
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

                        const html_message = "<p><b>INCIDENCE</b> NOT REPORTING IN BFILE</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>PIPE</b> " + pipe + "</p> <p><b>DESCRIPTION</b> " + description + "</p>"

                        transporter.sendMail({
                          from: 'alex.dominguez-ortega@external.technipenergies.com"',
                          to: 'alex.dominguez-ortega@external.technipenergies.com',
                          subject: 'Not reporting in Bfile '+ ref_code,
                          text: ref_code,
                          
                          html: html_message
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
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New NRB request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
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

const requestNRIDS = async(req, res) =>{
    const name = req.body.name
    const email = req.body.user
    let user_id = null
    let ref_code = "NRIDS000001"

    sql.query("SELECT id FROM qtracker_not_reporting_ifc_dgn_step ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "NRIDS000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_not_reporting_ifc_dgn_step(incidence_number, name, user_id) VALUES(?,?,?)", [ref_code, name, user_id], (err, results) =>{
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

                        const html_message = "<p><b>INCIDENCE</b> NOT REPORTING IN IFC/DGN/STEP</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>NAME</b> " + name + "</p>"

                        transporter.sendMail({
                          from: 'alex.dominguez-ortega@external.technipenergies.com"',
                          to: 'alex.dominguez-ortega@external.technipenergies.com',
                          subject: 'Not reporting in IFC/DGN/STEP '+ ref_code,
                          text: ref_code,
                          
                          html: html_message
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
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New NRIDS request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
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

const requestRR = async(req, res) =>{
    const scope = req.body.scope
    const items = req.body.items
    const description = req.body.description
    const email = req.body.user
    let user_id = null
    let ref_code = "RR000001"

    sql.query("SELECT id FROM qtracker_request_report ORDER BY id DESC LIMIT 1", (err, results) =>{
        if(!results){
            results = []
            results[0] = null
        }
        if(!results[0]){

        }else{
            ref_code = "RR000000".substring(0, ref_code.length - (results[0].id + 1).toString().length) + (results[0].id + 1).toString()
        }
        sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results)=>{
            if(!results[0]){
                res.status(401)
            }else{
                user_id = results[0].id
                sql.query("INSERT INTO qtracker_request_report(incidence_number, items_to_report, scope, description, user_id) VALUES(?,?,?,?,?)", [ref_code, items, scope, description, user_id], (err, results) =>{
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

                        const html_message = "<p><b>INCIDENCE</b> REQUEST REPORT</p> <p><b>REFERENCE</b> " + ref_code + " </p> <p><b>USER</b> " + email + "</p> <p><b>ITEMS TO REPORT</b> " + items + "</p>" + "</p> <p><b>SCOPE</b> " + scope + "</p>" + "</p> <p><b>DESCRIPTION</b> " + description + "</p>"

                        transporter.sendMail({
                          from: 'alex.dominguez-ortega@external.technipenergies.com"',
                          to: 'alex.dominguez-ortega@external.technipenergies.com',
                          subject: 'Request report '+ ref_code,
                          text: ref_code,
                          
                          html: html_message
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
                                            
                                            sql.query("INSERT INTO notifications(users_id, text) VALUES(?,?)", [recievers[i].model_id, "New RR request (" + ref_code +") by " + sender_name + "."], (err, results)=>{
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

const getNWC = async(req, res) =>{
    sql.query("SELECT qtracker_not_working_component.*, users.name as user FROM qtracker_not_working_component LEFT JOIN users ON qtracker_not_working_component.user_id = users.id", (err, results) =>{
        res.json({rows: results}).status(200)
    })
}

const getNVN = async(req, res) =>{
    sql.query("SELECT qtracker_not_view_in_navis.*, users.name as user FROM qtracker_not_view_in_navis LEFT JOIN users ON qtracker_not_view_in_navis.user_id = users.id", (err, results) =>{
        res.json({rows: results}).status(200)
    })
}

module.exports = {
    requestNWC,
    requestNVN,
    requestNRI,
    requestNRB,
    requestNRIDS,
    requestRR,
    uploadAttach,
    getNWC,
    getNVN
  };