# Promo Code Setup Guide for Product Hunt Launch

This guide explains how to create and manage promo codes in Stripe Dashboard for your Product Hunt launch.

## Overview

Promo codes allow users to enter discount codes directly on the Stripe checkout page. The promo code field will automatically appear when users go through checkout. Stripe handles all validation, discount application, and tracking.

## Step 1: Create a Coupon

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Coupons** (or go directly to https://dashboard.stripe.com/coupons)
3. Click **+ Create coupon**

### For 100% Off (Free Report)

1. **Name**: Enter a descriptive name (e.g., "Product Hunt Launch - 100% Off")
2. **Type**: Select **Percentage**
3. **Percent off**: Enter `100`
4. **Duration**: Select **Once** (one-time use per customer) or **Forever** (unlimited uses per customer)
5. **Applies to**: **IMPORTANT** - Select **"All products"** (not "Specific products")
   - This is required because your checkout uses dynamic pricing
   - If you select "Specific products", the code won't work with your checkout
6. **Redemption limits** (optional):
   - **Max redemptions**: Set a total limit (e.g., 100 uses total)
   - **Redeem by**: Set an expiration date
7. Click **Create coupon**

### For Other Discount Types

- **Fixed amount off**: Select "Fixed amount" and enter the discount amount (e.g., $2.00)
- **Percentage off**: Select "Percentage" and enter the percentage (e.g., 50 for 50% off)

## Step 2: Create a Promo Code

1. After creating the coupon, you'll see a **Create promo code** button, or navigate to **Products** → **Promo codes**
2. Click **+ Create promo code**
3. **Coupon**: Select the coupon you just created
4. **Code**: Enter your promo code (e.g., `PRODUCTHUNT2024`, `LAUNCH100`, `PH100`)
   - Codes are case-insensitive
   - Use uppercase letters and numbers for clarity
   - Avoid special characters or spaces
5. **Active**: Make sure it's checked (enabled)
6. **Customer eligibility** (optional):
   - **All customers**: Anyone can use it
   - **Specific customers**: Limit to certain customer emails
7. **Expiration** (optional):
   - **Expires on**: Set a specific date
   - **First time transaction only**: Only for new customers
8. **Usage limits** (optional):
   - **Max times this code can be used**: Total redemption limit
   - **Max times per customer**: Limit per customer
9. Click **Create promo code**

## Step 3: Test Your Promo Code

### In Test Mode

1. Make sure you're in **Test mode** (toggle in top right of Stripe Dashboard)
2. Create a test coupon and promo code (same steps as above)
3. Go to your app and initiate a checkout for a premium report
4. On the Stripe checkout page, you should see a **"Add promotion code"** link
5. Click it and enter your test promo code
6. Verify the discount is applied correctly
7. Complete the checkout to ensure everything works

### In Live Mode

1. Switch to **Live mode** in Stripe Dashboard
2. Create your production coupon and promo code
3. Test with a real payment (you can refund it if needed)

## Step 4: Share Your Promo Code

Once your promo code is created and active, share it with your Product Hunt audience:

- Include it in your Product Hunt launch post
- Share on social media
- Add to your email campaigns
- Mention it in your launch day announcements

## Managing Promo Codes

### View Usage

1. Go to **Products** → **Promo codes** in Stripe Dashboard
2. Click on a promo code to see:
   - Total redemptions
   - Revenue impact
   - Customer list who used it

### Deactivate a Code

1. Go to **Products** → **Promo codes**
2. Click on the promo code
3. Click **Deactivate** to stop new redemptions
4. Existing redemptions remain valid

### Create Multiple Codes

You can create multiple promo codes for different campaigns:

- `PRODUCTHUNT2024` - For Product Hunt launch
- `TWITTER50` - For Twitter campaign (50% off)
- `EARLYBIRD` - For early adopters
- `LAUNCH100` - For launch day (100% off)

Each code can link to the same coupon or different coupons.

## Best Practices

1. **Use descriptive codes**: Make codes easy to remember and type (e.g., `PRODUCTHUNT2024` not `PH2024XK9`)
2. **Set expiration dates**: Prevent codes from being used indefinitely
3. **Set usage limits**: Control how many times a code can be used
4. **Test first**: Always test in test mode before going live
5. **Monitor usage**: Check redemption stats regularly during your launch
6. **Have backup codes**: Create multiple codes in case one gets shared too widely

## Troubleshooting

### Promo code field doesn't appear on checkout

**Important**: The promo code field in Stripe Checkout is a **link**, not always visible by default. Look for:
- A link that says **"Add promotion code"** or **"Have a promo code?"**
- It's usually located below the payment amount, above the payment button
- You need to **click the link** to expand the promo code input field

**Other things to check:**

1. **Test Mode vs Live Mode**: 
   - If you're testing, make sure your promo code was created in **Test mode** (toggle in top right of Stripe Dashboard)
   - Promo codes created in Live mode won't appear in Test mode checkout sessions
   - The promo code ID you got (`promo_1Slg9kJjyw94X0cFZvBipYze`) - check which mode it was created in

2. **Redeploy your app**: 
   - If you just added `allow_promotion_codes: true`, you may need to redeploy for changes to take effect
   - Check your deployment logs to ensure the new code is live

3. **Verify the code is active**:
   - Go to Stripe Dashboard → Products → Promo codes
   - Find your promo code and verify it shows as "Active" (green status)
   - Check if it has expired or reached usage limits

4. **Verify `allow_promotion_codes: true` is set**:
   - The code is already in `src/app/api/checkout/route.ts`
   - Make sure you're using the `/api/checkout` endpoint (not the Supabase function)

5. **Clear browser cache**: 
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Try in an incognito/private window

### Code not applying discount / "This code is valid, but doesn't apply to items in your order"

**This error means the coupon has restrictions that don't match your checkout items.**

**Solution**: Your checkout uses dynamic pricing (`price_data`), so the coupon must be configured to work with **any product**:

1. Go to Stripe Dashboard → **Products** → **Coupons**
2. Click on the coupon linked to your promo code
3. Check the **"Applies to"** section:
   - **Must be set to "All products"** (not "Specific products")
   - If it's set to "Specific products", change it to "All products"
4. Save the changes
5. Try the promo code again

**Other things to check:**
- Check the code is active in Stripe Dashboard
- Verify the code hasn't expired
- Check if usage limits have been reached
- Ensure the code matches exactly (case-insensitive)
- Check if there's a minimum amount requirement that your order doesn't meet

### $0 payment not completing

- Stripe handles $0 payments automatically - no card required
- The checkout session will complete successfully
- Your existing report saving logic will work correctly

## Example: Product Hunt Launch Setup

1. **Create coupon**:
   - Name: "Product Hunt Launch - Free Report"
   - Type: Percentage, 100% off
   - Duration: Once (one-time use per customer)
   - Max redemptions: 500
   - Redeem by: 7 days from launch

2. **Create promo code**:
   - Code: `PRODUCTHUNT2024`
   - Coupon: Link to the coupon above
   - Max times this code can be used: 500
   - Expires on: Launch date + 7 days

3. **Share**: Include `PRODUCTHUNT2024` in your Product Hunt post

## Additional Resources

- [Stripe Coupons Documentation](https://stripe.com/docs/billing/subscriptions/discounts/coupons)
- [Stripe Promo Codes Documentation](https://stripe.com/docs/billing/subscriptions/discounts/coupons)
- [Stripe Checkout Promo Codes](https://stripe.com/docs/payments/checkout/promotional-codes)

