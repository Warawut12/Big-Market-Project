const { supabase } = require("../config/supabase");

// ดึงรายการอุปกรณ์ทั้งหมด
exports.getEquipments = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("equipments")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Error fetching equipments:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// เพิ่มอุปกรณ์ใหม่ (แอดมิน)
exports.createEquipment = async (req, res) => {
    try {
        const { name, description, price, image_url } = req.body;
        const { data, error } = await supabase
            .from("equipments")
            .insert([{ name, description, price, image_url }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "เพิ่มอุปกรณ์สำเร็จ!", data });
    } catch (err) {
        console.error("Error creating equipment:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// แก้ไขข้อมูลอุปกรณ์ (แอดมิน)
exports.updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image_url } = req.body;

        const { data, error } = await supabase
            .from("equipments")
            .update({ name, description, price, image_url })
            .eq("id", id)
            .select();

        if (error) throw error;
        res.json({ message: "อัปเดตข้อมูลอุปกรณ์สำเร็จ", data });
    } catch (err) {
        console.error("Error updating equipment:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ลบอุปกรณ์ (แอดมิน)
exports.deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from("equipments").delete().eq("id", id);

        if (error) throw error;
        res.json({ message: "ลบอุปกรณ์สำเร็จ" });
    } catch (err) {
        console.error("Error deleting equipment:", err.message);
        res.status(500).json({ error: err.message });
    }
};