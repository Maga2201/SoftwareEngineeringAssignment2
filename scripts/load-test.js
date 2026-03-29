const baseUrl = process.env.API_URL || "http://localhost:3000";
const buyers = Number(process.env.BUYERS || 1000);
const quantity = Number(process.env.QUANTITY || 1);
const initialStock = Number(process.env.STOCK || 500);

async function post(path, body) {
  const response = await fetch(baseUrl + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

async function get(path) {
  const response = await fetch(baseUrl + path);
  return response.json();
}

async function main() {
  await post("/inventory/reset", { stock: initialStock });

  const attempts = Array.from({ length: buyers }, () =>
    post("/purchase", { quantity })
  );

  const results = await Promise.all(attempts);
  const accepted = results.filter((result) => result.status === 200).length;
  const rejected = results.filter((result) => result.status === 409).length;
  const inventory = await get("/inventory");

  console.log(
    JSON.stringify(
      {
        buyers,
        quantityPerBuyer: quantity,
        accepted,
        rejected,
        expectedAccepted: Math.floor(initialStock / quantity),
        remaining: inventory.remaining
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
