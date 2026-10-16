const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const { readdirSync } = require("fs");

// Middleware
app.use(morgan("dev"));
app.use(cors());


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// map route มาใช้ไม่ต้อง import
readdirSync("./routes").map((item) =>
  app.use("/api", require("./routes/" + item)),
);

// port listen
app.listen(5000, () => console.log("Server Run on Port 5000"));