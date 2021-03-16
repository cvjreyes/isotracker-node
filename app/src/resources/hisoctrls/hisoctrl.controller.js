const Hisoctrl = require("./hisoctrl.model.js");

// Create and Save a new hisoctrl
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a hisoctrl
  const hisoctrl = new Hisoctrl({
    filename: req.body.filename,
    revision: req.body.revision,
    tie: req.body.tie,
    spo: req.body.spo,
    sit: req.body.sit,
    requested: req.body.requested,
    requestedlead: req.body.requestedlead,
    issued: req.body.issued,
    deleted: req.body.deleted,
    onhold: req.body.onhold,
    claimed: req.body.claimed,
    verifydesign: req.body.verifydesign,
    verifystress: req.body.verifystress,
    verifysupports: req.body.verifysupports,
    fromldgsupports: req.body.fromldgsupports,
    from: req.body.from,
    to: req.body.to,
    comments: req.body.comments,
    user: req.body.user,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save hisoctrl in the database
  Hisoctrl.create(hisoctrl, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the hisoctrl."
      });
    else res.send(data);
  });
};

// Retrieve all hisoctrls from the database.
exports.findAll = (req, res) => {
    Hisoctrl.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving hisoctrls."
          });
        else res.send(data);
      });
};

// Find a single hisoctrl with a hisoctrlId
exports.findOne = (req, res) => {
    Hisoctrl.findById(req.params.hisoctrlId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found hisoctrl with id ${req.params.hisoctrlId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving hisoctrl with id " + req.params.hisoctrlId
            });
          }
        } else res.send(data);
      });
};

// Update a hisoctrl identified by the hisoctrlId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Hisoctrl.updateById(
        req.params.hisoctrlId,
        new Hisoctrl(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found hisoctrl with id ${req.params.hisoctrlId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.hisoctrlId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a hisoctrl with the specified hisoctrlId in the request
exports.delete = (req, res) => {
    Hisoctrl.remove(req.params.hisoctrlId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.hisoctrlId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete hisoctrl with id " + req.params.hisoctrlId
            });
          }
        } else res.send({ message: `hisoctrl was deleted successfully!` });
      });
};

// Delete all hisoctrls from the database.
exports.deleteAll = (req, res) => {
    Hisoctrl.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all hisoctrls."
          });
        else res.send({ message: `All hisoctrls were deleted successfully!` });
      });
};