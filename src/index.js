/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);
    console.log("Original request:", requestUrl.toString());

    // 🔄 Suporte a preflight request (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // 🔹 Extrai a URL completa do path + query
    const pathWithQuery = request.url.split(requestUrl.origin)[1].slice(1); // remove a primeira '/'
    
    let targetUrl;
    try {
      targetUrl = new URL(pathWithQuery);
    } catch (err) {
      return new Response("URL inválida. Esperado path como: /https://...", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // ✅ Verifica se o domínio é permitido
    if (!targetUrl.hostname.endsWith('googleapis.com')) {
      return new Response(`Apenas domínios terminando em "googleapis.com" são permitidos.`, {
        status: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 🔑 Substitui a key mantendo os outros parâmetros
    targetUrl.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);

    console.log("🌍 Final Request URL:", targetUrl.toString());

    try {
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
      });

      const body = await response.text();

      console.log("✅ Response status:", response.status);

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error("💥 Error fetching from Google Maps:", error);
      return new Response("Internal error", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
