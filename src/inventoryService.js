const redis = require("./redisClient");
const { inventoryKey, initialStock } = require("./config");

const purchaseScript = `
local current = tonumber(redis.call("GET", KEYS[1]) or "-1")
local requested = tonumber(ARGV[1])

if current < 0 then
  return {err = "INVENTORY_NOT_INITIALIZED"}
end

if requested <= 0 then
  return {0, current}
end

if current < requested then
  return {0, current}
end

local remaining = redis.call("DECRBY", KEYS[1], requested)
return {1, remaining}
`;

async function initializeInventory(stock) {
  await redis.set(inventoryKey, stock);
  return stock;
}

async function ensureInventoryInitialized() {
  const exists = await redis.exists(inventoryKey);

  if (!exists) {
    await initializeInventory(initialStock);
  }
}

async function getInventory() {
  await ensureInventoryInitialized();
  const value = await redis.get(inventoryKey);
  return Number(value);
}

async function purchase(quantity) {
  await ensureInventoryInitialized();

  const result = await redis.eval(purchaseScript, {
    keys: [inventoryKey],
    arguments: [String(quantity)]
  });

  return {
    success: result[0] === 1,
    remaining: Number(result[1])
  };
}

module.exports = {
  ensureInventoryInitialized,
  getInventory,
  initializeInventory,
  purchase
};
