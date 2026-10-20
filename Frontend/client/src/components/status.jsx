import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import API from "../../utils/axios";

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

  const showAlert = (title, message) =>
    setAlertInfo({ isOpen: true, title, message });

  const fetchStalls = async () => {
    try {
      const [stallsRes, bookingsRes] = await Promise.all([
        API.get("/api/stalls"),
        API.get("/api/bookings"),
      ]);
      setStalls(stallsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error("Error fetching stalls data:", err);
    }
  };

  const fetchEquipments = async () => {
    try {
      const response = await API.get("/api/equipments");
      setEquipments(response.data);
    } catch (err) {
      console.error("Error fetching equipments:", err);
    }
  };

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

  // 🟢 ปรับปรุงใหม่: ดึงช่วงเวลาที่ถูกจองแล้วของล็อกนี้มาปิดไม่ให้เลือกทันที
  const getDisabledHours = () => {
    if (!selectedStall) return [];

    // ดึงการจองทั้งหมดที่อนุมัติแล้วหรือรออนุมัติของล็อกนี้
    const targetBookings = bookings.filter(
      (b) =>
        b.stall_id === selectedStall.id &&
        (b.status === "approved" || b.status === "pending"),
    );

    const occupiedHours = new Set();
    targetBookings.forEach((b) => {
      if (b.time_start && b.time_end) {
        const startH = parseInt(b.time_start.split(":")[0], 10);
        const endH = parseInt(b.time_end.split(":")[0], 10);
        for (let h = startH; h < endH; h++) {
          occupiedHours.add(h);
        }
      }
    });

    return Array.from(occupiedHours);
  };

  const disabledHours = getDisabledHours();

  const getStallAvailabilityDetails = (stallId) => {
    const activeBookings = bookings.filter(
      (b) =>
        b.stall_id === stallId &&
        (b.status === "approved" || b.status === "pending"),
    );

    if (activeBookings.length === 0) {
      return {
        isFullyBooked: false,
        freeTimeText: "ว่างตลอดวัน (09:00 - 18:00 น.)",
        hasFreeTime: true,
      };
    }

    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const occupiedHours = new Set();

    activeBookings.forEach((b) => {
      if (b.time_start && b.time_end) {
        const startH = parseInt(b.time_start.split(":")[0], 10);
        const endH = parseInt(b.time_end.split(":")[0], 10);
        for (let h = startH; h < endH; h++) {
          occupiedHours.add(h);
        }
      }
    });

    const freeHours = hours.filter((h) => !occupiedHours.has(h));

    if (freeHours.length === 0) {
      return {
        isFullyBooked: true,
        freeTimeText: "ถูกจองเต็มทุกช่วงเวลาแล้ว",
        hasFreeTime: false,
      };
    }

    let timeRanges = [];
    let startRange = null;
    let endRange = null;

    freeHours.forEach((h, idx) => {
      if (startRange === null) {
        startRange = h;
        endRange = h + 1;
      } else if (h === endRange) {
        endRange = h + 1;
      } else {
        timeRanges.push(
          `${String(startRange).padStart(2, "0")}:00 - ${String(endRange).padStart(2, "0")}:00`,
        );
        startRange = h;
        endRange = h + 1;
      }

      if (idx === freeHours.length - 1) {
        timeRanges.push(
          `${String(startRange).padStart(2, "0")}:00 - ${String(endRange).padStart(2, "0")}:00`,
        );
      }
    });

    return {
      isFullyBooked: false,
      freeTimeText: `ช่วงเวลาที่ว่าง: ${timeRanges.join(", ")}`,
      hasFreeTime: true,
    };
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
    if (!formData.customer_name)
      return showAlert("แจ้งเตือน", "กรุณากรอกชื่อ-นามสกุล");
    if (!formData.phone_number)
      return showAlert("แจ้งเตือน", "กรุณากรอกเบอร์โทรศัพท์");
    if (!formData.booking_type)
      return showAlert("แจ้งเตือน", "กรุณาเลือกประเภทการจอง");
    if (formData.booking_type === "daily" && !formData.booking_date)
      return showAlert("แจ้งเตือน", "กรุณาเลือกวันที่ต้องการจอง");
    if (
      (formData.booking_type === "weekly" ||
        formData.booking_type === "monthly") &&
      formData.selected_days.length === 0
    ) {
      return showAlert("แจ้งเตือน", "กรุณาเลือกอย่างน้อย 1 วัน");
    }
    if (!formData.time_start || !formData.time_end)
      return showAlert("แจ้งเตือน", "กรุณาเลือกช่วงเวลาให้ครบถ้วน");
    if (!formData.equipment_option)
      return showAlert("แจ้งเตือน", "กรุณาเลือกประเภทอุปกรณ์การขาย");

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
        "กรุณาเลือกอุปกรณ์อย่างน้อย 1 ชิ้น หรือเปลี่ยนเป็นนำอุปกรณ์มาเอง",
      );
    }
    setShowEquipmentModal(false);
    setStep(2);
  };

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
      const response = await API.post("/api/bookings", {
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
      showAlert("เกิดข้อผิดพลาด", err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR_Booking_${createdBookingId || "stall"}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
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
        <h2 className="text-4xl font-bold text-center text-orange-600 mb-6">
          ตารางแสดงสถานะล็อกตลาด
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-base">
            <thead>
              <tr className="bg-orange-600 text-white">
                <th className="p-3 border">เลขที่ล็อก</th>
                <th className="p-3 border">รายละเอียด & ราคา</th>
                <th className="p-3 border">สถานะช่วงเวลาที่ว่าง</th>
                <th className="p-3 border">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {stalls.map((stall) => {
                const avail = getStallAvailabilityDetails(stall.id);
                return (
                  <tr key={stall.id} className="hover:bg-gray-50 border-b">
                    <td className="p-3 text-xl border font-semibold">
                      {stall.stall_number}
                    </td>
                    <td className="p-3 border">
                      <p className="font-semibold text-gray-800">
                        {stall.description || "ล็อกตลาดตรีสุข"}
                      </p>
                      <p className="text-orange-600 font-bold mt-1">
                        ราคาค่าเช่า: {stall.price || 0} บาท
                      </p>
                    </td>
                    <td className="p-3 border text-left">
                      <p
                        className={`text-sm font-semibold ${avail.hasFreeTime ? "text-green-700" : "text-red-600"}`}
                      >
                        {avail.freeTimeText}
                      </p>
                    </td>
                    <td className="p-3 border">
                      <button
                        disabled={avail.isFullyBooked}
                        className={`px-4 py-2 rounded text-lg text-white shadow transition ${
                          avail.isFullyBooked
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                        onClick={() => {
                          setSelectedStall(stall);
                          setStep(1);
                        }}
                      >
                        {avail.isFullyBooked ? "เต็มแล้ว" : "จองช่วงเวลา"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStall && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              จองล็อก:{" "}
              <span className="text-orange-600">
                {selectedStall.stall_number}
              </span>
            </h3>

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    placeholder="กรอกชื่อ-นามสกุล"
                    name="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full border rounded p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    placeholder="08X-XXX-XXXX"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full border rounded p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    ประเภทการจอง *
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
                        time_start: "",
                        time_end: "",
                      }));
                    }}
                    className="w-full border rounded p-2.5 text-sm bg-white"
                  >
                    <option value="">-- เลือกประเภทการจอง --</option>
                    <option value="daily">รายวัน</option>
                    <option value="weekly">รายสัปดาห์</option>
                    <option value="monthly">รายเดือน</option>
                  </select>
                </div>

                {formData.booking_type === "daily" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      วันที่ต้องการจอง *
                    </label>
                    <input
                      type="date"
                      name="booking_date"
                      required
                      value={formData.booking_date}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({
                          ...prev,
                          time_start: "",
                          time_end: "",
                        }));
                      }}
                      className="w-full border rounded p-2.5 text-sm"
                    />
                  </div>
                )}

                {(formData.booking_type === "weekly" ||
                  formData.booking_type === "monthly") && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      เลือกวันที่ต้องการขาย (เลือกได้มากกว่า 1 วัน) *
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
                            class={`flex items-center space-x-2 text-xs ${
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
                              onChange={(e) => {
                                handleDayCheckboxChange(e);
                                setFormData((prev) => ({
                                  ...prev,
                                  time_start: "",
                                  time_end: "",
                                }));
                              }}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span>
                              {dayObj.th} {isAlreadyBooked && "(จองแล้ว)"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 🟢 ส่วนเลือกเวลาเริ่มต้นและเวลาจบ (ปิดทับช่วงเวลาที่ถูกจองแล้วอัตโนมัติ) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      ช่วงเวลาเริ่ม *
                    </label>
                    <select
                      name="time_start"
                      required
                      value={formData.time_start}
                      onChange={handleChange}
                      className="w-full border rounded p-2 text-sm bg-white"
                    >
                      <option value="">เลือกเวลาเริ่ม</option>
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
                      ].map((t) => {
                        const hour = parseInt(t.split(":")[0], 10);
                        const isDisabled = disabledHours.includes(hour);
                        return (
                          <option key={t} value={t} disabled={isDisabled}>
                            {t} น. {isDisabled ? "(ถูกจองแล้ว)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      ช่วงเวลาจบ *
                    </label>
                    <select
                      name="time_end"
                      required
                      value={formData.time_end}
                      onChange={handleChange}
                      className="w-full border rounded p-2 text-sm bg-white"
                    >
                      <option value="">เลือกเวลาจบ</option>
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
                      ].map((t) => {
                        const hour = parseInt(t.split(":")[0], 10);
                        const startHour = formData.time_start
                          ? parseInt(formData.time_start.split(":")[0], 10)
                          : 0;
                        // ปิดไม่ให้เลือกเวลาจบที่น้อยกว่าหรือเท่ากับเวลาเริ่ม หรือชนกับช่วงเวลาที่ถูกจองไปแล้ว
                        const isDisabled =
                          hour <= startHour ||
                          (formData.time_start &&
                            disabledHours.some(
                              (h) => h >= startHour && h < hour,
                            ));
                        return (
                          <option key={t} value={t} disabled={isDisabled}>
                            {t} น. {isDisabled ? "(ไม่ว่าง)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    อุปกรณ์การขาย *
                  </label>
                  <select
                    name="equipment_option"
                    required
                    value={formData.equipment_option}
                    onChange={handleChange}
                    className="w-full border rounded p-2.5 text-sm bg-white"
                  >
                    <option value="">-- เลือกอุปกรณ์ --</option>
                    <option value="bring_own">นำอุปกรณ์มาเอง</option>
                    <option value="rent_from_market">เช่าอุปกรณ์จากตลาด</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStall(null)}
                    className="w-1/2 bg-gray-200 py-2 rounded text-sm font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-orange-600 text-white py-2 rounded text-sm font-medium shadow"
                  >
                    หน้าถัดไป &rarr;
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="bg-gray-50 p-3 rounded border space-y-1">
                  <p>
                    <b>ชื่อ:</b> {formData.customer_name}
                  </p>
                  <p>
                    <b>เบอร์โทร:</b> {formData.phone_number}
                  </p>
                  <p>
                    <b>ประเภท:</b>{" "}
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
                    <b>ช่วงเวลา:</b> {formData.time_start} - {formData.time_end}{" "}
                    น.
                  </p>
                  <hr className="my-2" />
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
                  <p className="flex justify-between font-bold text-orange-600 text-base">
                    <span>ยอดรวมทั้งสิ้น:</span>
                    <span>{calculateTotalPrice()} บาท</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/2 bg-gray-200 py-2 rounded text-sm font-medium"
                  >
                    &larr; ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="w-1/2 bg-green-600 text-white py-2 rounded text-sm font-medium shadow"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการจอง"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-orange-600 mb-1">
              เลือกอุปกรณ์ที่ต้องการเช่า
            </h3>
            <p className="text-xs text-gray-500 mb-4">
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
                        className="w-14 h-14 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {eq.name}
                      </h4>
                      <p className="text-xs text-gray-500">{eq.description}</p>
                      <p className="text-xs font-bold text-orange-600 mt-1">
                        {eq.price} บาท
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-orange-600 rounded"
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
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmEquipments}
                className="w-1/2 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium text-sm shadow"
              >
                ยืนยันการเลือกอุปกรณ์
              </button>
            </div>
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

            {/* 🟢 เพิ่มปุ่มดาวน์โหลด QR Code กลับเข้ามาตรงนี้ */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={downloadQR}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-medium text-sm shadow transition flex items-center justify-center gap-2"
              >
                <span>💾</span> บันทึก QR Code ลงเครื่อง
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
    </>
  );
};

export default Status;
