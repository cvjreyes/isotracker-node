const Misoctrl = require("./misoctrl.model.js");

// Create and Save a new misoctrl
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a misoctrl
  const misoctrl = new Misoctrl({
    filename: req.body.filename,
    isoid: req.body.isoid,
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

  // Save misoctrl in the database
  Misoctrl.create(misoctrl, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the misoctrl."
      });
    else res.send(data);
  });
};

// Retrieve all misoctrls from the database.
exports.findAll = (req, res) => {
  Misoctrl.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving misoctrls."
          });
        else res.send(data);
      });
};

// Find a single misoctrl with a misoctrlId
exports.findOne = (req, res) => {
  Misoctrl.findById(req.params.misoctrlId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found misoctrl with id ${req.params.misoctrlId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving misoctrl with id " + req.params.misoctrlId
            });
          }
        } else res.send(data);
      });
};

// Update a misoctrl identified by the misoctrlId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Misoctrl.updateById(
        req.params.misoctrlId,
        new Misoctrl(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found misoctrl with id ${req.params.misoctrlId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.misoctrlId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a misoctrl with the specified misoctrlId in the request
exports.delete = (req, res) => {
  Misoctrl.remove(req.params.misoctrlId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.misoctrlId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete misoctrl with id " + req.params.misoctrlId
            });
          }
        } else res.send({ message: `misoctrl was deleted successfully!` });
      });
};

// Delete all misoctrls from the database.
exports.deleteAll = (req, res) => {
  Misoctrl.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all misoctrls."
          });
        else res.send({ message: `All misoctrls were deleted successfully!` });
      });
};