const { supabase } = require("../config/supabase");

exports.getStalls = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .order("display_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Supabase Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Helper สำหรับแปลงเวลา "HH:mm" เป็นนาที เพื่อนำมาเปรียบเทียบช่วงเวลา
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

exports.createBooking = async (req, res) => {
  try {
    const {
      booking_date,
      stall_id,
      customer_name,
      phone_number,
      time_start,
      time_end,
      booking_type,
      selected_days,
      equipment_option,
      selected_equipments,
    } = req.body;

    if (
      !customer_name ||
      !phone_number ||
      !stall_id ||
      !booking_type ||
      !time_start ||
      !time_end
    ) {
      return res
        .status(400)
        .json({ error: "กรุณากรอกข้อมูลที่จำเป็นรวมถึงช่วงเวลาให้ครบถ้วน" });
    }

    const newStart = timeToMinutes(time_start);
    const newEnd = timeToMinutes(time_end);

    if (newStart >= newEnd) {
      return res
        .status(400)
        .json({ error: "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด" });
    }

    // ดึงรายการจองของล็อกนี้ที่อนุมัติแล้วหรือรออนุมัติอยู่
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("*")
      .eq("stall_id", stall_id)
      .in("status", ["pending", "approved"]);

    if (checkError) throw checkError;

    // 🟢 ตรวจสอบว่าช่วงเวลาที่เลือกทับซ้อนกับการจองเดิมที่มีอยู่หรือไม่
    const isOverlapped = existingBookings.some((b) => {
      let isSameDayOrCycle = false;

      if (booking_type === "daily" && b.booking_type === "daily") {
        if (b.booking_date === booking_date) isSameDayOrCycle = true;
      } else if (
        booking_type === "daily" &&
        (b.booking_type === "weekly" || b.booking_type === "monthly")
      ) {
        const dateObj = new Date(booking_date);
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayOfWeekEn = dayNames[dateObj.getDay()];
        let bDays = Array.isArray(b.selected_days) ? b.selected_days : [];
        if (typeof b.selected_days === "string") {
          try {
            bDays = JSON.parse(b.selected_days);
          } catch (e) {}
        }
        if (bDays.includes(dayOfWeekEn)) isSameDayOrCycle = true;
      } else if (booking_type === "weekly" || booking_type === "monthly") {
        let bDays = Array.isArray(b.selected_days) ? b.selected_days : [];
        if (typeof b.selected_days === "string") {
          try {
            bDays = JSON.parse(b.selected_days);
          } catch (e) {}
        }
        let currentDays = Array.isArray(selected_days) ? selected_days : [];
        const hasCommonDay = currentDays.some((day) => bDays.includes(day));
        if (hasCommonDay) isSameDayOrCycle = true;
      }

      if (!isSameDayOrCycle) return false;

      const existingStart = timeToMinutes(b.time_start);
      const existingEnd = timeToMinutes(b.time_end);

      // เงื่อนไขช่วงเวลาทับซ้อน: (Start1 < End2) AND (End1 > Start2)
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (isOverlapped) {
      return res.status(400).json({
        error:
          "ช่วงเวลาที่เลือกทับซ้อนกับการจองที่มีอยู่แล้ว กรุณาเลือกช่วงเวลาอื่น",
      });
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          booking_date: booking_date || null,
          stall_id,
          customer_name: customer_name.trim(),
          phone_number: phone_number.trim(),
          time_start,
          time_end,
          booking_type,
          selected_days,
          equipment_option,
          selected_equipments,
          status: "pending",
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "จองสำเร็จ รอแอดมินอนุมัติ", data });
  } catch (err) {
    console.error("Booking Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
