import { NextResponse } from "next/server";

const PAYMENT_METHODS = new Set(["Venmo", "Zelle", "Cash"]);
const DRINK_TYPES = new Set([
  "blackberry latte with lavender whip",
  "dark chocolate mocha with orange creamsicle whip",
  "london fog matcha with blueberry whip",
  "strawberry matcha with cherry blossom whip"
]);
const MILK_TYPES = new Set(["Oat Milk", "Whole Milk"]);

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function createAirtableRecords(url, pat, records) {
  const createdRecordIds = [];
  const chunkSize = 10;

  for (let start = 0; start < records.length; start += chunkSize) {
    const payload = {
      records: records.slice(start, start + chunkSize),
      typecast: true
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let details = "Unknown Airtable error";
      try {
        const errorJson = await response.json();
        details = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        details = await response.text();
      }
      throw new Error(details);
    }

    const data = await response.json();
    const chunkRecordIds = (data.records || [])
      .map((record) => record.id)
      .filter(Boolean);
    createdRecordIds.push(...chunkRecordIds);
  }

  return createdRecordIds;
}

export async function POST(request) {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE;

  if (!pat || !baseId || !table) {
    return NextResponse.json(
      {
        error:
          "Missing Airtable config. Set AIRTABLE_PAT, AIRTABLE_BASE_ID, and AIRTABLE_TABLE."
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const customerFullName = String(body.customerFullName || "").trim();
  const paymentMethod = String(body.paymentMethod || "");
  const orderItems = Array.isArray(body.orderItems) ? body.orderItems : [];

  if (!customerFullName) {
    return badRequest("Customer Full Name is required.");
  }
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return badRequest("Invalid Payment Method.");
  }
  if (orderItems.length === 0) {
    return badRequest("At least one drink is required.");
  }

  for (const item of orderItems) {
    const drinkType = String(item?.drinkType || "");
    const milkType = String(item?.milkType || "");

    if (!DRINK_TYPES.has(drinkType)) {
      return badRequest("Invalid Drink Type.");
    }
    if (!MILK_TYPES.has(milkType)) {
      return badRequest("Invalid Milk Type.");
    }
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    table
  )}`;
  const records = orderItems.map((item, index) => ({
    fields: {
      "Customer Name and Drink Number": `${customerFullName} - Drink #${
        index + 1
      }`,
      "Payment Method": paymentMethod,
      "Fulfilled?": false,
      "Drink Type": String(item.drinkType),
      "Milk Type": String(item.milkType)
    }
  }));

  let recordIds;
  try {
    recordIds = await createAirtableRecords(url, pat, records);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Airtable rejected the write.",
        details: error.message || "Unknown Airtable error"
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    recordIds,
    totalDrinks: orderItems.length,
    paymentMethod
  });
}
