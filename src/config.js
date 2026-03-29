const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 3000),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  inventoryKey: process.env.INVENTORY_KEY || "flash-sale:inventory",
  initialStock: Number(process.env.INITIAL_STOCK || 500)
};
