const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to tutorial application." });
});

require("./resources/users/user.routes.js")(app);
require("./resources/areas/area.routes.js")(app);
require("./resources/dpipes/dpipe.routes.js")(app);
require("./resources/hisoctrls/hisoctrl.routes.js")(app);
require("./resources/isostatus/isostatus.routes.js")(app);

// set port, listen for requests
app.listen(3000, () => {
  console.log("Server is running on port 3000.");
});