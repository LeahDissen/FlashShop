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
    // Sending emails through an HTTP API (needed on servers that block SMTP, like Railway on the Hobby/Trial plans)
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER, // "brevo" | "resend" | empty = SMTP
    EMAIL_API_KEY: process.env.EMAIL_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM, // The sender address verified with the provider
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    USER: process.env.EMAIL_USER || process.env.USER,
    PASS: process.env.EMAIL_PASS || process.env.PASS,
    BCRYPT_SALT: process.env.BCRYPT_SALT,
    // Payment – Hyp Pay (secure payment page). Without all three the order is saved without going to payment
    HYP_MASOF: process.env.HYP_MASOF,
    HYP_KEY: process.env.HYP_KEY,
    HYP_PASSP: process.env.HYP_PASSP,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    // Cloudinary admin access (cloudinary://key:secret@cloud) – deletes customers' photos 30 days after printing
    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    // Google Drive (optional) – stores the final design files per order
    GOOGLE_DRIVE_CLIENT_EMAIL: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    GOOGLE_DRIVE_PRIVATE_KEY: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    GOOGLE_DRIVE_SHARED_DRIVE_ID: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID,
    GOOGLE_DRIVE_PUBLIC_LINKS: process.env.GOOGLE_DRIVE_PUBLIC_LINKS
}