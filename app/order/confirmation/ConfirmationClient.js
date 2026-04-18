"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const DRINK_PRICE = 4;
const BARISTA_BY_PAYMENT_METHOD = {
  Venmo: "Pranav (@gunna_pranav12)",
  Zelle: "Reisha (248-687-0504)",
  Cash: "Cafe 4147"
};

function sanitizeDraft(initialDraft) {
  const customerFullName = String(initialDraft?.customerFullName || "").trim();
  const paymentMethod = String(initialDraft?.paymentMethod || "");
  const orderItems = Array.isArray(initialDraft?.orderItems)
    ? initialDraft.orderItems
        .map((item) => ({
          drinkType: String(item?.drinkType || ""),
          milkType: String(item?.milkType || "")
        }))
        .filter((item) => item.drinkType && item.milkType)
    : [];

  return { customerFullName, paymentMethod, orderItems };
}

export default function ConfirmationClient({ initialDraft }) {
  const router = useRouter();
  const draft = useMemo(() => sanitizeDraft(initialDraft), [initialDraft]);
  const totalDrinks = draft.orderItems.length;
  const totalAmount = (totalDrinks * DRINK_PRICE).toFixed(2);
  const baristaName = BARISTA_BY_PAYMENT_METHOD[draft.paymentMethod] || "Cafe 4147";

  const [submitState, setSubmitState] = useState("review");
  const [submitError, setSubmitError] = useState("");

  function handleEditOrder() {
    const query = new URLSearchParams({
      draft: JSON.stringify(draft)
    });
    router.push(`/order?${query.toString()}`);
  }

  function handlePlaceAnotherOrder() {
    router.push("/order");
  }

  async function handleConfirmOrder() {
    if (submitState === "submitting" || submitState === "success") {
      return;
    }

    if (!draft.customerFullName || draft.orderItems.length === 0) {
      setSubmitError("Order data is incomplete. Please edit and try again.");
      return;
    }

    setSubmitState("submitting");
    setSubmitError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detailedError = payload.details
          ? `${payload.error || "Could not submit order."} ${payload.details}`
          : payload.error || "Could not submit order.";
        throw new Error(detailedError);
      }

      setSubmitState("success");
    } catch (error) {
      setSubmitState("review");
      setSubmitError(error.message || "Could not submit order.");
    }
  }

  return (
    <main className="page">
      <section className="card confirmation-card">
        <p className="eyebrow">Cafe 4147</p>
        <h1>review order</h1>

        <div className="confirmation-panel">
          <p className="confirmation-customer">
            Customer Name: <strong>{draft.customerFullName || "N/A"}</strong>
          </p>

          <p className="confirmation-message">
            {submitState === "success"
              ? (
                  <>
                    Order submitted! Send <strong>{baristaName}</strong>{" "}
                    <strong>${totalAmount}</strong> through <strong>{draft.paymentMethod}</strong>.
                  </>
                )
              : (
                  <>
                    review this order. once order is confirmed, then send{" "}
                    <strong>{baristaName}</strong> <strong>${totalAmount}</strong> through{" "}
                    <strong>{draft.paymentMethod}</strong>.
                  </>
                )}
          </p>

          <div className="order-breakdown">
            <p className="order-breakdown-title">Order Summary ({totalDrinks} drinks)</p>
            {draft.orderItems.length > 0 ? (
              <ul className="order-breakdown-list">
                {draft.orderItems.map((item, index) => (
                  <li
                    key={`${item.drinkType}-${item.milkType}-${index}`}
                    className="order-breakdown-item"
                  >
                    <p className="order-breakdown-line">
                      <strong>Drink #{index + 1}</strong>: {item.drinkType}
                    </p>
                    <p className="order-breakdown-line">Milk Type: {item.milkType}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="confirmation-detail">No itemized details were available.</p>
            )}
          </div>
        </div>

        {submitError ? <p className="status error">{submitError}</p> : null}

        {submitState === "success" ? (
          <button
            type="button"
            className="confirmation-action-btn"
            onClick={handlePlaceAnotherOrder}
          >
            Place New Order
          </button>
        ) : (
          <div className="confirmation-action-group">
            <button
              type="button"
              className="confirmation-action-btn"
              onClick={handleEditOrder}
              disabled={submitState === "submitting"}
            >
              Edit Order
            </button>
            <button
              type="button"
              className="confirmation-action-btn"
              onClick={handleConfirmOrder}
              disabled={submitState === "submitting"}
            >
              {submitState === "submitting" ? "Confirming..." : "Confirm Order"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
