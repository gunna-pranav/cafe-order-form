import OrderFormClient from "./OrderFormClient";

function pickQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }
  return value || "";
}

function parseDraft(rawDraft) {
  if (!rawDraft) {
    return null;
  }

  try {
    const draft = JSON.parse(rawDraft);
    return {
      customerFullName: String(draft?.customerFullName || ""),
      paymentMethod: String(draft?.paymentMethod || ""),
      orderItems: Array.isArray(draft?.orderItems) ? draft.orderItems : []
    };
  } catch {
    return null;
  }
}

export default async function OrderPage({ searchParams }) {
  const params = await searchParams;
  const draft = parseDraft(pickQueryValue(params?.draft));

  return <OrderFormClient initialDraft={draft} />;
}
