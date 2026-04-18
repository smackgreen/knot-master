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

// Create a Supabase client
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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request path
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle different API endpoints
    switch (path) {
      case 'create-checkout-session':
        return await handleCreateCheckoutSession(req, user);
      case 'create-portal-session':
        return await handleCreatePortalSession(req, user);
      case 'webhook':
        return await handleWebhook(req);
      case 'cancel-subscription':
        return await handleCancelSubscription(req, user);
      case 'reactivate-subscription':
        return await handleReactivateSubscription(req, user);
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

// Handle creating a checkout session
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
    // Create a new customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;
  }

  // Get the price ID based on plan and billing cycle
  const selectedPriceId = priceId || STRIPE_PRICE_IDS[planId][billingCycle];

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: selectedPriceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${Deno.env.get('APP_URL')}/account/subscription?success=true`,
    cancel_url: `${Deno.env.get('APP_URL')}/account/subscription?canceled=true`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      billing_cycle: billingCycle,
    },
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle creating a customer portal session
async function handleCreatePortalSession(req: Request, user: any) {
  // Get the customer ID
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

  // Create the portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${Deno.env.get('APP_URL')}/account/subscription`,
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle canceling a subscription
async function handleCancelSubscription(req: Request, user: any) {
  const { subscriptionId } = await req.json();

  // Get the subscription
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

  // Cancel the subscription at period end
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  // Update the subscription in the database
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

// Handle reactivating a subscription
async function handleReactivateSubscription(req: Request, user: any) {
  const { subscriptionId } = await req.json();

  // Get the subscription
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

  // Reactivate the subscription
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  // Update the subscription in the database
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

// Handle Stripe webhooks
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
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
