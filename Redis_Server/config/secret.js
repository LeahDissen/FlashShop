import dotenv from "dotenv";
dotenv.config();

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    
}

export default config;