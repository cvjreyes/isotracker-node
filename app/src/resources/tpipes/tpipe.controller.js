const Tpipe = require("./tpipe.model.js");

// Create and Save a new tpipe
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a tpipe
  const tpipe = new Tpipe({
    name: req.body.name,
    hours: req.body.hours,
    code: req.body.code,
    pid: req.body.pid,
    iso: req.body.iso,
    stress: req.body.stress,
    support: req.body.support,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save tpipe in the database
  Tpipe.create(tpipe, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the tpipe."
      });
    else res.send(data);
  });
};

// Retrieve all tpipes from the database.
exports.findAll = (req, res) => {
  Tpipe.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving tpipes."
          });
        else res.send(data);
      });
};

// Find a single tpipe with a tpipeId
exports.findOne = (req, res) => {
  Tpipe.findById(req.params.tpipeId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found tpipe with id ${req.params.tpipeId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving tpipe with id " + req.params.tpipeId
            });
          }
        } else res.send(data);
      });
};

// Update a tpipe identified by the tpipeId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Tpipe.updateById(
        req.params.tpipeId,
        new Tpipe(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found tpipe with id ${req.params.tpipeId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.tpipeId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a tpipe with the specified tpipeId in the request
exports.delete = (req, res) => {
  Tpipe.remove(req.params.tpipeId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.tpipeId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete tpipe with id " + req.params.tpipeId
            });
          }
        } else res.send({ message: `tpipe was deleted successfully!` });
      });
};

// Delete all tpipes from the database.
exports.deleteAll = (req, res) => {
  Tpipe.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all tpipes."
          });
        else res.send({ message: `All tpipes were deleted successfully!` });
      });
};