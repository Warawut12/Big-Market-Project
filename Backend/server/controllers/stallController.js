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

    if (!customer_name || !phone_number || !stall_id || !booking_type) {
      return res
        .status(400)
        .json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
    }

    if (booking_type === "daily" && booking_date) {
      const { data: existingBooking, error: checkError } = await supabase
        .from("bookings")
        .select("id")
        .eq("stall_id", stall_id)
        .eq("booking_type", "daily")
        .eq("booking_date", booking_date)
        .in("status", ["pending", "approved"]);

      if (checkError) throw checkError;
      if (existingBooking && existingBooking.length > 0) {
        return res
          .status(400)
          .json({
            error: "ขออภัย ล็อกนี้ถูกจองหรือรออนุมัติในวันที่เลือกไปแล้ว",
          });
      }
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
