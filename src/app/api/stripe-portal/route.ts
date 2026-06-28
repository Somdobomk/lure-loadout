import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe, APP_URL } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: APP_URL,
  });

  return NextResponse.json({ url: session.url });
}
