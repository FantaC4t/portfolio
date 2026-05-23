const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const { pathname } = new URL(request.url);

    // /langs  →  last-7-days language breakdown with real hours
    if (pathname === '/langs') {
      const upstream =
        `https://wakatime.com/api/v1/users/current/stats/last_7_days` +
        `?api_key=${env.WAKA_KEY}`;

      const res  = await fetch(upstream);
      const json = await res.json();

      // Return just the languages array so the client doesn't get the whole blob
      const langs = json?.data?.languages ?? [];

      return new Response(JSON.stringify({ data: langs }), {
        status: res.status,
        headers: {
          ...CORS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5-min cache
        },
      });
    }

    // default  →  today's coding summaries (existing behaviour)
    const today    = new Date().toISOString().slice(0, 10);
    const upstream = `https://wakatime.com/api/v1/users/current/summaries` +
      `?start=${today}&end=${today}&api_key=${env.WAKA_KEY}`;

    const res  = await fetch(upstream);
    const body = await res.text();

    return new Response(body, {
      status: res.status,
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
      },
    });
  },
};
