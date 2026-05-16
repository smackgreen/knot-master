import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Stripe product and price IDs
const STRIPE_PRICE_IDS = {
  starter: {
    monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || '',
    yearly: Deno.env.get('STRIPE_PRICE_STARTER_YEARLY') || '',
  },
  pro: {
    monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || '',
    yearly: Deno.env.get('STRIPE_PRICE_PRO_YEARLY') || '',
  },
};

// Create a Supabase admin client (service role key bypasses RLS)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Webhook endpoint does NOT require auth (Stripe signs the payload)
    if (path === 'webhook') {
      return await handleWebhook(req);
    }

    // All other endpoints require a valid Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different API endpoints
    switch (path) {
      case 'create-checkout-session':
        return await handleCreateCheckoutSession(req, user);
      case 'create-portal-session':
        return await handleCreatePortalSession(req, user);
      case 'cancel-subscription':
        return await handleCancelSubscription(req, user);
      case 'reactivate-subscription':
        return await handleReactivateSubscription(req, user);
      case 'billing-history':
        return await handleBillingHistory(req, user);
      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─────────────────────────────────────────────────────────
// Checkout session
// ─────────────────────────────────────────────────────────
async function handleCreateCheckoutSession(req: Request, user: any) {
  const { priceId, planId, billingCycle } = await req.json();

  // Get or create a Stripe customer
  let customerId = '';
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (subscriptions && subscriptions.length > 0 && subscriptions[0].stripe_customer_id) {
    customerId = subscriptions[0].stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const selectedPriceId = priceId || STRIPE_PRICE_IDS[planId]?.[billingCycle];

  if (!selectedPriceId) {
    return new Response(
      JSON.stringify({ error: 'Invalid plan or billing cycle' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Build checkout session parameters
  const sessionParams: any = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: selectedPriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${Deno.env.get('APP_URL')}/account/subscription?success=true`,
    cancel_url: `${Deno.env.get('APP_URL')}/account/subscription?canceled=true`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      billing_cycle: billingCycle,
    },
  };

  // Add trial period for new customers (7-day trial)
  if (!subscriptions || subscriptions.length === 0) {
    sessionParams.subscription_data = {
      trial_period_days: 7,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return new Response(
    JSON.stringify({ url: session.url }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Customer portal session
// ─────────────────────────────────────────────────────────
async function handleCreatePortalSession(req: Request, user: any) {
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!subscriptions || subscriptions.length === 0 || !subscriptions[0].stripe_customer_id) {
    return new Response(
      JSON.stringify({ error: 'No subscription found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const customerId = subscriptions[0].stripe_customer_id;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${Deno.env.get('APP_URL')}/account/subscription`,
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Cancel subscription
// ─────────────────────────────────────────────────────────
async function handleCancelSubscription(req: Request, user: any) {
  const { subscriptionId } = await req.json();

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscriptionId)
    .limit(1);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No subscription found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Cancel at period end so the user keeps access until the end of the billing period
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  await supabaseAdmin
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Reactivate subscription
// ─────────────────────────────────────────────────────────
async function handleReactivateSubscription(req: Request, user: any) {
  const { subscriptionId } = await req.json();

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscriptionId)
    .limit(1);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No subscription found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  await supabaseAdmin
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Billing history
// ─────────────────────────────────────────────────────────
async function handleBillingHistory(req: Request, user: any) {
  // Get the Stripe customer ID
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!subscriptions || subscriptions.length === 0 || !subscriptions[0].stripe_customer_id) {
    return new Response(
      JSON.stringify({ invoices: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const customerId = subscriptions[0].stripe_customer_id;

  // Fetch invoices from Stripe
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 24,
  });

  const formattedInvoices = invoices.data.map((inv) => ({
    id: inv.id,
    stripeInvoiceId: inv.id,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    description: inv.lines.data[0]?.description || `Invoice ${inv.number}`,
    invoicePdf: inv.invoice_pdf,
    hostedInvoiceUrl: inv.hosted_invoice_url,
    createdAt: new Date(inv.created * 1000).toISOString(),
    periodStart: inv.period_start
      ? new Date(inv.period_start * 1000).toISOString()
      : null,
    periodEnd: inv.period_end
      ? new Date(inv.period_end * 1000).toISOString()
      : null,
  }));

  return new Response(
    JSON.stringify({ invoices: formattedInvoices }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Webhook handler
// ─────────────────────────────────────────────────────────
async function handleWebhook(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature header' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ─────────────────────────────────────────────────────────
// Webhook: checkout.session.completed
// ─────────────────────────────────────────────────────────
async function handleCheckoutSessionCompleted(session: any) {
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const customer = await stripe.customers.retrieve(session.customer);

  const userId = session.metadata?.user_id || customer.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No user ID found in session or customer metadata');
    return;
  }

  const planId = session.metadata?.plan_id || subscription.metadata?.plan_id;
  if (!planId) {
    console.error('No plan ID found in session or subscription metadata');
    return;
  }

  const billingCycle = session.metadata?.billing_cycle || subscription.metadata?.billing_cycle || 'monthly';

  // Get payment method details
  let paymentMethodData: any = null;
  if (subscription.default_payment_method) {
    try {
      paymentMethodData = await stripe.paymentMethods.retrieve(subscription.default_payment_method);
    } catch (e) {
      console.error('Error retrieving payment method:', e);
    }
  }

  // Insert or update the subscription in the database
  const { data: existingSubscriptions, error: fetchError } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id);

  if (fetchError) {
    console.error('Error fetching existing subscription:', fetchError);
    return;
  }

  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_customer_id: session.customer,
    stripe_subscription_id: subscription.id,
    payment_method_id: subscription.default_payment_method,
    billing_cycle: billingCycle,
    price_id: subscription.items.data[0]?.price?.id,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };

  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ ...subscriptionData, updated_at: new Date().toISOString() })
      .eq('id', existingSubscriptions[0].id);

    if (error) console.error('Error updating subscription:', error);
  } else {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData);

    if (error) console.error('Error inserting subscription:', error);
  }

  // Insert or update the payment method
  if (paymentMethodData?.card) {
    await upsertPaymentMethod(userId, paymentMethodData);
  }
}

// ─────────────────────────────────────────────────────────
// Webhook: customer.subscription.updated
// ─────────────────────────────────────────────────────────
async function handleSubscriptionUpdated(subscription: any) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Determine plan_id from price_id
  let planId = 'free';
  const priceId = subscription.items.data[0]?.price?.id || '';
  if (priceId === STRIPE_PRICE_IDS.starter.monthly || priceId === STRIPE_PRICE_IDS.starter.yearly) {
    planId = 'starter';
  } else if (priceId === STRIPE_PRICE_IDS.pro.monthly || priceId === STRIPE_PRICE_IDS.pro.yearly) {
    planId = 'pro';
  }

  // Try to get plan_id from subscription metadata as fallback
  if (planId === 'free' && subscription.metadata?.plan_id) {
    planId = subscription.metadata.plan_id;
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_id: subscription.default_payment_method,
      price_id: priceId,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  // Update payment method if changed
  if (subscription.default_payment_method) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(subscription.default_payment_method);
      if (paymentMethod.card) {
        await upsertPaymentMethod(userId, paymentMethod);
      }
    } catch (e) {
      console.error('Error updating payment method:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────
// Webhook: customer.subscription.deleted
// ─────────────────────────────────────────────────────────
async function handleSubscriptionDeleted(subscription: any) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error deleting subscription:', error);
  }
}

// ─────────────────────────────────────────────────────────
// Webhook: invoice.paid
// ─────────────────────────────────────────────────────────
async function handleInvoicePaid(invoice: any) {
  // Get the customer
  const customer = await stripe.customers.retrieve(invoice.customer);
  const userId = customer.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata for invoice.paid');
    return;
  }

  // If the subscription was past_due, mark it as active again
  if (invoice.subscription) {
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('stripe_subscription_id', invoice.subscription)
      .limit(1);

    if (subs && subs.length > 0 && subs[0].status === 'past_due') {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subs[0].id);

      if (error) {
        console.error('Error reactivating subscription after payment:', error);
      }
    }
  }

  console.log(`Invoice ${invoice.id} paid for user ${userId}`);
}

// ─────────────────────────────────────────────────────────
// Webhook: invoice.payment_failed
// ─────────────────────────────────────────────────────────
async function handleInvoicePaymentFailed(invoice: any) {
  if (!invoice.subscription) return;

  // Mark the subscription as past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription);

  if (error) {
    console.error('Error marking subscription as past_due:', error);
  }

  console.log(`Payment failed for subscription ${invoice.subscription}`);
}

// ─────────────────────────────────────────────────────────
// Webhook: customer.subscription.trial_will_end
// ─────────────────────────────────────────────────────────
async function handleTrialWillEnd(subscription: any) {
  // Just log for now — the frontend checks trial_end date to show warnings
  console.log(`Trial will end soon for subscription ${subscription.id}`);
}

// ─────────────────────────────────────────────────────────
// Helper: Upsert payment method
// ─────────────────────────────────────────────────────────
async function upsertPaymentMethod(userId: string, paymentMethod: any) {
  const pmData = {
    user_id: userId,
    stripe_payment_method_id: paymentMethod.id,
    card_brand: paymentMethod.card.brand,
    card_last4: paymentMethod.card.last4,
    card_exp_month: paymentMethod.card.exp_month,
    card_exp_year: paymentMethod.card.exp_year,
    is_default: true,
  };

  const { data: existing } = await supabaseAdmin
    .from('payment_methods')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_payment_method_id', paymentMethod.id);

  if (existing && existing.length > 0) {
    await supabaseAdmin
      .from('payment_methods')
      .update({ ...pmData, updated_at: new Date().toISOString() })
      .eq('id', existing[0].id);
  } else {
    // Set all other payment methods as non-default
    await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    await supabaseAdmin
      .from('payment_methods')
      .insert(pmData);
  }
}
