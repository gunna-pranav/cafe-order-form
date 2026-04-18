import ConfirmationClient from "./ConfirmationClient";

function pickQueryValue(value, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] || fallback;
  }
  return value || fallback;
}

function parseDraft(rawDraft) {
  if (!rawDraft) {
    return {
      customerFullName: "",
      paymentMethod: "",
      orderItems: []
    };
  }

  try {
    const parsed = JSON.parse(rawDraft);
    return {
      customerFullName: String(parsed?.customerFullName || ""),
      paymentMethod: String(parsed?.paymentMethod || ""),
      orderItems: Array.isArray(parsed?.orderItems) ? parsed.orderItems : []
    };
  } catch {
    return {
      customerFullName: "",
      paymentMethod: "",
      orderItems: []
    };
  }
}

export default async function OrderConfirmationPage({ searchParams }) {
  const params = await searchParams;
  const draft = parseDraft(pickQueryValue(params?.draft));

  return <ConfirmationClient initialDraft={draft} />;
}
