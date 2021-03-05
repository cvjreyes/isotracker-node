const Role = require("./role.model.js");

// Retrieve all tpipes from the database.
exports.findAll = (req, res) => {
  Role.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message:
              err.message || "Some error occurred while retrieving tpipes."
          });
        else res.send(data);
      });
};

