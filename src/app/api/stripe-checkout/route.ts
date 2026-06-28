import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe, PRICE_ID, APP_URL } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const appUrl = APP_URL();
    const priceId = PRICE_ID();

    const client = stripe();
    const email = sessionClaims?.email as string | undefined;

    const session = await client.checkout.sessions.create({
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
