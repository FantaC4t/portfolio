const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const today = new Date().toISOString().slice(0, 10);
    const upstream = `https://wakatime.com/api/v1/users/current/summaries`
      + `?start=${today}&end=${today}&api_key=${env.WAKA_KEY}`;

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
