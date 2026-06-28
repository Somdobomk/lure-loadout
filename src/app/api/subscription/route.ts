import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// ── Dev bypass ────────────────────────────────────────────────────────────
// Add your email(s) to NEXT_PUBLIC_DEV_EMAILS in .env.local / Vercel env vars
// e.g. NEXT_PUBLIC_DEV_EMAILS=you@example.com,other@example.com
const DEV_EMAILS = (process.env.NEXT_PUBLIC_DEV_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ subscribed: false });

  // Use currentUser() — the only reliable way to get email in Clerk v7
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ subscribed: false });

  // Bypass Stripe check for dev accounts — must be before any stripe() call
  if (DEV_EMAILS.includes(email.toLowerCase())) {
    return NextResponse.json({ subscribed: true, customerId: null, devBypass: true });
  }

  try {
    const client = stripe();
    const customers = await client.customers.list({ email, limit: 1 });
    if (!customers.data.length) return NextResponse.json({ subscribed: false });

    const customer = customers.data[0];
    const subscriptions = await client.subscriptions.list({
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
