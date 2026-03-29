const { createClient } = require("redis");
const { redisUrl } = require("./config");

const client = createClient({
  url: redisUrl
});

client.on("error", (error) => {
  console.error("Redis client error:", error);
});

module.exports = client;
