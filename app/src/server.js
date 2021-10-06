const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json({limit:"100mb"}));
app.use(cors());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
;

// simple route
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the isotracker api." });
});
const dotenv = require('dotenv');
dotenv.config();
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
require("./resources/myTrayFiles/myTrayFiles.routes.js")(app);
require("./resources/fileRoutes/file.routes.js")(app);
require("./resources/transactions/transaction.routes.js")(app);
require("./resources/claim/claim.routes.js")(app);
require("./resources/unclaim/unclaim.routes.js")(app);
require("./resources/verify/verify.routes.js")(app);
require("./resources/progress/progress.routes.js")(app);
require("./resources/csptracker/csptracker.routes.js")(app);

// set port, listen for requests
app.listen(process.env.REACT_APP_DB_PORT, () => {
  console.log("Server is running on port "+process.env.REACT_APP_DB_PORT+".");
});

