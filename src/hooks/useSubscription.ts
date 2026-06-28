"use client";

import { useEffect, useState } from "react";

interface SubscriptionState {
  subscribed: boolean;
  customerId: string | null;
  loading: boolean;
  checkoutError: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false, customerId: null, loading: true, checkoutError: null,
  });

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.ok ? r.json() : { subscribed: false })
      .then((data) => setState((s) => ({ ...s, subscribed: data.subscribed ?? false, customerId: data.customerId ?? null, loading: false })))
      .catch(() => setState((s) => ({ ...s, subscribed: false, customerId: null, loading: false })));
  }, []);

  const startCheckout = async () => {
    setState((s) => ({ ...s, checkoutError: null }));
    try {
      const res = await fetch("/api/stripe-checkout", { method: "POST" });
      const text = await res.text();

      // Guard against empty body
      if (!text.trim()) {
        setState((s) => ({ ...s, checkoutError: "Server returned an empty response. Check your Stripe environment variables." }));
        return;
      }

      const data = JSON.parse(text);

      if (data.error) {
        setState((s) => ({ ...s, checkoutError: data.error }));
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setState((s) => ({ ...s, checkoutError: "No checkout URL returned from Stripe." }));
      }
    } catch (err) {
      setState((s) => ({ ...s, checkoutError: "Failed to start checkout. Check your network and try again." }));
      console.error("Checkout error:", err);
    }
  };

  const openPortal = async () => {
    if (!state.customerId) return;
    try {
      const res = await fetch("/api/stripe-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: state.customerId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  const clearCheckoutError = () => setState((s) => ({ ...s, checkoutError: null }));

  return { ...state, startCheckout, openPortal, clearCheckoutError };
}
