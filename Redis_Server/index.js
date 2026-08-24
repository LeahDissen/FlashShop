import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import pageRoutes from "./routes/pageRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const HOST_NAME = process.env.HOST_NAME;

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
app.use(cookieParser());
app.use(express.json());

app.use("/api/page", pageRoutes);

app.listen(PORT, () =>
    console.log(`Server running on http://${HOST_NAME}:${PORT}`)
);
