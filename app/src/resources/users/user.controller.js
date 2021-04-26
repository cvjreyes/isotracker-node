const User = require("./user.model.js");
const sql = require("../../db.js");

// Create and Save a new user
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    remember_token: req.body.remember_token,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save user in the database
  User.create(user, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the user."
      });
    else res.send(data);
  });
};

// Retrieve all users from the database.
exports.findAll = (req, res) => {
    User.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving users."
          });
        else res.send(data);
      });
};

// Find a single user with a userId
exports.findOne = (req, res) => {
    User.findById(req.params.userId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found user with id ${req.params.userId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving user with id " + req.params.userId
            });
          }
        } else res.send(data);
      });
};

// Find a single user with a user email
exports.findOneByEmail = (req, res) => {
  User.findByEmail(req.params.userEmail, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            message: `Not found user with email ${req.params.userEmail}.`
          });
        } else {
          res.status(500).send({
            message: "Error retrieving user with email " + req.params.userEmail
          });
        }
      } else res.send(data);
    });
};

exports.findOneByUsername = (req,res) =>{
  User.findByUsername(req.body.email, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found user with email ${req.body.email}.`
        });
      } else {
        res.status(500).send({
          message: "Error retrieving user with email " + req.body.email
        });
      }
    } else res.send(data);
  });
}

// Update a user identified by the userId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    User.updateById(
        req.params.userId,
        new User(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found user with id ${req.params.userId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.userId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a user with the specified userId in the request
exports.delete = (req, res) => {
    User.remove(req.params.userId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.userId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete user with id " + req.params.userId
            });
          }
        } else res.send({ message: `User was deleted successfully!` });
      });
};

// Delete all users from the database.
exports.deleteAll = (req, res) => {
    User.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all users."
          });
        else res.send({ message: `All users were deleted successfully!` });
      });
};

exports.getUsersByTab = (req,res) =>{
  const tab = req.params.tab
  let ids = []
  sql.query("SELECT id FROM roles WHERE name = ?", [tab], (err, results) =>{
    if(results[0].id == 1){
      ids.push(1)
      ids.push(2)
    }else if (results[0].id === 3){
      ids.push(3)
      ids.push(4)
    }else if(results[0].id === 5){
      ids.push(5)
      ids.push(6)
    }else{
      ids.push(results[0].id)
    }
    let users_id = []
    let ids_q = "("

    if (ids.length === 1){
      ids_q += ids[0] + ")";
    }else if(ids.length === 2){
      ids_q += ids[0] + "," + ids[1] + ")";
    }else{
      for (let i = 0; i < ids.length; i++){
        if(i === 0){
          ids_q += ids[i];
        }else if(i === ids.length - 1){
          ids_q += ids[i] + ")";                
        }else{
          ids_q += "," + ids[i];
        }
      }
    }
    console.log(ids_q)
    let q = "SELECT DISTINCT model_id FROM model_has_roles WHERE role_id IN " + ids_q
    sql.query(q, (err, results) =>{
      if(!results[0]){
        res.status(401).send("Not found")
      }else{
        let users_ids_q = ""
        ids_q = "("

        if (results.length === 1){
          ids_q += results[0].model_id + ")";
        }else if(results.length === 2){
          ids_q += results[0].model_id + "," + results[1].model_id + ")";
        }else{
          for (let i = 0; i < results.length; i++){
            if(i === 0){
              ids_q += results[i].model_id;
            }else if(i === results.length - 1){
              ids_q += "," + results[i].model_id + ")";                
            }else{
              ids_q += "," + results[i].model_id;
            }
          }
        }
        let q2 = "SELECT name FROM users WHERE id IN " + ids_q
        sql.query(q2, (err, results) =>{
          if(!results[0]){
            res.status(401).send("No users with that role")
          }else{
            usernames = []
            for(let i = 0; i < results.length; i++){
              usernames.push(results[i].name)
            }
            res.json({
              usernames: usernames
            })
          }
        })
      }
      
    })

  })
}