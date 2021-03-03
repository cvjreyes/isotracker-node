const Ppipes_ifd = require("./ppipes_ifd.model.js");

// Create and Save a new ppipes_ifd
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a ppipes_ifd
  const ppipes_ifd = new Ppipes_ifd({
    tpipes_id: req.body.tpipes_id,
    level: req.body.level,
    value: req.body.value,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save ppipes_ifd in the database
  Ppipes_ifd.create(ppipes_ifd, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the ppipes_ifd."
      });
    else res.send(data);
  });
};

// Retrieve all ppipes_ifds from the database.
exports.findAll = (req, res) => {
  Ppipes_ifd.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving ppipes_ifds."
          });
        else res.send(data);
      });
};

// Find a single ppipes_ifd with a ppipes_ifdId
exports.findOne = (req, res) => {
  Ppipes_ifd.findById(req.params.ppipes_ifdId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found ppipes_ifd with id ${req.params.ppipes_ifdId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving ppipes_ifd with id " + req.params.ppipes_ifdId
            });
          }
        } else res.send(data);
      });
};

// Update a ppipes_ifd identified by the ppipes_ifdId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Ppipes_ifd.updateById(
        req.params.ppipes_ifdId,
        new Ppipes_ifd(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found ppipes_ifd with id ${req.params.ppipes_ifdId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.ppipes_ifdId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a ppipes_ifd with the specified ppipes_ifdId in the request
exports.delete = (req, res) => {
  Ppipes_ifd.remove(req.params.ppipes_ifdId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.ppipes_ifdId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete ppipes_ifd with id " + req.params.ppipes_ifdId
            });
          }
        } else res.send({ message: `ppipes_ifd was deleted successfully!` });
      });
};

// Delete all ppipes_ifds from the database.
exports.deleteAll = (req, res) => {
  Ppipes_ifd.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all ppipes_ifds."
          });
        else res.send({ message: `All ppipes_ifds were deleted successfully!` });
      });
};