
const { config } = require("./config/secret");
require("./db/mongoConnection");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const tipsRoutes = require("./routes/tipsRoutes.js");
const apiRateLimiter = require("./middlewares/apiRate");
const clubRoutes = require("./routes/clubRoutes");
const contactRoutes = require("./routes/contactRoutes");

const PORT = config.PORT;
const HOST_NAME = config.HOST_NAME;
const app = express();
const cookieParser = require("cookie-parser");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/auth",authRoutes);
app.use("/products",productRoutes);
app.use("/orders",orderRoutes);
app.use('/contact', contactRoutes);
app.use(cookieParser());
app.use("/tips", tipsRoutes);
app.use("/club", clubRoutes);
app.use("/messages", contactRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});