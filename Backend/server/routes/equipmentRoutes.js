const express = require("express");
const router = express.Router();
const {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
} = require("../controllers/equipmentController");

router.get("/equipments", getEquipments);
router.post("/admin/equipments", createEquipment);
router.put("/admin/equipments/:id", updateEquipment);
router.delete("/admin/equipments/:id", deleteEquipment);

module.exports = router;