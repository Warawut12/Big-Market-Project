const express = require("express");
const router = express.Router();


const { getStalls, createBooking } = require("../controllers/stallController");
const { getAllBookings } = require("../controllers/adminController");


router.get("/stalls", getStalls); 
router.get("/bookings", getAllBookings);
router.post("/bookings", createBooking); 

module.exports = router;