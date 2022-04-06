const sql = require("../../db.js");

// constructor
const Area = function(area) {
  this.name = area.name;
  this.ngf = area.ngf;
  this.e3d = area.e3d;
  this.created_at = area.created_at;
  this.updated_at = area.updated_at;
};

Area.create = (newArea, result) => {
  sql.query("INSERT INTO areas SET ?", newArea, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created area: ", { id: res.insertId, ...newArea });
    result(null, { id: res.insertId, ...newArea });
  });
};

Area.findById = (areaId, result) => {
  sql.query(`SELECT * FROM areas WHERE id = ${areaId}`, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log("found area: ", res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: "not_found" }, null);
  });
};

Area.getAll = result => {
  sql.query("SELECT * FROM areas", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    result(null, res);
  });
};

Area.updateById = (id, area, result) => {
  sql.query(
    "UPDATE areas SET name = ?, ngf = ?, e3d = ?, created_at = ?, updated_at = ? WHERE id = ?",
    [area.name, area.ngf, area.e3d, area.created_at, area.updated_at, id],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found area with the id
        result({ kind: "not_found" }, null);
        return;
      }

      console.log("updated area: ", { id: id, ...area });
      result(null, { id: id, ...area });
    }
  );
};

Area.remove = (id, result) => {
  sql.query("DELETE FROM areas WHERE id = ?", id, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found area with the id
      result({ kind: "not_found" }, null);
      return;
    }

    console.log("deleted area with id: ", id);
    result(null, res);
  });
};

Area.removeAll = result => {
  sql.query("DELETE FROM areas", (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} areas`);
    result(null, res);
  });
};

module.exports = Area;