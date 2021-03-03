const Ppipes_ifc = require("./ppipes_ifc.model.js");

// Create and Save a new ppipes_ifc
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a ppipes_ifc
  const ppipes_ifc = new Ppipes_ifc({
    tpipes_id: req.body.tpipes_id,
    level: req.body.level,
    value: req.body.value,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save ppipes_ifc in the database
  Ppipes_ifc.create(ppipes_ifc, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the ppipes_ifc."
      });
    else res.send(data);
  });
};

// Retrieve all ppipes_ifcs from the database.
exports.findAll = (req, res) => {
  Ppipes_ifc.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving ppipes_ifcs."
          });
        else res.send(data);
      });
};

// Find a single ppipes_ifc with a ppipes_ifcId
exports.findOne = (req, res) => {
  Ppipes_ifc.findById(req.params.ppipes_ifcId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found ppipes_ifc with id ${req.params.ppipes_ifcId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving ppipes_ifc with id " + req.params.ppipes_ifcId
            });
          }
        } else res.send(data);
      });
};

// Update a ppipes_ifc identified by the ppipes_ifcId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Ppipes_ifc.updateById(
        req.params.ppipes_ifcId,
        new Ppipes_ifc(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found ppipes_ifc with id ${req.params.ppipes_ifcId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.ppipes_ifcId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a ppipes_ifc with the specified ppipes_ifcId in the request
exports.delete = (req, res) => {
  Ppipes_ifc.remove(req.params.ppipes_ifcId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.ppipes_ifcId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete ppipes_ifc with id " + req.params.ppipes_ifcId
            });
          }
        } else res.send({ message: `ppipes_ifc was deleted successfully!` });
      });
};

// Delete all ppipes_ifcs from the database.
exports.deleteAll = (req, res) => {
  Ppipes_ifc.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all ppipes_ifcs."
          });
        else res.send({ message: `All ppipes_ifcs were deleted successfully!` });
      });
};