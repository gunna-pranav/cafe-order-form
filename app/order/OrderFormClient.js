"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PAYMENT_OPTIONS = ["Venmo", "Zelle", "Cash"];
const DRINK_OPTIONS = [
  "blackberry latte with lavender whip",
  "dark chocolate mocha with orange creamsicle whip",
  "london fog matcha with blueberry whip",
  "strawberry matcha with cherry blossom whip"
];
const MILK_OPTIONS = ["Oat Milk", "Whole Milk"];
const DEFAULT_MILK_TYPE = "Whole Milk";

const DRINK_PRICE = 4;

function createEmptyMilkSelections() {
  return DRINK_OPTIONS.reduce((accumulator, drinkType) => {
    accumulator[drinkType] = [];
    return accumulator;
  }, {});
}

function buildMilkSelectionsFromItems(orderItems) {
  const initialSelections = createEmptyMilkSelections();
  for (const item of Array.isArray(orderItems) ? orderItems : []) {
    const drinkType = String(item?.drinkType || "");
    const milkType = String(item?.milkType || "");
    if (DRINK_OPTIONS.includes(drinkType) && MILK_OPTIONS.includes(milkType)) {
      initialSelections[drinkType].push(milkType);
    }
  }
  return initialSelections;
}

export default function OrderFormClient({ initialDraft }) {
  const router = useRouter();
  const [customerFullName, setCustomerFullName] = useState(
    initialDraft?.customerFullName || ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_OPTIONS.includes(initialDraft?.paymentMethod)
      ? initialDraft.paymentMethod
      : PAYMENT_OPTIONS[0]
  );
  const [milkSelectionsByDrink, setMilkSelectionsByDrink] = useState(() =>
    buildMilkSelectionsFromItems(initialDraft?.orderItems)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const totalDrinks = DRINK_OPTIONS.reduce(
    (count, drinkType) => count + milkSelectionsByDrink[drinkType].length,
    0
  );

  function updateDrinkCount(drinkType, delta) {
    setMilkSelectionsByDrink((current) => {
      const currentSelections = current[drinkType];
      const nextCount = Math.max(0, currentSelections.length + delta);

      let nextSelections = currentSelections;
      if (nextCount > currentSelections.length) {
        const additions = Array(nextCount - currentSelections.length).fill(
          DEFAULT_MILK_TYPE
        );
        nextSelections = [...currentSelections, ...additions];
      }
      if (nextCount < currentSelections.length) {
        nextSelections = currentSelections.slice(0, nextCount);
      }

      return { ...current, [drinkType]: nextSelections };
    });
  }

  function updateMilkSelection(drinkType, drinkIndex, milkType) {
    setMilkSelectionsByDrink((current) => {
      const updatedSelections = [...current[drinkType]];
      updatedSelections[drinkIndex] = milkType;
      return { ...current, [drinkType]: updatedSelections };
    });
  }

  function buildOrderItems() {
    return DRINK_OPTIONS.flatMap((drinkType) =>
      milkSelectionsByDrink[drinkType].map((milkType) => ({
        drinkType,
        milkType
      }))
    );
  }

  function resetForm() {
    setCustomerFullName("");
    setPaymentMethod(PAYMENT_OPTIONS[0]);
    setMilkSelectionsByDrink(createEmptyMilkSelections());
    setStatus({ type: "", message: "" });
    setIsSubmitting(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    const trimmedCustomerName = customerFullName.trim();
    if (!trimmedCustomerName) {
      setStatus({ type: "error", message: "Customer Full Name is required." });
      setIsSubmitting(false);
      return;
    }

    const orderItems = buildOrderItems();
    if (orderItems.length === 0) {
      setStatus({
        type: "error",
        message: "Add at least one drink before submitting."
      });
      setIsSubmitting(false);
      return;
    }

    const draft = {
      customerFullName: trimmedCustomerName,
      paymentMethod,
      orderItems
    };
    const query = new URLSearchParams({
      draft: JSON.stringify(draft)
    });
    router.push(`/order/confirmation?${query.toString()}`);
  }

  return (
    <main className="page">
      <section className="card">
        <div className="form-heading-row">
          <div>
            <p className="eyebrow">Cafe 4147</p>
            <h1>Order Form</h1>
          </div>
          <button
            type="button"
            className="reset-order-btn"
            onClick={resetForm}
          >
            Reset
          </button>
        </div>
        <p className="subtext">all drinks are 16oz and iced.</p>

        <form className="grid" onSubmit={handleSubmit}>
          <div className="field full">
            <label htmlFor="customerFullName">Customer Full Name</label>
            <input
              id="customerFullName"
              name="customerFullName"
              required
              placeholder="Example: Jordan Smith"
              value={customerFullName}
              onChange={(event) => setCustomerFullName(event.target.value)}
            />
          </div>

          <div className="field full">
            <label>Drink Type</label>
            <div className="drink-list">
              {DRINK_OPTIONS.map((drinkType) => {
                const drinkSelections = milkSelectionsByDrink[drinkType];
                return (
                  <div key={drinkType} className="drink-card">
                    <div className="drink-main-row">
                      <p className="drink-name">{drinkType}</p>
                      <div className="counter" aria-label={`${drinkType} quantity`}>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => updateDrinkCount(drinkType, -1)}
                          aria-label={`Decrease ${drinkType}`}
                        >
                          -
                        </button>
                        <span className="counter-value">{drinkSelections.length}</span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => updateDrinkCount(drinkType, 1)}
                          aria-label={`Increase ${drinkType}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="drink-details">
                      {drinkSelections.map((milkType, index) => (
                        <div
                          key={`${drinkType}-${index}`}
                          className="drink-detail-row slide-down"
                        >
                          <label
                            htmlFor={`milk-${drinkType}-${index}`}
                            className="drink-detail-label"
                          >
                            {drinkType} - Drink #{index + 1} Milk Type
                          </label>
                          <select
                            id={`milk-${drinkType}-${index}`}
                            value={milkType}
                            onChange={(event) =>
                              updateMilkSelection(
                                drinkType,
                                index,
                                event.target.value
                              )
                            }
                          >
                            {MILK_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="field full">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field full order-summary">
            <p>
              Total Drinks: <strong>{totalDrinks}</strong>
            </p>
            <p>
              Estimated Total: <strong>${(totalDrinks * DRINK_PRICE).toFixed(2)}</strong>
            </p>
          </div>

          <div className="field full">
            <button type="submit" disabled={isSubmitting || totalDrinks === 0}>
              {isSubmitting ? "Continuing..." : "Review Order"}
            </button>
          </div>
        </form>

        {status.message ? (
          <p className={`status ${status.type}`}>{status.message}</p>
        ) : null}

        <Link href="/" className="home-link">
          Back Home
        </Link>
      </section>
    </main>
  );
}
