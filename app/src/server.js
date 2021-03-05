const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());
app.use(cors());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the isotracker api." });
});
require("dotenv").config();
require("./resources/users/user.routes.js")(app);
require("./resources/areas/area.routes.js")(app);
require("./resources/dpipes/dpipe.routes.js")(app);
require("./resources/hisoctrls/hisoctrl.routes.js")(app);
require("./resources/isostatus/isostatus.routes.js")(app);
require("./resources/misoctrls/misoctrl.routes.js")(app);
require("./resources/ppipes_ifc/ppipes_ifc.routes.js")(app);
require("./resources/ppipes_ifd/ppipes_ifd.routes.js")(app);
require("./resources/tpipes/tpipe.routes.js")(app);
require("./resources/auth/auth.routes.js")(app);
require("./resources/register/register.routes.js")(app);
require("./resources/roles/role.routes.js")(app);

// set port, listen for requests
app.listen(5000, () => {
  console.log("Server is running on port 5000.");
});