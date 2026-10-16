const express = require("express");
const router = express.Router();
const {
  getAllBookings,
  cancelBooking,
  createStall,
  deleteStall,
  updateStall,
  approveBooking,
  updateStallOrder, 
} = require("../controllers/adminController");
const { verifyAdminToken } = require("../middleware/authMiddleware");

router.get("/admin/bookings", verifyAdminToken, getAllBookings);
router.delete("/admin/bookings/:id", verifyAdminToken, cancelBooking);
router.post("/admin/stalls", verifyAdminToken, createStall);
router.delete("/admin/stalls/:id", verifyAdminToken, deleteStall);
router.put("/admin/stalls/reorder", verifyAdminToken, updateStallOrder);
router.put("/admin/stalls/:id", verifyAdminToken, updateStall);
router.put("/admin/bookings/approve/:id", verifyAdminToken, approveBooking);

module.exports = router;
