require("dotenv").config()

exports.config = {
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || 10000,
    HOST_NAME: process.env.HOST || process.env.HOST_NAME || "0.0.0.0",
    EMAIL_USER: process.env.EMAIL_USER || process.env.USER,
    EMAIL_PASS: process.env.EMAIL_PASS || process.env.PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    // שליחת מיילים דרך HTTP API (נדרש בשרתים שחוסמים SMTP, כמו Railway בתוכניות Hobby/Trial)
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER, // "brevo" | "resend" | ריק = SMTP
    EMAIL_API_KEY: process.env.EMAIL_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM, // כתובת השולח המאומתת אצל הספק
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    USER: process.env.EMAIL_USER || process.env.USER,
    PASS: process.env.EMAIL_PASS || process.env.PASS,
    BCRYPT_SALT: process.env.BCRYPT_SALT,
    // Payment – Hyp Pay (secure payment page). Without all three the order is saved without going to payment
    HYP_MASOF: process.env.HYP_MASOF,
    HYP_KEY: process.env.HYP_KEY,
    HYP_PASSP: process.env.HYP_PASSP,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    // Google Drive (אופציונלי) – שמירת קבצי העיצוב הסופיים לפי הזמנה
    GOOGLE_DRIVE_CLIENT_EMAIL: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    GOOGLE_DRIVE_PRIVATE_KEY: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    GOOGLE_DRIVE_SHARED_DRIVE_ID: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID,
    GOOGLE_DRIVE_PUBLIC_LINKS: process.env.GOOGLE_DRIVE_PUBLIC_LINKS
}