const { config } = require("./config/secret");
require("./db/mongoConnection");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");

const apiRateLimiter = require("./middlewares/apiRate");
const authRoutes = require("./routes/authRoutes");
const clubRoutes = require("./routes/clubRoutes");
const contactRoutes = require("./routes/contactRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const photoPriceRoutes = require("./routes/photoPriceRoutes.js");
const productRoutes = require("./routes/productRoutes");
const tipsRoutes = require("./routes/tipsRoutes.js");
const catalogRoutes = require("./routes/catalogRoutes.js");
const captionIdeasRoutes = require("./routes/captionIdeasRoutes.js");
const designFramesRoutes = require("./routes/designFramesRoutes.js");
const frameCategoriesRoutes = require("./routes/frameCategoriesRoutes.js");

const PORT = config.PORT;
const HOST_NAME = config.HOST_NAME;
const app = express();

const allowedOrigins = Array.from(new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://lustrous-speculoos-e2f3a6.netlify.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser()); 

app.use("/auth", authRoutes);
app.use("/club", clubRoutes);
app.use("/contact", contactRoutes);
app.use("/orders", orderRoutes);
app.use("/photo-prices", photoPriceRoutes);
app.use("/products", productRoutes);
app.use("/tips", tipsRoutes);
app.use("/catalog", catalogRoutes);
app.use("/caption-ideas", captionIdeasRoutes);
app.use("/design-frames", designFramesRoutes);
app.use("/frame-categories", frameCategoriesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });