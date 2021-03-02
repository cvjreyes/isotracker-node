const sql = require("../../db.js");

// constructor
const Isostatus = function(isostatus) {
  this.name = isostatus.name;
  this.pos = isostatus.pos;
};

Isostatus.create = (newIsostatus, result) => {
  sql.query("INSERT INTO isostatus SET ?", newIsostatus, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created isostatus: ", { id: res.insertId, ...newIsostatus });
    result(null, { id: res.insertId, ...newIsostatus });
  });
};

Isostatus.findById = (isostatusId, result) => {
  sql.query(`SELECT * FROM isostatus WHERE id = ${isostatusId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found isostatus: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Isostatus.getAll = result => {
  sql.query("SELECT * FROM isostatus", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("isostatus: ", res);
    result(null, res);
  });
};

Isostatus.updateById = (id, isostatus, result) => {
  sql.query(
    "UPDATE isostatus SET name = ?, pos = ? WHERE id = ?",
    [isostatus.name, isostatus.pos, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found isostatus with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated isostatus: ", { id: id, ...isostatus });
      result(null, { id: id, ...isostatus });
    }
  );
};

Isostatus.remove = (id, result) => {
  sql.query("DELETE FROM isostatus WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found isostatus with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted isostatus with id: ", id);
    result(null, res);
  });
};

Isostatus.removeAll = result => {
  sql.query("DELETE FROM isostatus", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} isostatus`);
    result(null, res);
  });
};

module.exports = Isostatus;