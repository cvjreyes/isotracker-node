const DPipe = require("./dpipe.model.js");

// Create and Save a new dPipe
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a dPipe
  const dPipe = new DPipe({
    zone_name: req.body.zone_name,
    pipe_name: req.body.pipe_name,
    pid: req.body.pid,
    ppipe_pids_id: req.body.ppipes_pids_id,
    iso: req.body.iso,
    ppipe_isos_id: req.body.ppipe_isos_id,
    stress: req.body.stress,
    ppipe_stresses_id: req.body.ppipe_stresses_id,
    support: req.body.support,
    ppipe_supports_id: req.body.ppipe_supports_id,
    pdms_linenumber: req.body.pdms_linenumber,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save dPipe in the database
  DPipe.create(dPipe, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the dPipe."
      });
    else res.send(data);
  });
};

// Retrieve all dPipes from the database.
exports.findAll = (req, res) => {
    DPipe.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving dPipes."
          });
        else res.send(data);
      });
};

// Find a single dPipe with a dPipeId
exports.findOne = (req, res) => {
    DPipe.findById(req.params.dPipeId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found dPipe with id ${req.params.dPipeId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving dPipe with id " + req.params.dPipeId
            });
          }
        } else res.send(data);
      });
};

// Update a dPipe identified by the dPipeId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    DPipe.updateById(
        req.params.dPipeId,
        new dPipe(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found dPipe with id ${req.params.dPipeId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.dPipeId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a dPipe with the specified dPipeId in the request
exports.delete = (req, res) => {
    DPipe.remove(req.params.dPipeId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.dPipeId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete dPipe with id " + req.params.dPipeId
            });
          }
        } else res.send({ message: `dPipe was deleted successfully!` });
      });
};

// Delete all dPipes from the database.
exports.deleteAll = (req, res) => {
    DPipe.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all dPipes."
          });
        else res.send({ message: `All dPipes were deleted successfully!` });
      });
};