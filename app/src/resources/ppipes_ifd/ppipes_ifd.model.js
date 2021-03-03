const sql = require("../../db.js");

// constructor
const Ppipes_ifd = function(ppipes_ifd) {
  this.tpipes_id = ppipes_ifd.tpipes_id;
  this.level = ppipes_ifd.level;
  this.value = ppipes_ifd.value;
  this.created_at = ppipes_ifd.created_at;
  this.updated_at = ppipes_ifd.updated_at;
};

Ppipes_ifd.create = (newppipes_ifd, result) => {
  sql.query("INSERT INTO ppipes_ifd SET ?", newppipes_ifd, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created ppipes_ifd: ", { id: res.insertId, ...newppipes_ifd });
    result(null, { id: res.insertId, ...newppipes_ifd });
  });
};

Ppipes_ifd.findById = (ppipes_ifdId, result) => {
  sql.query(`SELECT * FROM ppipes_ifd WHERE id = ${ppipes_ifdId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found ppipes_ifd: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Ppipes_ifd.getAll = result => {
  sql.query("SELECT * FROM ppipes_ifd", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("ppipes_ifd: ", res);
    result(null, res);
  });
};

Ppipes_ifd.updateById = (id, ppipes_ifd, result) => {
  sql.query(
    "UPDATE ppipes_ifd SET tpipes_id = ?, level = ?, value = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [ppipes_ifd.tpipes_id, ppipes_ifd.level, ppipes_ifd.value, ppipes_ifd.created_at, ppipes_ifd.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found ppipes_ifd with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated ppipes_ifd: ", { id: id, ...ppipes_ifd });
      result(null, { id: id, ...ppipes_ifd });
    }
  );
};

Ppipes_ifd.remove = (id, result) => {
  sql.query("DELETE FROM ppipes_ifd WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found ppipes_ifd with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted ppipes_ifd with id: ", id);
    result(null, res);
  });
};

Ppipes_ifd.removeAll = result => {
  sql.query("DELETE FROM ppipes_ifd", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} ppipes_ifd`);
    result(null, res);
  });
};

module.exports = Ppipes_ifd;