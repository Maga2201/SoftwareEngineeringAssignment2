const app = require("./app");
const redis = require("./redisClient");
const { port } = require("./config");
const { ensureInventoryInitialized } = require("./inventoryService");

async function start() {
  await redis.connect();
  await ensureInventoryInitialized();

  app.listen(port, () => {
    console.log("Inventory tracker listening on port " + port);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
