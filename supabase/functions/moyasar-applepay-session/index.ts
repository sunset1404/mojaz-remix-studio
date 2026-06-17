import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DISPLAY_NAME = 'إقراء';
const DOMAIN = 'mojaz-remix-studio.lovable.app';

const applePayCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-moyasar-form-version`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: applePayCorsHeaders });
  }

  try {
    let validationUrl: string | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      validationUrl = body?.validation_url || body?.validationURL || null;
    } else {
      const text = await req.text();
      try {
        const params = new URLSearchParams(text);
        validationUrl = params.get('validation_url') || params.get('validationURL');
      } catch { /* ignore */ }
      if (!validationUrl) {
        try {
          const j = JSON.parse(text);
          validationUrl = j?.validation_url || j?.validationURL || null;
        } catch { /* ignore */ }
      }
    }

    const publishableKey =
      Deno.env.get('MOYASSAR_PUBLISHABLE_KEY') ||
      Deno.env.get('MOYASAR_PUBLISHABLE_KEY');

    if (!validationUrl || !publishableKey) {
      console.error('Missing fields', { hasUrl: !!validationUrl, hasKey: !!publishableKey });
      return new Response(
        JSON.stringify({ error: 'missing_applepay_session_fields' }),
        { status: 400, headers: { ...applePayCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('ApplePay initiate:', { validationUrl, domain: DOMAIN });

    const res = await fetch('https://api.moyasar.com/v1/applepay/initiate', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        validation_url: validationUrl,
        display_name: DISPLAY_NAME,
        domain_name: DOMAIN,
        publishable_api_key: publishableKey,
      }),
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log('Moyasar response status:', res.status);

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...applePayCorsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('ApplePay session error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'unknown' }), {
      status: 500,
      headers: { ...applePayCorsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
