const User = require("./user.model.js");

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