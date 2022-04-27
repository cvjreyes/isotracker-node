module.exports = app => {
    const equipments = require("./equipments.controller.js");
    // Create a new user
    app.get("/equipments/estimated", equipments.equipEstimated)
    app.get("/equipments/modelled", equipments.equipModelled)
    app.get("/equipments/steps", equipments.equipSteps)
    app.get("/equipments/weight", equipments.equipWeight)
    app.get("/equipments/types", equipments.equipTypes)
    app.get("/equipEstimatedExcel", equipments.equipEstimatedExcel)

    app.post("/submit/equipments/types", equipments.submitEquipTypes)
    app.post("/submit/equipments/steps", equipments.submitEquipSteps)
    app.post("/submit/equipments/estimated", equipments.submitEquipEstimated)
  };