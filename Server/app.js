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

const PORT = config.PORT;
const HOST_NAME = config.HOST_NAME;
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser()); 

app.use("/auth", apiRateLimiter, authRoutes);
app.use("/club", clubRoutes);
app.use("/contact", contactRoutes);
app.use("/orders", orderRoutes);
app.use("/photo-prices", photoPriceRoutes);
app.use("/products", productRoutes);
app.use("/tips", tipsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});