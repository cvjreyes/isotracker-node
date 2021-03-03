const sql = require("../../db.js");

// constructor
const Tpipe = function(tpipe) {
  this.name = tpipe.name;
  this.hours = tpipe.hours;
  this.code = tpipe.code;
  this.pid = tpipe.pid;
  this.iso = tpipe.iso;
  this.stress = tpipe.stress;
  this.support = tpipe.support;
  this.created_at = tpipe.created_at;
  this.updated_at = tpipe.updated_at;
};

Tpipe.create = (newTpipe, result) => {
  sql.query("INSERT INTO tpipes SET ?", newTpipe, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created tpipe: ", { id: res.insertId, ...newTpipe });
    result(null, { id: res.insertId, ...newTpipe });
  });
};

Tpipe.findById = (tpipeId, result) => {
  sql.query(`SELECT * FROM tpipes WHERE id = ${tpipeId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found tpipe: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Tpipe.getAll = result => {
  sql.query("SELECT * FROM tpipes", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("tpipe: ", res);
    result(null, res);
  });
};

Tpipe.updateById = (id, tpipe, result) => {
  sql.query(
    "UPDATE tpipes SET name = ?, hours = ?, code = ?, pid = ?, iso = ?, stress = ?, support = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [tpipe.name, tpipe.hours, tpipe.code, tpipe.pid, tpipe.iso, tpipe.stress, tpipe.suppot, tpipe.created_at, tpipe.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found tpipe with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated tpipe: ", { id: id, ...tpipe });
      result(null, { id: id, ...tpipe });
    }
  );
};

Tpipe.remove = (id, result) => {
  sql.query("DELETE FROM tpipes WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found tpipe with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted tpipe with id: ", id);
    result(null, res);
  });
};

Tpipe.removeAll = result => {
  sql.query("DELETE FROM tpipes", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} tpipes`);
    result(null, res);
  });
};

module.exports = Tpipe;