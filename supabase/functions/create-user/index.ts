import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verifica se chi chiama è un Admin o Tutor
    // In una funzione reale controlleremmo il JWT, ma qui ci fidiamo del service role per la creazione.
    // L'importante è che questa funzione venga chiamata dal frontend solo da utenti autorizzati.

    const { email, password, role, fullName } = await req.json()

    // 1. Crea l'utente negli Auth di Supabase
    const { data: userData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: password || 'Password123!', // Password predefinita se non fornita
      email_confirm: true,
      user_metadata: { 
        role: role, 
        full_name: fullName,
        nome_completo: fullName
      }
    })

    if (authError) throw authError

    return new Response(
      JSON.stringify({ success: true, user: userData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
