const Isostatus = require("./isostatus.model.js");

// Create and Save a new isostatus
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a isostatus
  const isostatus = new Isostatus({
    name: req.body.name,
    pos: req.body.pos
  });

  // Save isostatus in the database
  Isostatus.create(isostatus, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the isostatus."
      });
    else res.send(data);
  });
};

// Retrieve all isostatuss from the database.
exports.findAll = (req, res) => {
  Isostatus.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving isostatuss."
          });
        else res.send(data);
      });
};

// Find a single isostatus with a isostatusId
exports.findOne = (req, res) => {
  Isostatus.findById(req.params.isostatusId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found isostatus with id ${req.params.isostatusId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving isostatus with id " + req.params.isostatusId
            });
          }
        } else res.send(data);
      });
};

// Update a isostatus identified by the isostatusId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Isostatus.updateById(
        req.params.isostatusId,
        new Isostatus(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found isostatus with id ${req.params.isostatusId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.isostatusId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a isostatus with the specified isostatusId in the request
exports.delete = (req, res) => {
  Isostatus.remove(req.params.isostatusId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.isostatusId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete isostatus with id " + req.params.isostatusId
            });
          }
        } else res.send({ message: `isostatus was deleted successfully!` });
      });
};

// Delete all isostatuss from the database.
exports.deleteAll = (req, res) => {
  Isostatus.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all isostatuss."
          });
        else res.send({ message: `All isostatuss were deleted successfully!` });
      });
};