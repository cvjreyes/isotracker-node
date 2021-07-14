const fs = require('fs');
const sql = require("../../db.js");

const gpipes = async(req,res) =>{
    sql.query('SELECT * FROM gpipes', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gequips = async(req,res) =>{
    sql.query('SELECT * FROM gequis', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const ginsts = async(req,res) =>{
    sql.query('SELECT * FROM ginsts', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gcivils = (req, res) =>{
    sql.query('SELECT * FROM gcivils', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gelecs = (req, res) =>{
    sql.query('SELECT * FROM gelecs', (err, results)=>{
        res.json({
            rows: results
        }).status(200)
    })
}

const gcurve = (req,res) =>{
    sql.query('SELECT gpipes.week as week, gpipes.progress as progress_pipes, gpipes.estimated as estimated_pipes, gequis.progress as progress_equis, gequis.estimated as estimated_equis, ginsts.progress as progress_insts, ginsts.estimated as estimated_insts, gelecs.progress as progress_elecs, gelecs.estimated as estimated_elecs, gcivils.progress as progress_civils, gcivils.estimated as estimated_civils FROM gpipes JOIN gequis on gpipes.id = gequis.id JOIN ginsts ON gpipes.id = ginsts.id JOIN gelecs ON gpipes.id = gelecs.id JOIN gcivils ON gpipes.id = gcivils.id', (err, results)=>{
        if(err){
            res.status(401)
        }else{

            res.json({
                rows: results
            }).status(200)
        }
        
    })  
}

const submitEquipProgress = (req, res) =>{
    const rows = req.body.rows
    sql.query("TRUNCATE gequis", (err,results) =>{
        if(err){
        res.send({error:1}).status(401)
        }else{
        for(let i = 1; i < rows.length; i++){
            if(rows[i]["Week"] != null && rows[i]["Estimated"] != null){
            sql.query("INSERT INTO gequis(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                if(err){
                console.log(err)
                res.send({error:1}).status(401)
                }
            })
            }  
        }
        res.status(200)
        }
    })
    
}

const submitInstProgress = (req, res) =>{
    const rows = req.body.rows
    sql.query("TRUNCATE ginsts", (err,results) =>{
        if(err){
        res.send({error:1}).status(401)
        }else{
        for(let i = 1; i < rows.length; i++){
            if(rows[i]["Week"] != null && rows[i]["Estimated"] != null){
            sql.query("INSERT INTO ginsts(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                if(err){
                console.log(err)
                res.send({error:1}).status(401)
                }
            })
            }  
        }
        res.status(200)
        }
    })
    
}

const submitCivilProgress = (req, res) =>{
    const rows = req.body.rows
    sql.query("TRUNCATE gcivils", (err,results) =>{
        if(err){
        res.send({error:1}).status(401)
        }else{
        for(let i = 1; i < rows.length; i++){
            if(rows[i]["Week"] != null && rows[i]["Estimated"] != null){
            sql.query("INSERT INTO gcivils(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                if(err){
                console.log(err)
                res.send({error:1}).status(401)
                }
            })
            }  
        }
        res.status(200)
        }
    })
    
}

const submitElecProgress = (req, res) =>{
    const rows = req.body.rows
    sql.query("TRUNCATE gelecs", (err,results) =>{
        if(err){
        res.send({error:1}).status(401)
        }else{
        for(let i = 1; i < rows.length; i++){
            if(rows[i]["Week"] != null && rows[i]["Estimated"] != null){
            sql.query("INSERT INTO gelecs(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                if(err){
                console.log(err)
                res.send({error:1}).status(401)
                }
            })
            }  
        }
        res.status(200)
        }
    })
    
}

const submitPipingProgress = (req, res) =>{
    const rows = req.body.rows
    sql.query("TRUNCATE gpipes", (err,results) =>{
        if(err){
        res.send({error:1}).status(401)
        }else{
        for(let i = 1; i < rows.length; i++){
            if(rows[i]["Week"] != null && rows[i]["Estimated"] != null){
            sql.query("INSERT INTO gpipes(week, estimated) VALUES(?,?)", [rows[i]["Week"], rows[i]["Estimated"]], (err, results)=>{
                if(err){
                console.log(err)
                res.send({error:1}).status(401)
                }
            })
            }  
        }
        res.status(200)
        }
    })
    
}


module.exports = {
    gpipes,
    gequips,
    ginsts,
    gcivils,
    gelecs,
    gcurve,
    submitEquipProgress,
    submitInstProgress,
    submitCivilProgress,
    submitElecProgress,
    submitPipingProgress
  };