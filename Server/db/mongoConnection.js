const mongoose = require("mongoose");
const { config } = require("../config/secret")

main().catch(err => console.log("Mongo error:", err));

async function main() {
  try {
    await mongoose.connect(config.MONGO_URL);
    console.log("Mongo connected successfully");
  } catch (err) {
    console.error(" Mongo connection failed:", err.message);
  }
}