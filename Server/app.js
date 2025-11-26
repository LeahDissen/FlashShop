const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const contactRoutes = require('./routes/contactRoutes');
const tipsRoutes = require("./routes/tipsRoutes.js");
require("./db/mongoConnection");
const { config } = require("./config/secret")
const PORT = config.PORT || 5000;
const HOST_NAME = config.HOST_NAME || '127.0.0.1';
const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth",authRoutes);
app.use("/products",productRoutes);
app.use("/orders",orderRoutes);
app.use('/contact', contactRoutes);
app.use("/tips", tipsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});