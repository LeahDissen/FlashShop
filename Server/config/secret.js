require("dotenv").config()

exports.config = {
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
    HOST_NAME: process.env.HOST_NAME,
    EMAIL_USER: process.env.EMAIL_USER || process.env.USER,
    EMAIL_PASS: process.env.EMAIL_PASS || process.env.PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    USER: process.env.EMAIL_USER || process.env.USER,
    PASS: process.env.EMAIL_PASS || process.env.PASS,
    BCRYPT_SALT: process.env.BCRYPT_SALT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
}