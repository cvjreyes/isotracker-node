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
                if(err || !results[0]){               
                    res.send({success: 1}).status(200)
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

const getListsData = async(req, res) =>{
    let descriptionPlaneData = []
    let diametersData = []
    let ratingData = []
    let specData = []
    let endPreparationData = []
    let boltTypesData = []

    sql.query("SELECT description_plan_code FROM description_plans", (err, results)=>{
        if(err){
            res.status(401)
        }else{
            for(let i = 0; i < results.length; i++){
                descriptionPlaneData.push(results[i].description_plan_code)
            }
            sql.query("SELECT nps, dn FROM diameters ORDER BY nps ASC", (err, results)=>{
                if(err){
                    res.status(401)
                }else{
                    if(process.env.REACT_APP_MMDN === "0"){
                        for(let i = 0; i < results.length; i++){
                            diametersData.push(results[i].nps)
                        }
                    }else{
                        for(let i = 0; i < results.length; i++){
                            diametersData.push(results[i].dn)
                        }
                    }
                    sql.query("SELECT rating FROM ratings", (err, results)=>{
                        if(err){
                            res.status(401)
                        }else{                          
                            for(let i = 0; i < results.length; i++){
                                ratingData.push(results[i].rating)
                            }
                            sql.query("SELECT spec FROM specs", (err, results)=>{
                                if(err){
                                    res.status(401)
                                }else{                          
                                    for(let i = 0; i < results.length; i++){
                                        specData.push(results[i].spec)
                                    }
                                    sql.query("SELECT state FROM end_preparations", (err, results)=>{
                                        if(err){
                                            res.status(401)
                                        }else{                          
                                            for(let i = 0; i < results.length; i++){
                                                endPreparationData.push(results[i].state)
                                            }
                                            sql.query("SELECT type FROM bolt_types", (err, results)=>{
                                                if(err){
                                                    res.status(401)
                                                }else{                          
                                                    for(let i = 0; i < results.length; i++){
                                                        boltTypesData.push(results[i].type)
                                                    }
                                                    res.json({
                                                        descriptionPlaneData: descriptionPlaneData,
                                                        diametersData: diametersData,
                                                        ratingData: ratingData,
                                                        specData: specData,
                                                        endPreparationData: endPreparationData,
                                                        boltTypesData: boltTypesData
                                                    }).status(200)
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
    })
}

const submitCSP = async(req, res) =>{
    const rows = req.body.rows
    await sql.query("TRUNCATE csptracker_bak", (err, results)=>{
        if(err){
            console.log(err)
            res.status(401)
        }else{
            sql.query("INSERT INTO csptracker_bak SELECT * FROM csptracker", (err, results)=>{
                if(err){
                    console.log(err)
                    res.status(401)
                }else{
                    sql.query("TRUNCATE csptracker", (err, results)=>{
                        if(err){
                            console.log(err)
                            res.status(401)
                        }else{
                            for(let i = 0; i < rows.length; i++){  
                                if(rows[i].tag != "" && rows[i].tag != null){ 
                                    let drawing_code = null
                                    sql.query("SELECT id FROM description_plans WHERE description_plan_code = ?", rows[i].description_plan_code, (err, results)=>{
                                        if(!results){
                                            results = []
                                            results[0] = null
                                        }
                                        if(!results){
                                            results[0] = null
                                        }
                                        if(!results[0] && rows[i].description_plan_code != null && rows[i].description_plan_code != ""){
                                            sql.query("INSERT INTO description_plans(description_plan_code) VALUES(?)", rows[i].description_plan_code, (err, results)=>{
                                                if(err){
                                                    console.log(err)
                                                    res.status(401)
                                                }
                                            })
                                        }
                                        sql.query("SELECT id FROM description_plans WHERE description_plan_code = ?", rows[i].description_plan_code, (err, results)=>{
                                            if(!results){
                                                results = []
                                                results[0] = null
                                            }
                                            if(!results[0]){
                                                drawing_code = null
                                            }else{
                                                drawing_code = rows[i].description_plan_code
                                                rows[i].description_plan_code = results[0].id
                                            }
                                            
                                            if(process.env.REACT_APP_MMDN == "0"){
                                                sql.query("SELECT id FROM diameters WHERE nps = ?", rows[i].p1diameter_nps, (err, results)=>{
                                                    if(!results){
                                                        results = []
                                                        results[0] = null
                                                    }
                                                    if(!results[0]){
                                                        rows[i].p1diameter_nps = null
                                                    }else{
                                                        rows[i].p1diameter_nps = results[0].id 
                                                    }
                                                    sql.query("SELECT id FROM diameters WHERE nps = ?", rows[i].p2diameter_nps, (err, results)=>{
                                                        if(!results){
                                                            results = []
                                                            results[0] = null
                                                        }
                                                        if(!results[0]){
                                                            rows[i].p2diameter_nps = null
                                                        }else{
                                                            rows[i].p2diameter_nps = results[0].id
                                                        } 
                                                        sql.query("SELECT id FROM diameters WHERE nps = ?", rows[i].p3diameter_nps, (err, results)=>{
                                                            if(!results){
                                                                results = []
                                                                results[0] = null
                                                            }
                                                            if(!results[0]){
                                                                rows[i].p3diameter_nps = null
                                                            }else{
                                                                rows[i].p3diameter_nps = results[0].id 
                                                            }
                                                            sql.query("SELECT id FROM ratings WHERE rating = ?", rows[i].rating, (err, results)=>{
                                                                if(!results){
                                                                    results = []
                                                                    results[0] = null
                                                                }
                                                                if(!results[0]){
                                                                    rows[i].rating = null
                                                                }else{
                                                                    rows[i].rating = results[0].id
                                                                }
                                                                sql.query("SELECT id FROM specs WHERE spec = ?", rows[i].spec, (err, results)=>{
                                                                    if(!results){
                                                                        results = []
                                                                        results[0] = null
                                                                    }
                                                                    if(!results[0]){
                                                                        rows[i].spec = null
                                                                    }else{
                                                                        rows[i].spec = results[0].id
                                                                    }
                                                                    sql.query("SELECT id FROM end_preparations WHERE state = ?", rows[i].end_preparation, (err, results)=>{
                                                                        if(!results){
                                                                            results = []
                                                                            results[0] = null
                                                                        }
                                                                        if(!results[0]){
                                                                            rows[i].end_preparation = null
                                                                        }else{
                                                                            rows[i].end_preparation = results[0].id
                                                                        }
                                                                        sql.query("SELECT id FROM bolt_types WHERE type = ?", rows[i].bolt_type, (err, results)=>{
                                                                            if(!results){
                                                                                results = []
                                                                                results[0] = null
                                                                            }
                                                                            if(!results[0]){
                                                                                rows[i].bolt_type = null
                                                                            }else{
                                                                                rows[i].bolt_type = results[0].id
                                                                            }
                                                                            let description_drawings_id = 0
                                                                            sql.query("SELECT description_drawings_id FROM description_plans WHERE description_plan_code = ?", drawing_code, (err, results)=>{
                                                                                if(!results){
                                                                                    results = []
                                                                                    results[0] = null
                                                                                }
                                                                                if(!results[0]){
                                                                                    description_drawings_id = null
                                                                                }else{
                                                                                    description_drawings_id = results[0].description_drawings_id
                                                                                }
                                                                                sql.query("INSERT INTO csptracker(tag, quantity, description, description_plans_id, description_iso, ident, p1_diameters_id, p2_diameters_id, p3_diameters_id, ratings_id, specs_id, type, end_preparations_id, description_drawings_id, face_to_face, bolts, bolt_types_id, ready_load, ready_e3d, comments) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [rows[i].tag, rows[i].quantity, rows[i].description, rows[i].description_plan_code, rows[i].description_iso, rows[i].ident, rows[i].p1diameter_nps, rows[i].p2diameter_nps, rows[i].p3diameter_nps, rows[i].rating, rows[i].spec, rows[i].type, rows[i].end_preparation, description_drawings_id,rows[i].face_to_face, rows[i].bolts, rows[i].bolt_type, rows[i].ready_load, rows[i].ready_e3d, rows[i].comments], (err, results)=>{
                                                                                    if(err){
                                                                                        console.log(err)
                                                                                        res.status(401)
                                                                                    }else{
                                                                                        
                                                                                    }
                                                                                })
                                                                            })
                                                                            
                                                                                                    
                                                                        })
                                                                                            
                                                                    })
                                                                                
                                                                })
                                                                            
                                                            })
                                                                    
                                                        })
                                                            
                                                    })
                                                    
                                                })
                                            }else{
                                                sql.query("SELECT id FROM diameters WHERE dn = ?", rows[i].p1diameter_dn, (err, results)=>{
                                                    if(!results){
                                                        results = []
                                                        results[0] = null
                                                    }
                                                    if(!results[0]){
                                                        p1_diameters_id = null
                                                    }else{
                                                        p1_diameters_id = results[0].id 
                                                    }
                                                    sql.query("SELECT id FROM diameters WHERE dn = ?", rows[i].p2diameter_dn, (err, results)=>{
                                                        if(!results){
                                                            results = []
                                                            results[0] = null
                                                        }
                                                        if(!results[0]){
                                                            p2_diameters_id = null
                                                        }else{
                                                            p2_diameters_id = results[0].id
                                                        } 
                                                        sql.query("SELECT id FROM diameters WHERE dn = ?", rows[i].p3diameter_dn, (err, results)=>{
                                                            if(!results){
                                                                results = []
                                                                results[0] = null
                                                            }
                                                            if(!results[0]){
                                                                p3_diameters_id = null
                                                            }else{
                                                                p3_diameters_id = results[0].id 
                                                            }
                                                            sql.query("SELECT id FROM ratings WHERE rating = ?", rows[i].rating, (err, results)=>{
                                                                if(!results){
                                                                    results = []
                                                                    results[0] = null
                                                                }
                                                                if(!results[0]){
                                                                    ratings_id = null
                                                                }else{
                                                                    ratings_id = results[0].id
                                                                }
                                                                sql.query("SELECT id FROM specs WHERE spec = ?", rows[i].spec, (err, results)=>{
                                                                    if(!results){
                                                                        results = []
                                                                        results[0] = null
                                                                    }
                                                                    if(!results[0]){
                                                                        specs_id = null
                                                                    }else{
                                                                        specs_id = results[0].id
                                                                    }
                                                                    sql.query("SELECT id FROM end_preparations WHERE state = ?", rows[i].end_preparation, (err, results)=>{
                                                                        if(!results){
                                                                            results = []
                                                                            results[0] = null
                                                                        }
                                                                        if(!results[0]){
                                                                            end_preparations_id = null
                                                                        }else{
                                                                            end_preparations_id = results[0].id
                                                                        }
                                                                        sql.query("SELECT id FROM bolt_types WHERE type = ?", rows[i].bolt_type, (err, results)=>{
                                                                            if(!results){
                                                                                results = []
                                                                                results[0] = null
                                                                            }
                                                                            if(!results[0]){
                                                                                bolt_types_id = null
                                                                            }else{
                                                                                bolt_types_id = results[0].id
                                                                            }
                                                                            sql.query("SELECT description_drawings_id FROM description_plans WHERE description_plan_code = ?", rows[i].description_plan_code, (err, results)=>{
                                                                                if(!results){
                                                                                    results = []
                                                                                    results[0] = null
                                                                                }
                                                                                if(!results[0]){
                                                                                    description_drawings_id = null
                                                                                }else{
                                                                                    description_drawings_id = results[0].description_drawings_id
                                                                                }
                                                                                sql.query("INSERT INTO csptracker(tag, quantity, description, description_plans_id, description_iso, ident, p1_diameters_id, p2_diameters_id, p3_diameters_id, ratings_id, specs_id, type, end_preparations_id, description_drawings_id, bolts, bolt_types_id, ready_load, ready_e3d, comments) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [rows[i].tag, rows[i].quantity, rows[i].description, description_plans_id, rows[i].description_iso, rows[i].ident, p1_diameters_id, p2_diameters_id, p3_diameters_id, ratings_id, specs_id, rows[i].type, end_preparations_id, description_drawings_id, rows[i].bolts, bolt_types_id, rows[i].ready_load, rows[i].ready_e3d, rows[i].comments], (err, results)=>{
                                                                                    if(err){
                                                                                        console.log(err)
                                                                                        res.status(401)
                                                                                    }else{
                                                                                    }
                                                                                })
                                                                            })
                                                                            
                                                                                                    
                                                                        })
                                                                                            
                                                                    })
                                                                                
                                                                })
                                                                            
                                                            })
                                                                    
                                                        })
                                                            
                                                    })
                                                    
                                                })
                                            }
                                            
                                        })

                                    })
                            }
                            }
                        }
                    })
                    
                }
            })
        }
        res.send({success: 1}).status(200)
    })
    
}

const tags = async(req, res) =>{
    sql.query("SELECT tag FROM csptracker_fullview", (err, results)=>{
        if(!results[0]){
            res.send({none:1}).status(200)
        }else{
            let tags = []
            for(let i = 0; i < results.length; i++){
                tags.push(results[i].tag)
            }
            res.send({tags: tags}).status(200)
        }
    })
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
    getDrawing,
    getListsData,
    submitCSP,
    tags
  };