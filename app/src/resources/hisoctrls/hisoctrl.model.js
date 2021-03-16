const sql = require("../../db.js");

// constructor
const Hisoctrl = function(hisoctrl) {
  this.filename= hisoctrl.filename,
  this.revision= hisoctrl.revision,
  this.tie= hisoctrl.tie,
  this.spo= hisoctrl.spo,
  this.sit= hisoctrl.sit,
  this.requested= hisoctrl.requested,
  this.requestedlead= hisoctrl.requestedlead,
  this.issued= hisoctrl.issued,
  this.deleted= hisoctrl.deleted,
  this.onhold= hisoctrl.onhold,
  this.claimed= hisoctrl.claimed,
  this.verifydesign= hisoctrl.verifydesign,
  this.verifystress= hisoctrl.verifystress,
  this.verifysupports= hisoctrl.verifysupports,
  this.fromldgsupports= hisoctrl.fromldgsupports,
  this.from= hisoctrl.from,
  this.to= hisoctrl.to,
  this.comments= hisoctrl.comments,
  this.user= hisoctrl.user,
  this.created_at= hisoctrl.created_at,
  this.updated_at= hisoctrl.updated_at
};

Hisoctrl.create = (newHisoctrl, result) => {
  sql.query("INSERT INTO hisoctrls SET ?", newHisoctrl, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created hisoctrl: ", { id: res.insertId, ...newHisoctrl });
    result(null, { id: res.insertId, ...newHisoctrl });
  });
};

Hisoctrl.findById = (hisoctrlId, result) => {
  sql.query(`SELECT * FROM hisoctrls WHERE id = ${hisoctrlId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found hisoctrl: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Hisoctrl.getAll = result => {
  sql.query("SELECT * FROM hisoctrls", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("hisoctrls: ", res);
    result(null, res);
  });
};

Hisoctrl.updateById = (id, hisoctrl, result) => {
  sql.query(
    "UPDATE hisoctrls SET filename = ?, revision = ?, tie = ?, spo = ?, sit = ?, requested = ?, requestedlead = ?, issued = ?, deleted = ?, onhold = ?, claimed = ?, verifydesign = ?, verifystress = ?, verifysupports = ?, fromldgsupports = ?, `from` = ?, `to` = ?, comments = ?, user = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [hisoctrl.filename, hisoctrl.revision, hisoctrl.tie, hisoctrl.spo, hisoctrl.sit, hisoctrl.requested, hisoctrl.requestedlead, hisoctrl.issued, hisoctrl.deleted, hisoctrl.onhold,hisoctrl.claimed, hisoctrl.verifydesign, hisoctrl.verifystress, hisoctrl.verifysupports, hisoctrl.fromldgsupports, hisoctrl.from, hisoctrl.to, hisoctrl.comments, hisoctrl.user, hisoctrl.created_at, hisoctrl.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found hisoctrl with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated hisoctrl: ", { id: id, ...hisoctrl });
      result(null, { id: id, ...hisoctrl });
    }
  );
};

Hisoctrl.remove = (id, result) => {
  sql.query("DELETE FROM hisoctrls WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found hisoctrl with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted hisoctrl with id: ", id);
    result(null, res);
  });
};

Hisoctrl.removeAll = result => {
  sql.query("DELETE FROM hisoctrls", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} hisoctrls`);
    result(null, res);
  });
};

module.exports = Hisoctrl;