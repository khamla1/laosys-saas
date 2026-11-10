import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-24.acacia" as any, 
  // Stripe api version typing workaround since it changes often
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    const body = await request.json();
    const { packageId } = body;

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package selected" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: {
        userId,
        packageId,
      }
    };

    // Create Stripe Checkout Session
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      customer_email: (user as any).stripeCustomerId ? undefined : userEmail || undefined,
      customer: (user as any).stripeCustomerId || undefined,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: pkg.name,
            },
            unit_amount: pkg.price * 100, // Stripe expects smallest currency unit
            recurring: {
              interval: "day",
              interval_count: pkg.durationDays
            }
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: subscriptionData,
      success_url: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      metadata: {
        userId,
        packageId,
      }
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
