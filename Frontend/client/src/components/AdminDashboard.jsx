import { useState, useEffect } from "react";
import axios from "axios";
import API from "../../utils/axios";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [stalls, setStalls] = useState([]);

  const [newStallNumber, setNewStallNumber] = useState("");
  const [newStallDesc, setNewStallDesc] = useState("");
  const [newStallPrice, setNewStallPrice] = useState("");

  const [editingStall, setEditingStall] = useState(null);
  const [editStallNumber, setEditStallNumber] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStallPrice, setEditStallPrice] = useState("");

  const [equipments, setEquipments] = useState([]);
  const [newEqName, setNewEqName] = useState("");
  const [newEqDesc, setNewEqDesc] = useState("");
  const [newEqPrice, setNewEqPrice] = useState("");
  const [newEqImage, setNewEqImage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [draggedIndex, setDraggedIndex] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem("admin_token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, stallsRes, equipmentsRes] = await Promise.all([
        API.get("/api/admin/bookings", getAuthHeader()),
        API.get("/api/stalls"),
        API.get("/api/equipments"),
      ]);
      setBookings(bookingsRes.data);
      setStalls(stallsRes.data);
      setEquipments(equipmentsRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.reload();
      }
    }
  };

  const handleDragStart = (index) => setDraggedIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updatedStalls = [...stalls];
    const draggedItem = updatedStalls[draggedIndex];
    updatedStalls.splice(draggedIndex, 1);
    updatedStalls.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setStalls(updatedStalls);
  };

  const handleDrop = async () => {
    setDraggedIndex(null);
    try {
      const reorderedItems = stalls.map((stall, idx) => ({
        id: stall.id,
        display_order: idx + 1,
      }));
      await API.put(
        "/api/admin/stalls/reorder",
        { items: reorderedItems },
        getAuthHeader(),
      );
    } catch (err) {
      console.error("Error saving order:", err);
      fetchData();
    }
  };

  const showAlert = (title, message, onConfirm = null) => {
    setModalInfo({ isOpen: true, title, message, onConfirm });
  };

  const handleApproveBooking = (bookingId) => {
    showAlert(
      "ยืนยันการอนุมัติ",
      "คุณต้องการอนุมัติการจองนี้ใช่หรือไม่?",
      async () => {
        try {
          await API.put(
            `/api/admin/bookings/approve/${bookingId}`,
            {},
            getAuthHeader(),
          );
          showAlert("สำเร็จ", "อนุมัติการจองสำเร็จ!");
          fetchData();
        } catch (err) {
          showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
        }
      },
    );
  };

  const handleCancelBooking = (bookingId) => {
    showAlert(
      "ยืนยันการยกเลิก",
      "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?",
      async () => {
        try {
          await API.delete(
            `/api/admin/bookings/${bookingId}`,
            getAuthHeader(),
          );
          showAlert("สำเร็จ", "ยกเลิกรายการเรียบร้อย!");
          fetchData();
        } catch (err) {
          showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
        }
      },
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setNewEqImage(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      await API.post(
        "/api/admin/equipments",
        {
          name: newEqName,
          description: newEqDesc,
          price: newEqPrice,
          image_url: newEqImage,
        },
        getAuthHeader(),
      );
      showAlert("สำเร็จ", "เพิ่มอุปกรณ์สำเร็จ!");
      setNewEqName("");
      setNewEqDesc("");
      setNewEqPrice("");
      setNewEqImage("");
      e.target.reset();
      fetchData();
    } catch (err) {
      showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
    }
  };

  const handleDeleteEquipment = (eqId) => {
    showAlert("ยืนยันการลบ", "ต้องการลบอุปกรณ์นี้ใช่หรือไม่?", async () => {
      try {
        await API.delete(
          `/api/admin/equipments/${eqId}`,
          getAuthHeader(),
        );
        showAlert("สำเร็จ", "ลบอุปกรณ์สำเร็จ!");
        fetchData();
      } catch (err) {
        showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
      }
    });
  };

  const handleAddStall = async (e) => {
    e.preventDefault();
    if (!newStallNumber) return;
    try {
      await API.post(
        "/api/admin/stalls",
        {
          stall_number: newStallNumber,
          description: newStallDesc,
          price: newStallPrice || 0,
        },
        getAuthHeader(),
      );
      showAlert("สำเร็จ", "เพิ่มล็อกสำเร็จ!");
      setNewStallNumber("");
      setNewStallDesc("");
      setNewStallPrice("");
      fetchData();
    } catch (err) {
      showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
    }
  };

  const handleDeleteStall = (stallId) => {
    showAlert("ยืนยันการลบ", "ต้องการลบล็อกนี้ใช่หรือไม่?", async () => {
      try {
        await API.delete(
          `/api/admin/stalls/${stallId}`,
          getAuthHeader(),
        );
        showAlert("สำเร็จ", "ลบล็อกสำเร็จ!");
        fetchData();
      } catch (err) {
        showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
      }
    });
  };

  const openEditModal = (stall) => {
    setEditingStall(stall);
    setEditStallNumber(stall.stall_number);
    setEditDescription(stall.description || "ล็อกตลาดตรีสุข");
    setEditStallPrice(stall.price || 0);
  };

  const handleUpdateStall = async (e) => {
    e.preventDefault();
    if (!editStallNumber) return;
    try {
      await API.put(
        `/api/admin/stalls/${editingStall.id}`,
        {
          stall_number: editStallNumber,
          description: editDescription,
          price: editStallPrice,
        },
        getAuthHeader(),
      );
      showAlert("สำเร็จ", "แก้ไขข้อมูลล็อกสำเร็จ!");
      setEditingStall(null);
      fetchData();
    } catch (err) {
      showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
    }
  };

  // ฟังก์ชันคำนวณเวลานับถอยหลัง
  const getRemainingTimeText = (item) => {
    if (item.status === "pending") {
      const createTime = new Date(item.created_at).getTime();
      const expireTime = createTime + 24 * 60 * 60 * 1000;
      const diff = expireTime - Date.now();
      if (diff <= 0) return "QR หมดอายุแล้ว";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `⏳ เหลือเวลา ${hours} ชม. ${minutes} น.`;
    }

    if (item.status === "approved") {
      const approveTime = new Date(
        item.updated_at || item.created_at,
      ).getTime();

      if (item.booking_type === "daily") {
        return `📅 วันที่จอง: ${item.booking_date || "-"}`;
      } else if (item.booking_type === "weekly") {
        const expireTime = approveTime + 7 * 24 * 60 * 60 * 1000;
        const diff = expireTime - Date.now();
        if (diff <= 0) return "ครบกำหนด 7 วันแล้ว";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        return `⏳ เหลือเวลา ${days} วัน ${hours} ชม. (รายสัปดาห์)`;
      } else if (item.booking_type === "monthly") {
        const appDate = new Date(approveTime);
        const daysInMonth = new Date(
          appDate.getFullYear(),
          appDate.getMonth() + 1,
          0,
        ).getDate();
        const expireTime = approveTime + daysInMonth * 24 * 60 * 60 * 1000;
        const diff = expireTime - Date.now();
        if (diff <= 0) return "ครบกำหนดรอบเดือนแล้ว";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        return `⏳ เหลือเวลา ${days} วัน ${hours} ชม. (${daysInMonth} วัน)`;
      }
    }
    return "-";
  };

  // คำนวณสรุปยอดรายได้และสถิติต่างๆ
  const totalBookingsCount = bookings.length;
  const validRevenueBookings = bookings.filter(
    (item) => item.status === "approved" || item.status === "completed",
  );

  const totalRevenue = validRevenueBookings.reduce((sum, item) => {
    const stallPrice = Number(item.stalls?.price || 0);
    let eqPrice = 0;
    if (Array.isArray(item.selected_equipments)) {
      eqPrice = item.selected_equipments.reduce(
        (eqSum, eq) => eqSum + Number(eq.price || 0),
        0,
      );
    }
    return sum + stallPrice + eqPrice;
  }, 0);

  const pendingCount = bookings.filter(
    (item) => item.status === "pending",
  ).length;
  const approvedCount = bookings.filter(
    (item) => item.status === "approved",
  ).length;

  const dayMap = {
    Monday: "วันจันทร์",
    Tuesday: "วันอังคาร",
    Wednesday: "วันพุธ",
    Thursday: "วันพฤหัสบดี",
    Friday: "วันศุกร์",
    Saturday: "วันเสาร์",
    Sunday: "วันอาทิตย์",
  };

  const filteredBookings = bookings.filter((item) => {
    const query = searchQuery.toLowerCase();
    const name = item.customer_name ? item.customer_name.toLowerCase() : "";
    const phone = item.phone_number ? item.phone_number.toLowerCase() : "";
    const stallNum = item.stalls?.stall_number
      ? item.stalls.stall_number.toLowerCase()
      : "";
    return (
      name.includes(query) || phone.includes(query) || stallNum.includes(query)
    );
  });

  const pendingBookings = bookings.filter((item) => item.status === "pending");
  const approvedBookings = bookings.filter(
    (item) => item.status === "approved",
  );
  const expiredBookings = bookings.filter((item) => item.status === "expired");

  const renderTableRows = (list) => {
    if (list.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="p-4 text-gray-500 text-center">
            ไม่มีข้อมูลในรายการนี้
          </td>
        </tr>
      );
    }

    return list.map((item) => (
      <tr key={item.id} className="hover:bg-gray-50 border-b">
        <td className="p-3 border">
          <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
            {item.booking_type === "daily"
              ? "รายวัน"
              : item.booking_type === "weekly"
                ? "รายสัปดาห์"
                : "รายเดือน"}
          </span>
        </td>
        <td className="p-3 border font-semibold text-orange-600">
          {item.stalls?.stall_number || "ไม่พบข้อมูลล็อก"}
        </td>
        <td className="p-3 border">{item.customer_name}</td>
        <td className="p-3 border">{item.phone_number}</td>

        <td className="p-3 border text-xs text-left align-middle">
          {item.booking_type === "daily" ? (
            <span>{item.booking_date || "-"}</span>
          ) : (
            (() => {
              let daysArray = [];
              if (Array.isArray(item.selected_days))
                daysArray = item.selected_days;
              else if (typeof item.selected_days === "string") {
                try {
                  daysArray = JSON.parse(item.selected_days);
                } catch (e) {
                  daysArray = [];
                }
              }
              return daysArray.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {daysArray.map((day, i) => (
                    <li key={i}>{dayMap[day] || day}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">-</span>
              );
            })()
          )}
        </td>

        <td className="p-3 border text-xs">
          {item.time_start && item.time_end
            ? `${item.time_start} - ${item.time_end} น.`
            : "-"}
        </td>

        <td className="p-3 border text-xs text-left">
          {item.equipment_option === "bring_own" ? (
            <span className="text-gray-500">นำอุปกรณ์มาเอง</span>
          ) : (
            <ul className="list-disc pl-4 space-y-1">
              {Array.isArray(item.selected_equipments) &&
              item.selected_equipments.length > 0 ? (
                item.selected_equipments.map((eq, i) => (
                  <li key={i}>
                    {eq.name} ({eq.price} ฿)
                  </li>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </ul>
          )}
        </td>

        <td className="p-3 border">
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              item.status === "approved"
                ? "bg-green-100 text-green-700"
                : item.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-200 text-gray-700"
            }`}
          >
            {item.status === "approved"
              ? "อนุมัติแล้ว"
              : item.status === "pending"
                ? "รออนุมัติ"
                : "QR หมดอายุ"}
          </span>
          <p className="text-[11px] text-blue-600 font-bold mt-1">
            {getRemainingTimeText(item)}
          </p>
        </td>

        <td className="p-3 border space-x-1 min-w-[120px]">
          {item.status === "pending" && (
            <button
              onClick={() => handleApproveBooking(item.id)}
              className="bg-green-500 text-white px-2.5 py-1 rounded hover:bg-green-600 text-xs font-semibold shadow"
            >
              อนุมัติ
            </button>
          )}
          <button
            onClick={() => handleCancelBooking(item.id)}
            className="bg-red-500 text-white px-2.5 py-1 rounded hover:bg-red-600 text-xs font-semibold shadow"
          >
            ยกเลิก
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">
        ระบบจัดการหลังบ้าน (Admin Dashboard) - ตลาดนัดตรีสุข
      </h1>

      {/*  ส่วนแสดงรายงานสรุปยอดขายและสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-orange-200 rounded-xl shadow-md p-5 flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500">
            💰 รายได้รวมทั้งหมด
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {totalRevenue.toLocaleString()}{" "}
            <span className="text-lg font-normal text-gray-600">บาท</span>
          </p>
          <span className="text-xs text-gray-400 mt-1">
            จากรายการที่อนุมัติและเสร็จสิ้น
          </span>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl shadow-md p-5 flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500">
            📋 การจองทั้งหมด
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {totalBookingsCount}{" "}
            <span className="text-lg font-normal text-gray-600">รายการ</span>
          </p>
          <span className="text-xs text-gray-400 mt-1">ทุกสถานะในระบบ</span>
        </div>

        <div className="bg-white border border-yellow-200 rounded-xl shadow-md p-5 flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500">
            ⏳ รอแอดมินอนุมัติ
          </p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {pendingCount}{" "}
            <span className="text-lg font-normal text-gray-600">รายการ</span>
          </p>
          <span className="text-xs text-gray-400 mt-1">
            รอลูกค้ามาสแกน QR / ยืนยัน
          </span>
        </div>

        <div className="bg-white border border-green-200 rounded-xl shadow-md p-5 flex flex-col justify-between">
          <p className="text-sm font-semibold text-gray-500">
            ✅ กำลังใช้งาน (อนุมัติแล้ว)
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {approvedCount}{" "}
            <span className="text-lg font-normal text-gray-600">รายการ</span>
          </p>
          <span className="text-xs text-gray-400 mt-1">
            ล็อกถูกใช้งานอยู่ ณ ปัจจุบัน
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          จัดการล็อกตลาดทั้งหมด
        </h2>
        <form
          onSubmit={handleAddStall}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6"
        >
          <input
            type="text"
            placeholder="เลขที่ล็อก เช่น ล็อกที่ 11"
            value={newStallNumber}
            onChange={(e) => setNewStallNumber(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none"
            required
          />
          <input
            type="text"
            placeholder="รายละเอียด เช่น โซน A"
            value={newStallDesc}
            onChange={(e) => setNewStallDesc(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="ราคาค่าเช่า (บาท)"
            value={newStallPrice}
            onChange={(e) => setNewStallPrice(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none"
            required
          />
          <button
            type="submit"
            className="bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 text-sm font-semibold shadow"
          >
            + เพิ่มล็อกใหม่
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stalls.map((stall, index) => (
            <div
              key={stall.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {stall.stall_number}{" "}
                  <span className="text-xs text-orange-600 font-bold">
                    ({stall.price || 0} ฿)
                  </span>
                </p>
                <p className="text-xs text-gray-500">{stall.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(stall)}
                  className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteStall(stall.id)}
                  className="bg-red-500 text-white text-xs px-3 py-1.5 rounded"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 flex justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          📋 รายการการจองทั้งหมด
        </h2>
        <input
          type="text"
          placeholder="🔍 ค้นหาด้วยชื่อ, เบอร์โทร, เลขล็อก..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none w-80"
        />
      </div>

      {searchQuery.trim() !== "" ? (
        <div className="bg-white border border-orange-300 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-orange-600">
            🔍 ผลการค้นหาสำหรับ: "{searchQuery}"
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr className="bg-orange-600 text-white">
                  <th className="p-3 border">ประเภท</th>
                  <th className="p-3 border">ล็อก</th>
                  <th className="p-3 border">ชื่อ</th>
                  <th className="p-3 border">เบอร์</th>
                  <th className="p-3 border">วันที่</th>
                  <th className="p-3 border">เวลา</th>
                  <th className="p-3 border">อุปกรณ์</th>
                  <th className="p-3 border">สถานะ / เวลาเหลือ</th>
                  <th className="p-3 border">จัดการ</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(filteredBookings)}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border border-yellow-200 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-700">
              ⏳ รายการจองที่รออนุมัติ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th className="p-3 border">ประเภท</th>
                    <th className="p-3 border">ล็อก</th>
                    <th className="p-3 border">ชื่อ</th>
                    <th className="p-3 border">เบอร์</th>
                    <th className="p-3 border">วันที่</th>
                    <th className="p-3 border">เวลา</th>
                    <th className="p-3 border">อุปกรณ์</th>
                    <th className="p-3 border">สถานะ / เวลาเหลือ</th>
                    <th className="p-3 border">จัดการ</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows(pendingBookings)}</tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              ✅ รายการจองที่อนุมัติแล้ว
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="p-3 border">ประเภท</th>
                    <th className="p-3 border">ล็อก</th>
                    <th className="p-3 border">ชื่อ</th>
                    <th className="p-3 border">เบอร์</th>
                    <th className="p-3 border">วันที่</th>
                    <th className="p-3 border">เวลา</th>
                    <th className="p-3 border">อุปกรณ์</th>
                    <th className="p-3 border">สถานะ / เวลาเหลือ</th>
                    <th className="p-3 border">จัดการ</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows(approvedBookings)}</tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">
              ⏰ QR Code หมดอายุ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="bg-gray-600 text-white">
                    <th className="p-3 border">ประเภท</th>
                    <th className="p-3 border">ล็อก</th>
                    <th className="p-3 border">ชื่อ</th>
                    <th className="p-3 border">เบอร์</th>
                    <th className="p-3 border">วันที่</th>
                    <th className="p-3 border">เวลา</th>
                    <th className="p-3 border">อุปกรณ์</th>
                    <th className="p-3 border">สถานะ / เวลาเหลือ</th>
                    <th className="p-3 border">จัดการ</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows(expiredBookings)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalInfo.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">{modalInfo.title}</h3>
            <p className="text-sm text-gray-600">{modalInfo.message}</p>
            <div className="flex gap-2">
              {modalInfo.onConfirm ? (
                <>
                  <button
                    onClick={() => setModalInfo({ isOpen: false })}
                    className="w-1/2 bg-gray-200 py-2 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => {
                      modalInfo.onConfirm();
                      setModalInfo({ isOpen: false });
                    }}
                    className="w-1/2 bg-orange-600 text-white py-2 rounded-lg"
                  >
                    ยืนยัน
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModalInfo({ isOpen: false })}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg"
                >
                  ตกลง
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editingStall && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">แก้ไขล็อกตลาด</h3>
            <form onSubmit={handleUpdateStall} className="space-y-4">
              <input
                type="text"
                value={editStallNumber}
                onChange={(e) => setEditStallNumber(e.target.value)}
                required
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full border rounded p-2"
              />
              <input
                type="number"
                value={editStallPrice}
                onChange={(e) => setEditStallPrice(e.target.value)}
                required
                className="w-full border rounded p-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStall(null)}
                  className="w-1/2 bg-gray-200 py-2 rounded"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 text-white py-2 rounded"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
