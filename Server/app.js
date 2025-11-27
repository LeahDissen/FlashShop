const { config } = require("./config/secret");
const express = require("express");
const cors = require("cors");
require("./db/mongoConnection");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const tipsRoutes = require("./routes/tipsRoutes.js");

const PORT = config.PORT || 5000;
const HOST_NAME = config.HOST_NAME || '127.0.0.1';
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/tips", tipsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});