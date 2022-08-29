const fs = require('fs');
const sql = require("../../db.js");
var cron = require('node-cron');

const getPipesByStatus = async(req, res) =>{
    const tray = req.params.status
    sql.query("SELECT id FROM pestpipes WHERE name = ?", [tray], (err, results) =>{
        if(!results[0]){
            console.log("Status not found")
            res.send({success: false}).status(401)
        }else{
            let status_ids = []
            for(let i = 0; i < results.length; i++){
                status_ids.push(results[i].id)
            }
            sql.query("SELECT DISTINCT pipectrls.id, pipectrls.tag, pipectrls.status_id, pestpipes.progress, pestpipes.stage1, pipectrls.valves, pipectrls.instruments, tpipes.code, pipectrls.updated_at, users.name, CASE WHEN misoctrls.id IS NULL THEN 'Not in IsoTracker' ELSE 'In IsoTracker' END AS isotracker FROM pipectrls LEFT JOIN dpipes_view ON pipectrls.tag = dpipes_view.tag LEFT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id LEFT JOIN users ON pipectrls.user_id = users.id LEFT JOIN pestpipes ON pipectrls.status_id = pestpipes.id WHERE status_id IN (?) AND pipectrls.`deleted` is null", [status_ids], (err, results) =>{
                if(!results[0]){
                    res.json({rows: []}).status(401)
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

const unclaimPipes = async(req, res) =>{
    const pipes = req.body.pipes

    for(let i = 0; i < pipes.length; i++){
        sql.query("UPDATE pipectrls SET claimed = 0, user_id = null WHERE id = ?", [pipes[i][0]], (err, results) =>{
            if(err){
                console.log(err)
                res.send({success: false}).status(401)
            }
        })
    }
    res.send({success: true}).status(200)
        
}

const pipingMyTray = async(req, res) =>{
    const email = req.params.email

    sql.query("SELECT id FROM users WHERE email = ?", [email], (err, results) =>{
        if(!results[0]){
            console.log("User not found")
            res.send({success: false}).status(401)
        }else{
            const user_id = results[0].id
            sql.query("SELECT DISTINCT pipectrls.id, pipectrls.tag, pipectrls.status_id, pestpipes.name as tray, next_status.name as next, pestpipes.progress, pestpipes.stage1, pipectrls.valves, pipectrls.instruments, tpipes.code, pipectrls.updated_at, users.name, CASE WHEN misoctrls.id IS NULL THEN 'Not in IsoTracker' ELSE 'In IsoTracker' END AS isotracker FROM pipectrls LEFT JOIN dpipes_view ON pipectrls.tag = dpipes_view.tag LEFT JOIN misoctrls ON misoctrls.isoid COLLATE utf8mb4_unicode_ci = dpipes_view.isoid LEFT JOIN tpipes ON dpipes_view.tpipes_id = tpipes.id LEFT JOIN users ON pipectrls.user_id = users.id LEFT JOIN pestpipes ON pipectrls.status_id = pestpipes.id LEFT JOIN pestpipes next_status ON (pipectrls.status_id + 1) = next_status.id  WHERE users.id = ? AND pipectrls.`deleted` is null", [user_id], (err, results) =>{
                if(!results[0]){
                    res.send({rows: []}).status(401)
                }else{
                    res.json({rows: results}).status(200)
                }
            })
        }
    })
}

const nextStep = async(req, res) =>{
    const pipes = req.body.pipes       
    for(let i = 0; i < pipes.length; i++){
        sql.query("SELECT status_id, code FROM pipectrls LEFT JOIN dpipes ON pipectrls.tag = dpipes.tag LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id WHERE pipectrls.id = ?", [pipes[i]], (err, results) =>{
            if(!results[0]){
                res.send({success: false}).status(401)
            }else{
                let next_id = null
                switch(results[0].code){
                    case "TL1":
                        next_id =11
                        break;
                    case "TL2":
                        if(results[0].status_id == 7){
                            next_id = 8
                        }else{
                            next_id = 9
                        }
                        break;
                    case "TL3":
                        next_id = results[0].status_id + 1
                        break;
                    default:
                        break;
                }
                sql.query("UPDATE pipectrls SET claimed = null, user_id = null, status_id = ? WHERE id = ?", [next_id, pipes[i]], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.send({success: false}).status(401)
                    }
                })
            }
        })
        
    }
    res.send({success: true}).status(200)    
}

const sendValves = async(req, res) =>{
    const pipe_id = req.body.id
    sql.query("UPDATE pipectrls SET valves = 1 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
        
}

const sendInstruments = async(req, res) =>{
    const pipe_id = req.body.id
    
    sql.query("UPDATE pipectrls SET instruments = 1 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
}

const sendNA = async(req, res) =>{
    const pipe_id = req.body.id
    
    sql.query("UPDATE pipectrls SET valves = 2, instruments = 2 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
}

const cancelValves = async(req, res) =>{
    const pipe_id = req.body.id
    sql.query("UPDATE pipectrls SET valves = 0 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
}

const cancelInstruments = async(req, res) =>{
    const pipe_id = req.body.id
    sql.query("UPDATE pipectrls SET instruments = 0 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
}

const cancelNA = async(req, res) =>{
    const pipe_id = req.body.id
    sql.query("UPDATE pipectrls SET valves = 0, instruments = 0 WHERE id = ?", [pipe_id], (err, results) =>{
        if(err){
            console.log(err)
            res.send({success: false}).status(401)
        }else{
            res.send({success: true}).status(200)
        }
    })
}

const returnPipes = async(req, res) =>{
    const pipes = req.body.pipes       
    for(let i = 0; i < pipes.length; i++){
        sql.query("SELECT status_id, code FROM pipectrls LEFT JOIN dpipes ON pipectrls.tag = dpipes.tag LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id WHERE pipectrls.id = ?", [pipes[i]], (err, results) =>{
            if(!results[0]){
                res.send({success: false}).status(401)
            }else{
                let next_id = null
                switch(results[0].code){
                    case "TL1":
                        next_id = 10
                        break;
                    case "TL2":
                        if(results[0].status_id == 8){
                            next_id = 7
                        }else{
                            next_id = 8
                        }
                        break;
                    case "TL3":
                        next_id = results[0].status_id - 1
                        break;
                    default:
                        break;
                }
                sql.query("UPDATE pipectrls SET claimed = null, user_id = null, status_id = ? WHERE id = ?", [next_id, pipes[i]], (err, results) =>{
                    if(err){
                        console.log(err)
                        res.send({success: false}).status(401)
                    }
                })
            }
        })
        
    }
    res.send({success: true}).status(200)    
}

const getDeletedPipes = async(req, res) =>{
    sql.query("SELECT pipectrls.id, pipectrls.tag, pipectrls.status_id, tpipes.code, pipectrls.updated_at, users.name FROM pipectrls LEFT JOIN dpipes ON pipectrls.tag = dpipes.tag LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id LEFT JOIN users ON pipectrls.user_id = users.id WHERE `deleted` = 1", (err, results) =>{
        if(!results[0]){
            res.send({rows: []}).status(401)
        }else{
            res.json({rows: results}).status(200)
        }
    })
    
}

const deletePipes = async(req, res) =>{
    const pipes = req.body.pipes       
    for(let i = 0; i < pipes.length; i++){
        sql.query("UPDATE pipectrls SET deleted = 1 WHERE id = ?", [pipes[i]], (err, results) =>{
            if(err){
                console.log(err)
                res.send({success: false}).status(401)
            }
        })
    }
    res.send({success: true}).status(200)    
}

const restorePipes = async(req, res) =>{
    const pipes = req.body.pipes    
    for(let i = 0; i < pipes.length; i++){
        sql.query("UPDATE pipectrls SET deleted = null WHERE id = ?", [pipes[i]], (err, results) =>{
            if(err){
                console.log(err)
                res.send({success: false}).status(401)
            }
        })
    }
    res.send({success: true}).status(200)    
}

const estimatedPipingWeight = async(req, res) =>{
    let estimated_weight = 0, modelled_weight = 0, progress = 0
    await sql.query("SELECT diameter, calc_notes FROM estimated_pipes LEFT JOIN `lines` on estimated_pipes.line_ref_id = `lines`.id", (err, results) =>{
        if(results[0]){
            for(let i = 0; i < results.length; i++){
                if(results[i].calc_notes != "NA"){
                    estimated_weight += 10
                  }else{
                    if((process.env.NODE_MMDN == 1 && results[i].diameter < 2.00) || (process.env.NODE_MMDN == 0 && results[i].diameter < 50) ){
                        estimated_weight += 3
                    }else{
                        estimated_weight += 5
                    }
                  }
            }
        }
        sql.query("SELECT SUM(stage1_weight) as weight FROM dpipes LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id", (err, results) =>{
            if(results[0]){
                modelled_weight = results[0].weight
            }
            sql.query("SELECT stage1 as weight, valves, instruments FROM iquoxe_db.pipectrls LEFT JOIN pestpipes ON status_id = pestpipes.id", (err, results) =>{
                if(results[0]){
                    let weight = 0
                    for(let i = 0; i < results.length; i++){
                        weight += results[i].weight
                        if(results[i].valves || results[i].instruments){
                            weight += 1
                        }
                    }
                    progress = (weight/modelled_weight*100).toFixed(2)
                }
                res.send({weight: estimated_weight, modelledWeight: modelled_weight, progress: progress}).status(200)
            })
        })
    })
}

const isocontrolProgress = async(req, res) =>{
    sql.query("SELECT week, progress FROM pisocontrol", (err, results) =>{
        if(err){
            console.log(err)
            res.send({progress: []}).status(401)
        }else{
            res.send({progress: results}).status(401)
        }
    })  
}

const isocontrolEstimated = async(req, res) =>{
    sql.query("SELECT week, progress FROM epipes_ifd", (err, results) =>{
        if(err){
            console.log(err)
            res.send({progress: []}).status(401)
        }else{
            res.send({progress: results}).status(401)
        }
    })  
}

const isocontrolForecast = async(req, res) =>{
    sql.query("SELECT week, progress FROM forecast_ifd", (err, results) =>{
        if(err){
            console.log(err)
            res.send({progress: []}).status(401)
        }else{
            res.send({progress: results}).status(401)
        }
    })  
}

const submitEstimatedForecastIFD = async(req, res) =>{
    const estimated = req.body.estimated
    const forecast = req.body.forecast
    console.log(estimated)
    for(let i = 0; i < estimated.length; i++){
        if(!estimated[i]){
            estimated[i] = null
        }
        sql.query("UPDATE epipes_ifd SET progress = ? WHERE week = ?", [estimated[i], i+1], (err, results) =>{
            if(err){
                console.log(err)
            }
        })
    }
    for(let i = 1; i+1 < forecast.length; i++){
        if(!forecast[i]){
            forecast[i] = null
        }
        sql.query("UPDATE forecast_ifd SET progress = ? WHERE week = ?", [forecast[i], i+1], (err, results) =>{
            if(err){
                console.log(err)
            }
        })
        
    }

    res.send({success: true}).status(200)
}

cron.schedule('0 0 * * 0', async() => {
    let estimated_weight = 0, modelled_weight = 0, progress = 0
    await sql.query("SELECT diameter, calc_notes FROM estimated_pipes LEFT JOIN `lines` on estimated_pipes.line_ref_id = `lines`.id", (err, results) =>{
        if(results[0]){
            for(let i = 0; i < results.length; i++){
                if(results[i].calc_notes != "NA"){
                    estimated_weight += 10
                  }else{
                    if((process.env.NODE_MMDN == 1 && results[i].diameter < 2.00) || (process.env.NODE_MMDN == 0 && results[i].diameter < 50) ){
                        estimated_weight += 3
                    }else{
                        estimated_weight += 5
                    }
                  }
            }
        }
        sql.query("SELECT SUM(stage1_weight) as weight FROM dpipes LEFT JOIN tpipes ON dpipes.tpipes_id = tpipes.id", (err, results) =>{
            if(results[0]){
                modelled_weight = results[0].weight
            }
            sql.query("SELECT stage1 as weight, valves, instruments FROM iquoxe_db.pipectrls LEFT JOIN pestpipes ON status_id = pestpipes.id", (err, results) =>{
                if(results[0]){
                    let weight = 0
                    for(let i = 0; i < results.length; i++){
                        weight += results[i].weight
                        if(results[i].valves || results[i].instruments){
                            weight += 1
                        }
                    }
                    progress = (weight/modelled_weight*100).toFixed(2)
                }
                sql.query("SELECT `week` FROM pisocontrol ORDER BY `week` DESC LIMIT 1", (err, results)=>{
                    let week = 1
                    if(!results[0]){
                        
                    }else{
                        week = results[0].week
                        sql.query("INSERT INTO pisocontrol(week, progress) VALUES(?,?)", [week, progress], (err, results) =>{
                            if(err){
                                console.log(err)
                            }
                        })
                    }
                })
                
            })
        })
    })
})

module.exports = {
    getPipesByStatus,
    claimPipes,
    unclaimPipes,
    pipingMyTray,
    nextStep,
    sendValves,
    sendInstruments,
    sendNA,
    cancelValves, 
    cancelInstruments,
    cancelNA,
    returnPipes,
    getDeletedPipes,
    deletePipes,
    restorePipes,
    estimatedPipingWeight,
    isocontrolProgress,
    isocontrolEstimated,
    isocontrolForecast,
    submitEstimatedForecastIFD
}