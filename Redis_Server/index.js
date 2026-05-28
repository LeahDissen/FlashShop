import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import pageRoutes from "./routes/pageRoutes.js";

const app = express();
const PORT = process.env.PORT;
const HOST_NAME = process.env.HOST_NAME;

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use("/api/page", pageRoutes);

app.listen(PORT, () =>
    console.log(`Server running on http://${HOST_NAME}:${PORT}`)
);
