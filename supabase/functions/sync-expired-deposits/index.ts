// supabase/functions/sync-expired-deposits/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Define a batch size to stay within limits
const BATCH_SIZE = 200;

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: staleRequests, error: selectError } = await supabaseAdmin
      .from('power_buying_requests')
      .select('id, payment_intent_id')
      .in('status', ['active', 'pending', 'approved'])
      .lt('created_at', sevenDaysAgo)
      .limit(BATCH_SIZE) // <-- Process only a manageable batch at a time

    if (selectError) throw selectError

    if (!staleRequests || staleRequests.length === 0) {
      console.log('No stale requests to sync.')
      return new Response(JSON.stringify({ message: 'No requests to sync.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    console.log(`Found ${staleRequests.length} stale requests to process in this batch.`);

    let syncedCount = 0;

    for (const request of staleRequests) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id);

        if (paymentIntent.status === 'canceled') {
          const { error: updateError } = await supabaseAdmin
            .from('power_buying_requests')
            .update({ status: 'cancelled' })
            .eq('id', request.id)
          
          if (updateError) {
            console.error(`Failed to update request ${request.id}:`, updateError.message);
          } else {
            console.log(`Synced request ${request.id} to 'cancelled'.`);
            syncedCount++;
          }
        }
      } catch (stripeError) {
        console.error(`Error retrieving Payment Intent ${request.payment_intent_id} from Stripe:`, stripeError.message);
      }
    }

    return new Response(JSON.stringify({ message: `Sync complete for this batch. Updated ${syncedCount} requests.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in sync-expired-deposits function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})