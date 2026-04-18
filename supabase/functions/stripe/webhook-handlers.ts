import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Create a Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Handle checkout.session.completed event
export async function handleCheckoutSessionCompleted(session: any) {
  // Get the subscription
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Get the customer
  const customer = await stripe.customers.retrieve(session.customer);
  
  // Get the user ID from the session metadata
  const userId = session.metadata.user_id || customer.metadata.supabase_user_id;
  if (!userId) {
    console.error('No user ID found in session metadata or customer metadata');
    return;
  }
  
  // Get the plan ID from the session metadata or subscription metadata
  const planId = session.metadata.plan_id || subscription.metadata.plan_id;
  if (!planId) {
    console.error('No plan ID found in session metadata or subscription metadata');
    return;
  }
  
  // Get the billing cycle from the session metadata or subscription metadata
  const billingCycle = session.metadata.billing_cycle || subscription.metadata.billing_cycle || 'monthly';
  
  // Get the payment method
  const paymentMethod = await stripe.paymentMethods.retrieve(
    subscription.default_payment_method
  );
  
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
  
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    // Update the existing subscription
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        payment_method_id: subscription.default_payment_method,
        billing_cycle: billingCycle,
        price_id: subscription.items.data[0].price.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscriptions[0].id);
    
    if (error) {
      console.error('Error updating subscription:', error);
    }
  } else {
    // Insert a new subscription
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
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
        price_id: subscription.items.data[0].price.id,
      });
    
    if (error) {
      console.error('Error inserting subscription:', error);
    }
  }
  
  // Insert or update the payment method
  if (paymentMethod && paymentMethod.card) {
    const { data: existingPaymentMethods, error: fetchError } = await supabaseAdmin
      .from('payment_methods')
      .select('id')
      .eq('user_id', userId)
      .eq('stripe_payment_method_id', paymentMethod.id);
    
    if (fetchError) {
      console.error('Error fetching existing payment method:', fetchError);
      return;
    }
    
    const paymentMethodData = {
      user_id: userId,
      stripe_payment_method_id: paymentMethod.id,
      card_brand: paymentMethod.card.brand,
      card_last4: paymentMethod.card.last4,
      card_exp_month: paymentMethod.card.exp_month,
      card_exp_year: paymentMethod.card.exp_year,
      is_default: true,
    };
    
    if (existingPaymentMethods && existingPaymentMethods.length > 0) {
      // Update the existing payment method
      const { error } = await supabaseAdmin
        .from('payment_methods')
        .update({
          ...paymentMethodData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPaymentMethods[0].id);
      
      if (error) {
        console.error('Error updating payment method:', error);
      }
    } else {
      // Insert a new payment method
      const { error } = await supabaseAdmin
        .from('payment_methods')
        .insert(paymentMethodData);
      
      if (error) {
        console.error('Error inserting payment method:', error);
      }
    }
  }
}

// Handle customer.subscription.updated event
export async function handleSubscriptionUpdated(subscription: any) {
  // Get the customer
  const customer = await stripe.customers.retrieve(subscription.customer);
  
  // Get the user ID from the customer metadata
  const userId = customer.metadata.supabase_user_id;
  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }
  
  // Update the subscription in the database
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_id: subscription.default_payment_method,
      price_id: subscription.items.data[0].price.id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) {
    console.error('Error updating subscription:', error);
  }
}

// Handle customer.subscription.deleted event
export async function handleSubscriptionDeleted(subscription: any) {
  // Update the subscription in the database
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) {
    console.error('Error updating subscription:', error);
  }
}
