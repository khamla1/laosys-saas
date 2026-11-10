import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-24.acacia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature found" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Check Idempotency (prevent duplicate processing)
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { id: event.id }
    });

    if (existingEvent) {
      console.log(`Event ${event.id} already processed.`);
      return NextResponse.json({ received: true });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId || session.metadata?.userId;
        const packageId = session.metadata?.packageId;

        if (organizationId && packageId) {
          const pkg = await prisma.package.findUnique({ where: { id: packageId } });
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              packageId: packageId,
              subscriptionStatus: "ACTIVE",
            }
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        
        // Find organization by subscription
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          include: { package: true }
        });

        if (org) {
          // Add package duration days or fallback to 30 days
          const durationDays = org.package ? org.package.durationDays : 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionExpiresAt: expiresAt
            }
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (org) {
          // Grace period: allow 3 days from now
          const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: "PAST_DUE",
              subscriptionExpiresAt: expiresAt
            }
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: "CANCELED",
              stripeSubscriptionId: null,
            }
          });
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Mark event as processed
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
