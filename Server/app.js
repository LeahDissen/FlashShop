const { config } = require("./config/secret");
const express = require("express");
const cors = require("cors");
require("./db/mongoConnection");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/ordersRoutes");
const tipsRoutes = require("./routes/tipsRoutes.js");
const apiRateLimiter = require("./middlewares/apiRate");
const clubRoutes = require("./routes/clubRoutes");
require("./db/mongoConnection");
const { config } = require("./config/secret")
const PORT = config.PORT;
const HOST_NAME = config.HOST_NAME;
const app = express();
const cookieParser = require("cookie-parser");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/auth",apiRateLimiter ,authRoutes);
app.use(cookieParser());


app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/tips", tipsRoutes);
app.use("/club", clubRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST_NAME}:${PORT}`);
});