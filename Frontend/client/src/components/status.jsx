import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

const Status = () => {
  const [stalls, setStalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedStall, setSelectedStall] = useState(null);
  const [equipments, setEquipments] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [step, setStep] = useState(1);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const qrRef = useRef();

  const [formData, setFormData] = useState({
    customer_name: "",
    phone_number: "",
    booking_type: "",
    booking_date: "",
    selected_days: [],
    time_start: "",
    time_end: "",
    equipment_option: "",
    selected_equipments: [],
  });

  useEffect(() => {
    fetchStalls();
    fetchEquipments();
  }, []);

  const showAlert = (title, message) => {
    setAlertInfo({ isOpen: true, title, message });
  };

  const fetchStalls = async () => {
    try {
      const [stallsRes, bookingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/stalls"),
        axios.get("http://localhost:5000/api/bookings"),
      ]);
      setStalls(stallsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Error fetching stalls data:", err);
    }
  };

  const fetchEquipments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/equipments");
      setEquipments(response.data);
    } catch (err) {
      console.error("Error fetching equipments:", err);
    }
  };

  const getDisabledDaysForSelectedStall = (stallId) => {
    const targetStallId = stallId || (selectedStall ? selectedStall.id : null);
    if (!targetStallId) return { disabledDaysName: [], disabledDates: [] };

    const stallBookings = bookings.filter(
      (b) => b.stall_id === targetStallId && b.status === "approved",
    );

    let disabledDaysName = [];
    let disabledDates = [];

    stallBookings.forEach((b) => {
      if (b.booking_type === "weekly" || b.booking_type === "monthly") {
        let days = [];
        if (Array.isArray(b.selected_days)) days = b.selected_days;
        else if (typeof b.selected_days === "string") {
          try {
            days = JSON.parse(b.selected_days);
          } catch (e) {}
        }
        disabledDaysName = [...disabledDaysName, ...days];
      }

      if (b.booking_type === "daily" && b.booking_date) {
        disabledDates.push(b.booking_date);

        const dateObj = new Date(b.booking_date);
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        disabledDaysName.push(dayNames[dateObj.getDay()]);
      }
    });

    return {
      disabledDaysName: [...new Set(disabledDaysName)],
      disabledDates: [...new Set(disabledDates)],
    };
  };

  const { disabledDaysName, disabledDates } = getDisabledDaysForSelectedStall();

  const getAvailableDailyOptions = () => {
    const options = [];
    const today = new Date();
    const dayNamesEn = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayNamesTh = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
    ];

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayOfWeekEn = dayNamesEn[d.getDay()];
      const dayOfWeekTh = dayNamesTh[d.getDay()];

      const isBookedDaily = disabledDates.includes(dateStr);
      const isBookedWeeklyMonthly = disabledDaysName.includes(dayOfWeekEn);

      if (!isBookedDaily && !isBookedWeeklyMonthly) {
        options.push({
          dateStr,
          label: `วัน${dayOfWeekTh}ที่ ${dd}/${mm}/${yyyy}`,
        });
      }
    }
    return options;
  };

  const availableDailyOptions = getAvailableDailyOptions();

  const getStallAvailabilityDetails = (stallId) => {
    const { disabledDaysName: disabledDays } =
      getDisabledDaysForSelectedStall(stallId);

    const allDays = [
      { en: "Monday", th: "จันทร์" },
      { en: "Tuesday", th: "อังคาร" },
      { en: "Wednesday", th: "พุธ" },
      { en: "Thursday", th: "พฤหัส" },
      { en: "Friday", th: "ศุกร์" },
      { en: "Saturday", th: "เสาร์" },
      { en: "Sunday", th: "อาทิตย์" },
    ];

    const freeDaysTh = allDays
      .filter((d) => !disabledDays.includes(d.en))
      .map((d) => d.th);

    const isFullyBooked = freeDaysTh.length === 0;

    let dayText = "";
    if (isFullyBooked) {
      dayText = "ถูกจองเต็มแล้ว";
    } else if (freeDaysTh.length === 7) {
      dayText = "ว่างทุกวัน";
    } else {
      dayText = `ว่าง: ${freeDaysTh.join(", ")}`;
    }

    return {
      isFullyBooked,
      freeDaysText: dayText,
      hasFreeDays: freeDaysTh.length > 0,
    };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDayCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        selected_days: [...formData.selected_days, value],
      });
    } else {
      setFormData({
        ...formData,
        selected_days: formData.selected_days.filter((day) => day !== value),
      });
    }
  };

  const handleEquipmentCheckboxChange = (eq) => {
    const exists = formData.selected_equipments.some(
      (item) => item.id === eq.id,
    );
    if (exists) {
      setFormData({
        ...formData,
        selected_equipments: formData.selected_equipments.filter(
          (item) => item.id !== eq.id,
        ),
      });
    } else {
      setFormData({
        ...formData,
        selected_equipments: [...formData.selected_equipments, eq],
      });
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    if (!formData.booking_type)
      return showAlert("แจ้งเตือน", "กรุณาเลือกประเภทการจอง");
    if (formData.booking_type === "daily" && !formData.booking_date)
      return showAlert("แจ้งเตือน", "กรุณาเลือกวันที่ต้องการจอง");
    if (
      (formData.booking_type === "weekly" ||
        formData.booking_type === "monthly") &&
      formData.selected_days.length === 0
    )
      return showAlert("แจ้งเตือน", "กรุณาเลือกอย่างน้อย 1 วัน");
    if (!formData.time_start)
      return showAlert("แจ้งเตือน", "กรุณาเลือกช่วงเวลาเริ่ม");
    if (!formData.time_end)
      return showAlert("แจ้งเตือน", "กรุณาเลือกช่วงเวลาจบ");
    if (!formData.equipment_option)
      return showAlert(
        "แจ้งเตือน",
        "กรุณาเลือกว่าต้องการนำอุปกรณ์มาเองหรือเช่าจากตลาด",
      );

    if (formData.equipment_option === "rent_from_market") {
      setShowEquipmentModal(true);
    } else {
      setFormData({ ...formData, selected_equipments: [] });
      setStep(2);
    }
  };

  const handleConfirmEquipments = () => {
    if (formData.selected_equipments.length === 0) {
      return showAlert(
        "แจ้งเตือน",
        "กรุณาเลือกอุปกรณ์อย่างน้อย 1 ชิ้น หรือเปลี่ยนไปเลือกนำอุปกรณ์มาเอง",
      );
    }
    setShowEquipmentModal(false);
    setStep(2);
  };

  // 🟢 คำนวณราคารวม (ค่าล็อก + ค่าอุปกรณ์)
  const calculateTotalPrice = () => {
    const stallPrice = Number(selectedStall?.price || 0);
    const equipmentPrice = formData.selected_equipments.reduce(
      (sum, eq) => sum + Number(eq.price || 0),
      0,
    );
    return stallPrice + equipmentPrice;
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await axios.post("http://localhost:5000/api/bookings", {
        stall_id: selectedStall.id,
        ...formData,
      });

      const newBookingId = response.data.data[0].id;

      setSelectedStall(null);
      setStep(1);
      setFormData({
        customer_name: "",
        phone_number: "",
        booking_type: "",
        booking_date: "",
        selected_days: [],
        time_start: "",
        time_end: "",
        equipment_option: "",
        selected_equipments: [],
      });
      fetchStalls();

      setCreatedBookingId(newBookingId);
      setShowQRModal(true);
    } catch (err) {
      console.error(err);
      showAlert(
        "เกิดข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการจอง: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = qrRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 80;
      canvas.height = img.height + 120;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 40, 20);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `รหัสจองล็อกตลาด: ${createdBookingId}`,
        canvas.width / 2,
        img.height + 60,
      );

      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        "กรุณาให้แอดมินสแกนภายใน 24 ชม.",
        canvas.width / 2,
        img.height + 90,
      );

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Booking-QR-${createdBookingId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const translateDays = (days) => {
    const map = {
      Monday: "วันจันทร์",
      Tuesday: "วันอังคาร",
      Wednesday: "วันพุธ",
      Thursday: "วันพฤหัสบดี",
      Friday: "วันศุกร์",
      Saturday: "วันเสาร์",
      Sunday: "วันอาทิตย์",
    };
    return days.map((d) => map[d] || d).join(", ");
  };

  return (
    <>
      <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 my-8">
        <div className="flex md:flex-row justify-center items-center mb-6 gap-4">
          <div></div>
          <h2 className="text-4xl font-bold text-center text-orange-600">
            ตารางแสดงสถานะทั้งหมด
          </h2>
          <a
            href="tel:0800000000"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-base font-semibold shadow flex items-center gap-2 transition"
          >
            📞 โทรติดต่อเจ้าหน้าที่ตลาด
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-base">
            <thead>
              <tr className="bg-orange-600 text-white">
                <th className="p-3 border border-gray-200">เลขที่ล็อก</th>
                <th className="p-3 border border-gray-200">
                  รายละเอียด & ราคา
                </th>
                <th className="p-3 border border-gray-200">
                  สถานะการจอง & วันที่ว่าง
                </th>
                <th className="p-3 border border-gray-200">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {stalls.map((stall) => {
                const avail = getStallAvailabilityDetails(stall.id);

                return (
                  <tr key={stall.id} className="hover:bg-gray-50 border-b">
                    <td className="p-3 text-xl border border-gray-200 font-semibold">
                      {stall.stall_number}
                    </td>
                    <td className="p-3 text-base border border-gray-200">
                      <p className="font-semibold text-gray-800">
                        {stall.description || "ล็อกตลาดตรีสุข"}
                      </p>
                      <p className="text-orange-600 font-bold mt-1">
                        ราคาค่าเช่า: {stall.price || 0} บาท
                      </p>
                    </td>

                    <td className="p-3 border border-gray-200 text-left">
                      <div className="flex flex-col space-y-2 max-w-md mx-auto text-base">
                        <div className="flex justify-between items-center border-b pb-1">
                          <div>
                            <span className="font-semibold text-gray-800">
                              รายวัน:{" "}
                            </span>
                            <span className="text-xs text-gray-500 block md:inline">
                              ({avail.freeDaysText})
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-semibold ${
                              avail.hasFreeDays
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {avail.hasFreeDays ? "ว่าง" : "ถูกจองแล้ว"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center border-b pb-1">
                          <div>
                            <span className="font-semibold text-gray-800">
                              รายสัปดาห์:{" "}
                            </span>
                            <span className="text-xs text-gray-500 block md:inline">
                              ({avail.freeDaysText})
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-semibold ${
                              avail.hasFreeDays
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {avail.hasFreeDays ? "ว่าง" : "ถูกจองแล้ว"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-gray-800">
                              รายเดือน:{" "}
                            </span>
                            <span className="text-xs text-gray-500 block md:inline">
                              ({avail.freeDaysText})
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-semibold ${
                              avail.hasFreeDays
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {avail.hasFreeDays ? "ว่าง" : "ถูกจองแล้ว"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 border border-gray-200">
                      <button
                        disabled={avail.isFullyBooked}
                        className={`px-4 py-2 rounded text-2xl text-white shadow transition ${
                          avail.isFullyBooked
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                        onClick={() => {
                          setSelectedStall(stall);
                          setStep(1);
                        }}
                      >
                        {avail.isFullyBooked ? "เต็ม" : "จอง"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal หลักการจอง */}
      {selectedStall && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ทำรายการจอง:{" "}
              <span className="text-orange-600">
                {selectedStall.stall_number}
              </span>
            </h3>

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="กรอกชื่อ-นามสกุลของท่าน"
                    type="text"
                    name="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="082-XXX-XXXX"
                    type="tel"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทการจอง <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="booking_type"
                    required
                    value={formData.booking_type}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData((prev) => ({
                        ...prev,
                        booking_type: e.target.value,
                        booking_date: "",
                        selected_days: [],
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none"
                  >
                    <option value="" disabled>
                      -- เลือกประเภทการจอง --
                    </option>
                    <option value="daily">จองแบบรายวัน</option>
                    <option value="weekly">จองแบบรายสัปดาห์</option>
                    <option value="monthly">จองแบบรายเดือน</option>
                  </select>
                </div>

                {formData.booking_type === "daily" && (
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-1">
                      วันที่ต้องการจอง <span className="text-red-500">*</span>{" "}
                      (กดเลือกวันที่ต้องการ)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      <span className="text-red-500">*</span> จองล่วงหน้าได้ 30
                      วัน
                    </p>
                    {availableDailyOptions.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto p-1 bg-gray-50 border border-gray-200 rounded-xl">
                        {availableDailyOptions.map((opt) => {
                          const isSelected =
                            formData.booking_date === opt.dateStr;
                          return (
                            <button
                              key={opt.dateStr}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  booking_date: opt.dateStr,
                                })
                              }
                              className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left font-bold transition-all text-base ${
                                isSelected
                                  ? "border-orange-600 bg-orange-50 text-orange-600 shadow-md"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 active:bg-gray-100"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && (
                                <span className="text-xl font-extrabold text-orange-600">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 font-medium p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                        ไม่มีวันที่ว่างสำหรับการจองรายวันในขณะนี้
                      </p>
                    )}
                  </div>
                )}

                {(formData.booking_type === "weekly" ||
                  formData.booking_type === "monthly") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลือกวันที่ต้องการ (เลือกได้มากกว่า 1 วัน){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border">
                      {[
                        { en: "Monday", th: "วันจันทร์" },
                        { en: "Tuesday", th: "วันอังคาร" },
                        { en: "Wednesday", th: "วันพุธ" },
                        { en: "Thursday", th: "วันพฤหัสบดี" },
                        { en: "Friday", th: "วันศุกร์" },
                        { en: "Saturday", th: "วันเสาร์" },
                        { en: "Sunday", th: "วันอาทิตย์" },
                      ].map((dayObj) => {
                        const isAlreadyBooked = disabledDaysName.includes(
                          dayObj.en,
                        );

                        return (
                          <label
                            key={dayObj.en}
                            className={`flex items-center space-x-2 text-sm ${
                              isAlreadyBooked
                                ? "cursor-not-allowed opacity-50 text-gray-400"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={dayObj.en}
                              disabled={isAlreadyBooked}
                              checked={formData.selected_days.includes(
                                dayObj.en,
                              )}
                              onChange={handleDayCheckboxChange}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span>
                              {dayObj.th} {isAlreadyBooked && "(ถูกจองแล้ว)"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ช่วงเวลาเริ่ม <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="time_start"
                    required
                    value={formData.time_start}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none"
                  >
                    <option value="" disabled>
                      เลือกเวลาเริ่ม
                    </option>
                    {[
                      "09:00",
                      "10:00",
                      "11:00",
                      "12:00",
                      "13:00",
                      "14:00",
                      "15:00",
                      "16:00",
                      "17:00",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t} น.
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ช่วงเวลาจบ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="time_end"
                    required
                    value={formData.time_end}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none"
                  >
                    <option value="" disabled>
                      เลือกเวลาจบ
                    </option>
                    {[
                      "10:00",
                      "11:00",
                      "12:00",
                      "13:00",
                      "14:00",
                      "15:00",
                      "16:00",
                      "17:00",
                      "18:00",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t} น.
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อุปกรณ์การขาย <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="equipment_option"
                    required
                    value={formData.equipment_option}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none"
                  >
                    <option value="" disabled>
                      -- เลือกอุปกรณ์ --
                    </option>
                    <option value="bring_own">นำอุปกรณ์มาเอง</option>
                    <option value="rent_from_market">
                      ขอยืม/เช่าอุปกรณ์จากตลาด
                    </option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStall(null)}
                    className="w-1/2 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-orange-600 text-white py-2 rounded-lg font-medium text-sm shadow-md"
                  >
                    หน้าถัดไป &rarr;
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* 🟢 แสดงรายละเอียดและราคารวมในขั้นตอนสรุป */}
                <div className="bg-gray-50 p-4 rounded-lg border text-sm space-y-2">
                  <p>
                    <b>ชื่อ:</b> {formData.customer_name}
                  </p>
                  <p>
                    <b>เบอร์โทร:</b> {formData.phone_number}
                  </p>
                  <p>
                    <b>ประเภทการจอง:</b>{" "}
                    {formData.booking_type === "daily"
                      ? "รายวัน"
                      : formData.booking_type === "weekly"
                        ? "รายสัปดาห์"
                        : "รายเดือน"}
                  </p>

                  {formData.booking_type === "daily" ? (
                    <p>
                      <b>วันที่จอง:</b> {formData.booking_date}
                    </p>
                  ) : (
                    <p>
                      <b>วันที่เลือก:</b>{" "}
                      {translateDays(formData.selected_days)}
                    </p>
                  )}

                  <p>
                    <b>ช่วงเวลา:</b> {formData.time_start} น. ถึง{" "}
                    {formData.time_end} น.
                  </p>
                  <hr className="my-2" />
                  <p className="flex justify-between">
                    <span>ค่าเช่าล็อก ({selectedStall.stall_number}):</span>
                    <span className="font-semibold">
                      {selectedStall.price || 0} บาท
                    </span>
                  </p>
                  <p>
                    <b>อุปกรณ์:</b>{" "}
                    {formData.equipment_option === "bring_own"
                      ? "นำอุปกรณ์มาเอง (0 บาท)"
                      : `เช่าจากตลาด (${formData.selected_equipments.length} รายการ)`}
                  </p>
                  {formData.equipment_option === "rent_from_market" && (
                    <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                      {formData.selected_equipments.map((eq) => (
                        <li key={eq.id} className="flex justify-between">
                          <span>{eq.name}</span>
                          <span>{eq.price} บาท</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <hr className="my-2" />
                  <p className="flex justify-between text-base font-bold text-orange-600">
                    <span>ยอดรวมทั้งสิ้น:</span>
                    <span>{calculateTotalPrice()} บาท</span>
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/2 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm"
                  >
                    &larr; ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className={`w-1/2 py-2 rounded-lg font-medium text-sm shadow-md transition ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ยืนยันการจอง"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {alertInfo.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-orange-600">
              {alertInfo.title}
            </h3>
            <p className="text-sm text-gray-600">{alertInfo.message}</p>
            <button
              onClick={() =>
                setAlertInfo({ isOpen: false, title: "", message: "" })
              }
              className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-medium text-sm shadow hover:bg-orange-700 transition"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xl font-bold text-orange-600">
              จองสำเร็จ! QR Code สำหรับแอดมิน
            </h3>

            <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-red-600 text-xs font-semibold">
              ⚠️ กรุณาให้แอดมินสแกน QR Code ภายใน 24 ชั่วโมง
              มิฉะนั้นระบบจะยกเลิกการจองอัตโนมัติ
            </div>

            <div
              ref={qrRef}
              className="flex justify-center bg-gray-50 p-4 rounded-xl border"
            >
              <QRCodeSVG
                value={`${window.location.origin}/?booking_id=${createdBookingId}`}
                size={180}
              />
            </div>

            <p className="text-xs text-gray-400 break-all font-mono">
              ID: {createdBookingId}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm shadow hover:bg-blue-700 transition"
              >
                📥 บันทึกรูปภาพ QR Code ลงเครื่อง
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQRModal(false);
                  setCreatedBookingId(null);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm shadow hover:bg-gray-300 transition"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-orange-600 mb-3">
              เลือกอุปกรณ์ที่ต้องการเช่า
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              เลือกอุปกรณ์ได้หลายรายการตามต้องการ
            </p>

            <div className="grid grid-cols-1 gap-3 mb-6">
              {equipments.map((eq) => {
                const isSelected = formData.selected_equipments.some(
                  (item) => item.id === eq.id,
                );
                return (
                  <div
                    key={eq.id}
                    onClick={() => handleEquipmentCheckboxChange(eq)}
                    className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? "border-orange-600 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {eq.image_url && (
                      <img
                        src={eq.image_url}
                        alt={eq.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{eq.name}</h4>
                      <p className="text-xs text-gray-500">{eq.description}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">
                        {eq.price} บาท
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEquipmentModal(false)}
                className="w-1/2 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmEquipments}
                className={`w-1/2 py-2 rounded-lg font-medium text-sm shadow-md transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการเลือกอุปกรณ์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Status;
