const sql = require("../../db.js");
const fs = require("fs");
const drawingMiddleware = require("../csptracker/csptracker.middleware");

const csptracker = (req, res) =>{
    sql.query("SELECT * FROM csptracker_fullview", (err, results)=>{
        if(err){
            console.log(err)
            res.status(401)
        }else{
            res.json({rows: results}).status(200)
        }
    })
}

const readye3d = (req, res) =>{
    sql.query("UPDATE csptracker SET ready_e3d = 1 WHERE tag = ?", [req.body.tag], (err, results) =>{
        if(err){
            res.status(401)
            console.log(err)
        }else{
            res.send({success: 1}).status(200)
        }
    })
}

const cancelReadye3d = (req, res) =>{
    sql.query("UPDATE csptracker SET ready_e3d = 0 WHERE tag = ?", [req.body.tag], (err, results) =>{
        if(err){
            res.status(401)
            console.log(error)
        }else{
            res.send({success: 1}).status(200)
        }
    })
}

const uploadDrawing = async(req, res) =>{
    try{   
        await drawingMiddleware.uploadFileMiddleware(req, res);
        console.log(req.file.filename)
        sql.query("SELECT * FROM description_drawings WHERE filename = ?", req.file.filename, (err, results)=>{
            if(!results[0]){
                res.send({error: true}).status(401)
            }else{
                if (req.file == undefined) {
                    return res.status(400).send({ message: "Please upload a file!" });
                }

                    res.status(200).send({
                    message: "Uploaded the file successfully: " + req.file.originalname,
                });
            }
        })
    }catch(err){
        res.json({
            error: true,
          }).status(401);
    }
    
}

const uploadDrawingDB = (req, res) =>{
    const code = req.body.description_plan_code
    const fileName = req.body.filename


    sql.query("INSERT INTO description_drawings(filename) VALUES(?)", fileName , (err, results)=>{
        if(err){
            console.log(err)
            res.status(401)
        }else{
            sql.query("SELECT id FROM description_drawings WHERE filename = ?", fileName, (err, results)=>{
                if(!results){
                    console.log("No existe en drawings")
                }else{
                    const id = results[0].id
                    sql.query("UPDATE description_plans SET description_drawings_id = ? WHERE description_plan_code = ?", [id, code], (err, results)=>{
                        if(err){
                            console.log(err)
                            res.status(401)
                        }else{
                            sql.query("SELECT id FROM description_plans WHERE description_plan_code = ?", code, (err, results)=>{
                                if(!results){
                                    console.log(err)
                                    res.status(401)
                                }else{
                                    const plane_id = results[0].id
                                    sql.query("UPDATE csptracker SET description_drawings_id = ? WHERE description_plans_id = ?", [id, plane_id], (err, results)=>{
                                        if(err){
                                            console.log(err)
                                            res.status(401)
                                        }else{
                                            res.send({success: 1}).status(200)
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
}

const updateDrawing = async(req, res) =>{
    try{   
        await drawingMiddleware.updateFileMiddleware(req, res);
        console.log(req.file.filename)
        sql.query("SELECT * FROM description_drawings WHERE filename = ?", req.file.filename, (err, results)=>{
            if(!results[0]){
                res.send({error: true}).status(401)
            }else{
                if (req.file == undefined) {
                    return res.status(400).send({ message: "Please upload a file!" });
                }

                    res.status(200).send({
                    message: "Uploaded the file successfully: " + req.file.originalname,
                });
            }
        })
    }catch(err){
        res.json({
            error: true,
          }).status(401);
    }
}

const editCSP = async(req, res) =>{
    const email = req.body.user
    sql.query("SELECT user_id FROM editing_csp", email, (err, results)=>{
        if(!results[0]){
            sql.query("SELECT id FROM users WHERE email = ?", email, (err, results)=>{
                if(!results[0]){
                    res.status(401)
                }else{
                    const user_id = results[0].id
                    sql.query("INSERT INTO editing_csp(user_id) VALUES(?)", user_id, (err, results)=>{
                        if(err){
                            res.status(401)
                        }else{
                            res.send({success: 1})    
                        }
                    })
                }
            })
        }else{
            const editing_user_id = results[0].user_id
            sql.query("SELECT name FROM users WHERE id = ?", editing_user_id, (err, results)=>{
                if(!results[0]){
                    res.status(401)
                }else{
                    res.send({user: results[0].name}).status(200)
                }
            })
        }
    })
    
}

const exitEditCSP = async(req, res) =>{
    const email = req.body.user
    sql.query("SELECT id FROM users WHERE email = ?", email, (err, results)=>{
        if(!results[0]){
            res.status(401)
        }else{
            const user_id = results[0].id
            sql.query("SELECT id FROM editing_csp WHERE user_id = ?", user_id, (err, results)=>{
                if(err){
                    res.status(401)
                }else{
                    sql.query("TRUNCATE editing_csp", (err, results)=>{
                        if(err){
                            res.status(401)
                        }else{
                            res.send({success: 1}).status(200)
                        }
                    }) 
                }
            })
        }
    })
    
}

const getDrawing = async(req, res) =>{
    const fileName = req.params.fileName
    let path = './app/storage/drawings/' + fileName;
    if (fs.existsSync(path)) {
        var file = fs.createReadStream(path);
        file.pipe(res);
    }
    
}

module.exports = {
    csptracker,
    readye3d,
    cancelReadye3d,
    uploadDrawing,
    uploadDrawingDB,
    updateDrawing,
    editCSP,
    exitEditCSP,
    getDrawing
  };