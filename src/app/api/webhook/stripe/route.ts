import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log("Stripe webhook:", event.type);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
