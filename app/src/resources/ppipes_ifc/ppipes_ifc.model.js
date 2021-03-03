const sql = require("../../db.js");

// constructor
const Ppipes_ifc = function(ppipes_ifc) {
  this.tpipes_id = ppipes_ifc.tpipes_id;
  this.level = ppipes_ifc.level;
  this.value = ppipes_ifc.value;
  this.created_at = ppipes_ifc.created_at;
  this.updated_at = ppipes_ifc.updated_at;
};

Ppipes_ifc.create = (newppipes_ifc, result) => {
  sql.query("INSERT INTO ppipes_ifc SET ?", newppipes_ifc, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created ppipes_ifc: ", { id: res.insertId, ...newppipes_ifc });
    result(null, { id: res.insertId, ...newppipes_ifc });
  });
};

Ppipes_ifc.findById = (ppipes_ifcId, result) => {
  sql.query(`SELECT * FROM ppipes_ifc WHERE id = ${ppipes_ifcId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found ppipes_ifc: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Ppipes_ifc.getAll = result => {
  sql.query("SELECT * FROM ppipes_ifc", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("ppipes_ifc: ", res);
    result(null, res);
  });
};

Ppipes_ifc.updateById = (id, ppipes_ifc, result) => {
  sql.query(
    "UPDATE ppipes_ifc SET tpipes_id = ?, level = ?, value = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [ppipes_ifc.tpipes_id, ppipes_ifc.level, ppipes_ifc.value, ppipes_ifc.created_at, ppipes_ifc.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found ppipes_ifc with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated ppipes_ifc: ", { id: id, ...ppipes_ifc });
      result(null, { id: id, ...ppipes_ifc });
    }
  );
};

Ppipes_ifc.remove = (id, result) => {
  sql.query("DELETE FROM ppipes_ifc WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found ppipes_ifc with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted ppipes_ifc with id: ", id);
    result(null, res);
  });
};

Ppipes_ifc.removeAll = result => {
  sql.query("DELETE FROM ppipes_ifc", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} ppipes_ifc`);
    result(null, res);
  });
};

module.exports = Ppipes_ifc;