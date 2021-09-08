const sql = require("../../db.js");
const fs = require("fs");
const drwaingMiddleware = require("../csptracker/csptracker.middleware");

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
            res.status(200)
        }
    })
}

const cancelReadye3d = (req, res) =>{
    sql.query("UPDATE csptracker SET ready_e3d = 0 WHERE tag = ?", [req.body.tag], (err, results) =>{
        if(err){
            res.status(401)
            console.log(error)
        }else{
            res.status(200)
        }
    })
}

const uploadDrawing = async(req, res) =>{
    try{   
        await drwaingMiddleware.uploadFileMiddleware(req, res);
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
    const code = req.body.description_plane_code
    const fileName = req.body.filename

    console.log(fileName)
    sql.query("INSERT INTO description_drawings(filename) VALUES(?)", fileName , (err, results)=>{
        if(err){
            console.log(err)
            res.status(401)
        }else{
            sql.query("SELECT id FROM description_drawings WHERE filename = ?", fileName, (err, results)=>{
                if(!results[0]){
                    console.log("No existe en drawings")
                }else{
                    const id = results[0].id
                    sql.query("UPDATE description_plans SET description_drawings_id = ?", id, (err, results)=>{
                        if(err){
                            console.log(err)
                            res.status(401)
                        }else{
                            sql.query("UPDATE csptracker SET description_drawings_id = ?", id, (err, results)=>{
                                if(err){
                                    console.log(err)
                                    res.status(401)
                                }else{
                                    res.status(200)
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

module.exports = {
    csptracker,
    readye3d,
    cancelReadye3d,
    uploadDrawing,
    uploadDrawingDB
  };