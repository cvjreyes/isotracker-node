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

module.exports = {
    gpipes,
    gequips,
    ginsts,
    gcivils
  };