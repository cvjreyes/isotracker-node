const sql = require("../../db.js");

// constructor
const Misoctrl = function(misoctrl) {
  this.filename= misoctrl.filename,
  this.isoid = misoctrl.isoid,
  this.revision= misoctrl.revision,
  this.tie= misoctrl.tie,
  this.spo= misoctrl.spo,
  this.sit= misoctrl.sit,
  this.requested= misoctrl.requested,
  this.requestedlead= misoctrl.requestedlead,
  this.issued= misoctrl.issued,
  this.deleted= misoctrl.deleted,
  this.onhold= misocrl.onhold,
  this.claimed= misoctrl.claimed,
  this.verifydesign= misoctrl.verifydesign,
  this.verifystress= misoctrl.verifystress,
  this.verifysupports= misoctrl.verifysupports,
  this.fromldgsupports= misoctrl.fromldgsupports,
  this.from= misoctrl.from,
  this.to= misoctrl.to,
  this.comments= misoctrl.comments,
  this.user= misoctrl.user,
  this.created_at= misoctrl.created_at,
  this.updated_at= misoctrl.updated_at
};

Misoctrl.create = (newMisoctrl, result) => {
  sql.query("INSERT INTO misoctrls SET ?", newMisoctrl, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created misoctrl: ", { id: res.insertId, ...newMisoctrl });
    result(null, { id: res.insertId, ...newMisoctrl });
  });
};

Misoctrl.findById = (misoctrlId, result) => {
  sql.query(`SELECT * FROM misoctrls WHERE id = ${misoctrlId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found misoctrl: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Misoctrl.getAll = result => {
  sql.query("SELECT * FROM misoctrls", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("misoctrls: ", res);
    result(null, res);
  });
};

Misoctrl.updateById = (id, misoctrl, result) => {
  sql.query(
    "UPDATE misoctrls SET filename = ?, isoid = ?, revision = ?, tie = ?, spo = ?, sit = ?, requested = ?, requestedlead = ?, issued = ?, deleted = ?, onhold = ?, claimed = ?, verifydesign = ?, verifystress = ?, verifysupports = ?, fromldgsupports = ?, `from` = ?, `to` = ?, comments = ?, user = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [misoctrl.filename, misoctrl.isoid, misoctrl.revision, misoctrl.tie, misoctrl.spo, misoctrl.sit, misoctrl.requested, misoctrl.requestedlead, misoctrl.issued, misoctrl.deleted, misoctrl.onhold, misoctrl.claimed, misoctrl.verifydesign, misoctrl.verifystress, misoctrl.verifysupports, misoctrl.fromldgsupports, misoctrl.from, misoctrl.to, misoctrl.comments, misoctrl.user, misoctrl.created_at, misoctrl.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found misoctrl with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated misoctrl: ", { id: id, ...misoctrl });
      result(null, { id: id, ...misoctrl });
    }
  );
};

Misoctrl.remove = (id, result) => {
  sql.query("DELETE FROM misoctrls WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found misoctrl with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted misoctrl with id: ", id);
    result(null, res);
  });
};

Misoctrl.removeAll = result => {
  sql.query("DELETE FROM misoctrls", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} misoctrls`);
    result(null, res);
  });
};

module.exports = Misoctrl;