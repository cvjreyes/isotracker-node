const sql = require("../../db.js");

// constructor
const DPipe = function(dPipe) {
  this.zone_name = dPipe.zone_name,
  this.pipe_name = dPipe.pipe_name,
  this.pid = dPipe.pid,
  this.ppipe_pids_id = dPipe.ppipes_pids_id,
  this.iso = dPipe.iso,
  this.ppipe_isos_id = dPipe.ppipe_isos_id,
  this.stress = dPipe.stress,
  this.ppipe_stresses_id = dPipe.ppipe_stresses_id,
  this.support = dPipe.support,
  this.ppipe_supports_id = dPipe.ppipe_supports_id,
  this.pdms_linenumber = dPipe.pdms_linenumber,
  this.created_at = dPipe.created_at,
  this.updated_at = dPipe.updated_at
};

DPipe.create = (newdPipe, result) => {
  sql.query("INSERT INTO dpipes SET ?", newdPipe, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created dPipe: ", { id: res.insertId, ...newdPipe });
    result(null, { id: res.insertId, ...newdPipe });
  });
};

DPipe.findById = (dPipeId, result) => {
  sql.query(`SELECT * FROM dpipes WHERE id = ${dPipeId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found dPipe: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

DPipe.getAll = result => {
  sql.query("SELECT * FROM dpipes", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("dpipes: ", res);
    result(null, res);
  });
};

DPipe.updateById = (id, dPipe, result) => {
  sql.query(
    "UPDATE dpipes SET zone_name = ?, pipe_name = ?, pid = ?, ppipe_pids_id = ?, iso = ?, ppipe_stresses_id = ?, support = ?, ppipe_supports_id = ?, pdms_linenumber = ?, updated_at = ? WHERE id = ?",
    [dPipe.zone_name, dPipe.pipe_name, dPipe.pid, dPipe.ppipe_pids_id, dPipe.iso, dPipe.ppipe_stresses_id, dPipe.support, dPipe.ppipe_supports_id, dPipe. pdms_linenumber, dPipe.created_at, dPipe.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found dPipe with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated dPipe: ", { id: id, ...dPipe });
      result(null, { id: id, ...dPipe });
    }
  );
};

DPipe.remove = (id, result) => {
  sql.query("DELETE FROM dpipes WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found dPipe with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted dPipe with id: ", id);
    result(null, res);
  });
};

DPipe.removeAll = result => {
  sql.query("DELETE FROM dpipes", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} dpipes`);
    result(null, res);
  });
};

module.exports = DPipe;