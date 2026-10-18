import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import pageRoutes from "./routes/pageRoutes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST_NAME = process.env.HOST_NAME || "0.0.0.0";

// Origins allowed by CORS: the production client URLs come from CLIENT_URL (comma-separated)
const allowedOrigins = Array.from(new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
