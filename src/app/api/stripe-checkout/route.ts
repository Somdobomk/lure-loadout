import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripeKey  = process.env.STRIPE_SECRET_KEY;
    const priceId    = process.env.STRIPE_PRICE_ID;
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!stripeKey) return NextResponse.json({ error: "Stripe secret key is not configured. Add STRIPE_SECRET_KEY to your .env.local file." }, { status: 500 });
    if (!priceId)   return NextResponse.json({ error: "Stripe price ID is not configured. Add STRIPE_PRICE_ID to your .env.local file." }, { status: 500 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

    const email = sessionClaims?.email as string | undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?subscribed=true`,
      cancel_url:  `${appUrl}/`,
      metadata: { userId },
      ...(email ? { customer_email: email } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
