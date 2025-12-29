import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const eventType = payload.type;

    console.log('Received Clerk webhook:', eventType);

    switch (eventType) {
      case 'user.created': {
        const user = payload.data;
        await supabase
          .from('users')
          .upsert({
            clerk_user_id: user.id,
            email: user.email_addresses?.[0]?.email_address || null,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
            avatar_url: user.profile_image_url || null,
            created_at: new Date(user.created_at).toISOString(),
            updated_at: new Date(user.updated_at).toISOString()
          }, {
            onConflict: 'clerk_user_id'
          });
        break;
      }

      case 'user.updated': {
        const user = payload.data;
        await supabase
          .from('users')
          .update({
            email: user.email_addresses?.[0]?.email_address || null,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
            avatar_url: user.profile_image_url || null,
            updated_at: new Date(user.updated_at).toISOString()
          })
          .eq('clerk_user_id', user.id);
        break;
      }

      case 'user.deleted': {
        const user = payload.data;
        // Soft delete by updating a deleted_at timestamp or hard delete
        await supabase
          .from('users')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', user.id);
        break;
      }

      case 'session.created': {
        // Log session creation for analytics if needed
        console.log('Session created:', payload.data.id);
        break;
      }

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
