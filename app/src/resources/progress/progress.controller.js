const fs = require('fs');
const sql = require("../../db.js");

const gpipes = async(req,res) =>{
    sql.query('SELECT * FROM gpipes', (err, results)=>{
        console.log(results)
        res.json({
            rows: results
        }).status(200)
    })
}

module.exports = {
    gpipes
  };