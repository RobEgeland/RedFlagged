import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe secret key is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Stripe is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey);

    // Parse request body
    const body = await request.json();
    const { reportId, amount = 799, email } = body; // amount in cents ($7.99 = 799 cents)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium Vehicle Report",
              description: "Premium vehicle analysis with detailed insights and risk indicators",
            },
            unit_amount: amount, // $7.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment
      allow_promotion_codes: true, // Enable promo code field on checkout page
      success_url: `${request.nextUrl.origin}/report?session_id={CHECKOUT_SESSION_ID}&report_id=${reportId || "unknown"}`,
      cancel_url: `${request.nextUrl.origin}/report?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        reportId: reportId || "unknown",
      },
    });

    // Log session details for debugging
    console.log("[Checkout] Session created:", {
      sessionId: session.id,
      url: session.url,
      allowPromotionCodes: true, // Confirming it's set
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

