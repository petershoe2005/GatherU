import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (_req) => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use the pg REST endpoint with service role to run DDL
  const res = await fetch(`${url}/rest/v1/profiles?select=stripe_customer_id&limit=0`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });

  if (res.ok) {
    return new Response(JSON.stringify({ message: 'Column already exists' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Column doesn't exist — add it via Postgres directly using pg connection
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!;
  const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
  const client = new Client(dbUrl);
  await client.connect();
  await client.queryObject('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text');
  await client.end();

  return new Response(JSON.stringify({ message: 'Column added successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
