const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await request.json();

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return Response.json(
        { available: false },
        { headers: corsHeaders, status: 400 },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { available: false },
        { headers: corsHeaders, status: 500 },
      );
    }

    const queryUrl = new URL('/rest/v1/profiles', supabaseUrl);
    queryUrl.searchParams.set('email', `eq.${email.trim().toLowerCase()}`);
    queryUrl.searchParams.set('select', 'id');
    queryUrl.searchParams.set('limit', '1');

    const response = await fetch(queryUrl, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      return Response.json(
        { available: false },
        { headers: corsHeaders, status: 500 },
      );
    }

    const rows = (await response.json()) as Array<{ id: string }>;

    return Response.json(
      { available: rows.length === 0 },
      { headers: corsHeaders },
    );
  } catch {
    return Response.json(
      { available: false },
      { headers: corsHeaders, status: 400 },
    );
  }
});
