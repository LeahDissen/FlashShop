const mongoose = require("mongoose");
const { config } = require("../config/secret")

main().catch(err => console.log("Mongo error:", err));

async function main() {
  try {
    await mongoose.connect(config.MONGO_URL);
    console.log("Mongo connected successfully");
    try {
      const { splitLegacyMagnetProducts } = require("../utils/splitLegacyMagnetProducts");
      const result = await splitLegacyMagnetProducts();
      if (result?.split) {
        console.log(`Magnet products split into separate sizes: ${result.split} bundle(s)`);
      }
    } catch (migrationErr) {
      console.error("Magnet product migration failed:", migrationErr.message);
    }
  } catch (err) {
    console.error(" Mongo connection failed:", err.message);
  }
}