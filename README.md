# Assignment 2: The High-Throughput Inventory Tracker

This project implements a flash-sale inventory service for a stock of 500 items using Redis as a remote distributed cache. The core concurrency requirement is handled with a single atomic Redis Lua script, which guarantees that inventory is decremented only when enough stock is available.

## Why This Prevents Overselling

If thousands of buyers hit the server at the same time, a naive flow such as:

1. Read current inventory
2. Check if it is greater than zero
3. Write back the decremented value

can oversell because multiple requests can read the same value before either one writes the update.

This implementation avoids that race by moving the check-and-decrement into Redis itself:

- The API sends one atomic `EVAL` command to Redis.
- Redis executes the Lua script as a single uninterrupted operation.
- If enough stock exists, Redis decrements the value with `DECRBY`.
- If stock is insufficient, Redis returns a rejection without changing the count.

Because the whole decision happens inside Redis, no two requests can decrement the same item count at once.

## Architecture

- `Redis` stores the live inventory count under one key.
- `Express API` exposes endpoints for reading stock, resetting stock, and attempting purchases.
- `Lua script` in Redis performs the atomic purchase operation.
- `Load test` fires many concurrent purchase requests to demonstrate that accepted purchases never exceed inventory.

## Endpoints

- `GET /health` returns service status and current inventory.
- `GET /inventory` returns the remaining inventory.
- `POST /inventory/reset` sets inventory to a provided stock value.
- `POST /purchase` attempts to buy a quantity and returns either success or `409 Conflict`.

## Run With Docker

```bash
docker compose up --build
```

The service will be available at [http://localhost:3000](http://localhost:3000).

## Example Requests

Check inventory:

```bash
curl http://localhost:3000/inventory
```

Attempt one purchase:

```bash
curl -X POST http://localhost:3000/purchase \
  -H "Content-Type: application/json" \
  -d '{"quantity":1}'
```

Reset inventory to 500:

```bash
curl -X POST http://localhost:3000/inventory/reset \
  -H "Content-Type: application/json" \
  -d '{"stock":500}'
```

## Concurrency Demo

After the containers are up, run:

```bash
docker compose exec api npm run load-test
```

With the default configuration:

- `500` purchase attempts should succeed.
- The rest should receive `409 Conflict`.
- Final inventory should be `0`.

That demonstrates that even under simultaneous access, the system does not oversell.

## Distributed Lock vs Atomic Operations

A distributed lock is one possible solution, but it adds complexity:

- Lock acquisition and expiry must be managed carefully.
- Throughput drops because requests serialize around the lock.
- Failures can leave stale locks if not handled correctly.

For a single inventory counter, Redis atomic operations are a better fit because they are simpler, faster, and easier to reason about. If the workflow later spans multiple keys or services, then a distributed lock such as Redlock may become worth evaluating.
