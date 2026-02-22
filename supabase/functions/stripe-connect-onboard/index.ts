import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email, name')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      // Create a new Express connected account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { supabase_user_id: user.id },
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
    }

    const { return_url, refresh_url } = await req.json().catch(() => ({
      return_url: 'https://gatheru.app/payments',
      refresh_url: 'https://gatheru.app/payments',
    }));

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, accountId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
