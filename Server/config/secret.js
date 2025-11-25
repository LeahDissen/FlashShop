require("dotenv").config()


exports.config = {
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
    HOST_NAME: process.env.HOST_NAME,
    EMAIL_USER: process.env.USER,
    EMAIL_PASS:  process.env.PASS,
    BCRYPT_SALT: process.env.BCRYPT_SALT
}