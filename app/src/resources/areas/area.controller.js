const Area = require("./area.model.js");

// Create and Save a new area
exports.create = (req, res) => {
   // Validate request
   if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a area
  const area = new Area({
    name: req.body.name,
    ngf: req.body.ngf,
    e3d: req.body.e3d,
    created_at: req.body.created_at,
    updated_at: req.body.updated_at
  });

  // Save area in the database
  Area.create(area, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the area."
      });
    else res.send(data);
  });
};

// Retrieve all areas from the database.
exports.findAll = (req, res) => {
      Area.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving areas."
          });
        else res.send(data);
      });
};

// Find a single area with a areaId
exports.findOne = (req, res) => {
    Area.findById(req.params.areaId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found area with id ${req.params.areaId}.`
            });
          } else {
            res.status(500).send({
              message: "Error retrieving area with id " + req.params.areaId
            });
          }
        } else res.send(data);
      });
};

// Update a area identified by the areaId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
        message: "Content can not be empty!"
        });
    }

    Area.updateById(
        req.params.areaId,
        new area(req.body),
        (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
            res.status(404).send({
                message: `Not found area with id ${req.params.areaId}.`
            });
            } else {
            res.status(500).send({
                message: "Error updating use with id " + req.params.areaId
            });
            }
        } else res.send(data);
        }
    );
};

// Delete a area with the specified areaId in the request
exports.delete = (req, res) => {
    Area.remove(req.params.areaId, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found use with id ${req.params.areaId}.`
            });
          } else {
            res.status(500).send({
              message: "Could not delete area with id " + req.params.areaId
            });
          }
        } else res.send({ message: `area was deleted successfully!` });
      });
};

// Delete all areas from the database.
exports.deleteAll = (req, res) => {
    Area.removeAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while removing all areas."
          });
        else res.send({ message: `All areas were deleted successfully!` });
      });
};