import { checkConnection, createClerkUser, getClerkUser } from "@shared/clerk-utils.ts";
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify Clerk connection first
    const connectionCheck = await checkConnection();
    if (connectionCheck.status >= 400) {
      return new Response(
        JSON.stringify({ error: 'Clerk connection verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in Clerk
    const clerkPayload = {
      external_id: null,
      first_name: firstName || null,
      last_name: lastName || null,
      email_address: [email],
      phone_number: [],
      web3_wallet: [],
      username: null,
      password: password,
      password_digest: null,
      password_hasher: null,
      skip_password_checks: false,
      skip_password_requirement: false,
      totp_secret: null,
      backup_codes: [],
      public_metadata: {},
      private_metadata: {},
      unsafe_metadata: {},
      delete_self_enabled: true,
      legal_accepted_at: null,
      skip_legal_checks: true,
      create_organization_enabled: true,
      create_organizations_limit: null,
      created_at: new Date().toISOString()
    };

    const clerkResponse = await createClerkUser(clerkPayload);

    if (clerkResponse.status >= 400) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Clerk user',
          details: clerkResponse.body 
        }),
        { status: clerkResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clerkUser = clerkResponse.body;

    // Sync user to Supabase
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        clerk_user_id: clerkUser.id,
        email: email,
        full_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
        avatar_url: clerkUser.profile_image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_user_id'
      });

    if (dbError) {
      console.error('Database sync error:', dbError);
      // Don't fail the request if DB sync fails - user is created in Clerk
    }

    return new Response(
      JSON.stringify({
        success: true,
        clerkUserId: clerkUser.id,
        email: clerkUser.email_addresses?.[0]?.email_address || email,
        message: 'Please check your email to verify your account'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
