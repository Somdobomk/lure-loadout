import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ subscribed: false });

  const email = sessionClaims?.email as string | undefined;
  if (!email) return NextResponse.json({ subscribed: false });

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) return NextResponse.json({ subscribed: false });

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    return NextResponse.json({
      subscribed: subscriptions.data.length > 0,
      customerId: customer.id,
    });
  } catch {
    return NextResponse.json({ subscribed: false });
  }
}
