import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!body.upgradeIntent) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'upgradeIntent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clerkUserId, upgradeIntent } = body;

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'clerkUserId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const picaSecret = Deno.env.get('PICA_SECRET_KEY');
    const picaConnectionKey = Deno.env.get('PICA_CLERK_CONNECTION_KEY');

    if (!picaSecret || !picaConnectionKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing Pica configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const picaUrl = `https://api.picaos.com/v1/passthrough//users/${encodeURIComponent(clerkUserId)}`;

    const picaResp = await fetch(picaUrl, {
      method: 'GET',
      headers: {
        'x-pica-secret': picaSecret,
        'x-pica-connection-key': picaConnectionKey,
        'x-pica-action-id': 'conn_mod_def::GCT_31Q-7fo::pym2V-IETdaZ-7BJwSQTSA',
        'Accept': 'application/json'
      }
    });

    if (!picaResp.ok) {
      const errText = await picaResp.text();
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Failed to retrieve Clerk user', 
          details: errText 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clerkUser = await picaResp.json();

    const email = clerkUser?.email_addresses?.[0]?.email_address || null;
    const fullName = [clerkUser?.first_name || '', clerkUser?.last_name || ''].join(' ').trim() || null;
    const avatarUrl = clerkUser?.profile_image_url || clerkUser?.image_url || null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUpsertUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/users?on_conflict=clerk_user_id`;

    const nowIso = new Date().toISOString();
    const upsertBody = {
      clerk_user_id: clerkUser.id,
      email: email,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: nowIso
    };

    const supResp = await fetch(supabaseUpsertUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(upsertBody)
    });

    if (!supResp.ok) {
      const bodyText = await supResp.text();
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Failed to upsert Supabase user', 
          details: bodyText 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supRows = await supResp.json();
    const supUser = Array.isArray(supRows) ? supRows[0] : supRows;

    return new Response(
      JSON.stringify({
        status: 'ok',
        supabaseUserId: supUser?.id || null,
        clerkUser: clerkUser,
        upgradeIntent: upgradeIntent
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'Unexpected server error', 
        error: String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
