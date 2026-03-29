const express = require("express");
const { initialStock } = require("./config");
const {
  getInventory,
  initializeInventory,
  purchase
} = require("./inventoryService");

const app = express();

app.use(express.json());

app.get("/health", async (req, res, next) => {
  try {
    const remaining = await getInventory();
    res.json({
      status: "ok",
      remaining
    });
  } catch (error) {
    next(error);
  }
});

app.get("/inventory", async (req, res, next) => {
  try {
    const remaining = await getInventory();
    res.json({ remaining });
  } catch (error) {
    next(error);
  }
});

app.post("/inventory/reset", async (req, res, next) => {
  try {
    const stock = Number(req.body.stock || initialStock);

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        error: "stock must be a non-negative integer"
      });
    }

    const remaining = await initializeInventory(stock);
    return res.json({
      message: "inventory reset",
      remaining
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/purchase", async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity || 1);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: "quantity must be a positive integer"
      });
    }

    const result = await purchase(quantity);

    if (!result.success) {
      return res.status(409).json({
        message: "insufficient inventory",
        remaining: result.remaining
      });
    }

    return res.json({
      message: "purchase accepted",
      remaining: result.remaining
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: "internal server error"
  });
});

module.exports = app;
