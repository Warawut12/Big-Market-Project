const { supabase } = require("../config/supabase");

const checkAndExpirePassedBookings = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // รายวัน  หมดอายุเมื่อเลยวันจอง
    const { data: expiredDaily } = await supabase
      .from("bookings")
      .select("id, stall_id")
      .eq("status", "approved")
      .eq("booking_type", "daily")
      .lt("booking_date", todayStr);

    if (expiredDaily && expiredDaily.length > 0) {
      const expiredIds = expiredDaily.map((b) => b.id);
      const stallIds = expiredDaily.map((b) => b.stall_id);

      await supabase
        .from("bookings")
        .update({ status: "completed" })
        .in("id", expiredIds);
      await supabase
        .from("stalls")
        .update({ status: "available" })
        .in("id", stallIds);
    }

    // ดึงรายการอนุมัติแล้วมาเช็ค รายสัปดาห์ (7 วัน) และ รายเดือน (ตามจำนวนวันจริงของเดือนนั้นๆ)
    const { data: approvedBookings } = await supabase
      .from("bookings")
      .select("id, stall_id, booking_type, updated_at, created_at")
      .eq("status", "approved");

    if (approvedBookings && approvedBookings.length > 0) {
      const completedWeeklyIds = [];
      const completedMonthlyIds = [];
      const stallIdsToFree = [];

      approvedBookings.forEach((b) => {
        const approveTime = new Date(b.updated_at || b.created_at);
        const diffTime = now - approveTime; // มิลลิวินาที

        if (b.booking_type === "weekly") {
          // ครบ 7 วัน (7 * 24 * 60 * 60 * 1000)
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (diffTime >= sevenDaysMs) {
            completedWeeklyIds.push(b.id);
            stallIdsToFree.push(b.stall_id);
          }
        } else if (b.booking_type === "monthly") {
          // คำนวณจำนวนวันตามเดือนจริงนับจากวันที่อนุมัติ (28, 29, 30 หรือ 31 วัน)
          const year = approveTime.getFullYear();
          const month = approveTime.getMonth() + 1;
          const daysInMonth = new Date(year, month, 0).getDate();
          const monthMs = daysInMonth * 24 * 60 * 60 * 1000;

          if (diffTime >= monthMs) {
            completedMonthlyIds.push(b.id);
            stallIdsToFree.push(b.stall_id);
          }
        }
      });

      const allCompletedIds = [...completedWeeklyIds, ...completedMonthlyIds];
      if (allCompletedIds.length > 0) {
        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .in("id", allCompletedIds);
        await supabase
          .from("stalls")
          .update({ status: "available" })
          .in("id", [...new Set(stallIdsToFree)]);
      }
    }

    // 3. QR Code ค้างรออนุมัติเกิน 24 ชม.
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: expiredPending } = await supabase
      .from("bookings")
      .select("id")
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo);

    if (expiredPending && expiredPending.length > 0) {
      const pendingIds = expiredPending.map((b) => b.id);
      await supabase
        .from("bookings")
        .update({ status: "expired" })
        .in("id", pendingIds);
    }
  } catch (err) {
    console.error("Error checking expired bookings:", err.message);
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    await checkAndExpirePassedBookings();

    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookingError) throw bookingError;

    const { data: stalls, error: stallError } = await supabase
      .from("stalls")
      .select("*");

    if (stallError) throw stallError;

    const combinedData = bookings.map((booking) => {
      const matchedStall = stalls.find(
        (stall) => stall.id === booking.stall_id,
      );
      return {
        ...booking,
        stalls: matchedStall || {
          stall_number: "ไม่พบข้อมูลล็อก",
          status: "unknown",
        },
      };
    });

    res.json(combinedData);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("stall_id")
      .eq("id", id)
      .single();
    if (bookingData) {
      await supabase.from("bookings").delete().eq("id", id);
      await supabase
        .from("stalls")
        .update({ status: "available" })
        .eq("id", bookingData.stall_id);
    }
    res.json({ message: "ยกเลิกการจองสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStall = async (req, res) => {
  try {
    const { stall_number, description, price } = req.body;
    const { data: maxOrderStall } = await supabase
      .from("stalls")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);
    const nextOrder =
      ((maxOrderStall && maxOrderStall[0]?.display_order) || 0) + 1;

    const { data, error } = await supabase
      .from("stalls")
      .insert([
        {
          stall_number,
          description: description || "ล็อกตลาดตรีสุข",
          price: price || 0,
          status: "available",
          display_order: nextOrder,
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "เพิ่มล็อกสำเร็จ!", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStall = async (req, res) => {
  try {
    const { id } = req.params;
    const { stall_number, description, price } = req.body;
    const { data, error } = await supabase
      .from("stalls")
      .update({ stall_number, description, price: price || 0 })
      .eq("id", id)
      .select();
    if (error) throw error;
    res.json({ message: "อัปเดตสำเร็จ", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStall = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("stalls").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "ลบล็อกสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStallOrder = async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await supabase
        .from("stalls")
        .update({ display_order: item.display_order })
        .eq("id", item.id);
    }
    res.json({ message: "บันทึกลำดับสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("stall_id")
      .eq("id", id)
      .single();
    if (!bookingData)
      return res.status(404).json({ error: "ไม่พบข้อมูลการจอง" });

    // บันทึกเวลาที่อนุมัติด้วย updated_at ผ่านการอัปเดตสถานะ
    await supabase.from("bookings").update({ status: "approved" }).eq("id", id);
    await supabase
      .from("stalls")
      .update({ status: "booked" })
      .eq("id", bookingData.stall_id);

    res.json({ message: "อนุมัติสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
