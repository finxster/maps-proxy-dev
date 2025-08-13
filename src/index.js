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
    const url = new URL(request.url);
    console.log("Original request:", url.toString());

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

    // 🚨 Extrai e decodifica a URL do path (removendo a primeira barra)
    const targetPath = decodeURIComponent(url.pathname.slice(1));

    if (!targetPath.startsWith("http")) {
      return new Response("URL inválida. Esperado path como: /https://...", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // 🔹 Separar base da query para preservar todos os parâmetros
    const questionMarkIndex = targetPath.indexOf('?');
    let baseUrl = targetPath;
    let queryString = '';

    if (questionMarkIndex >= 0) {
      baseUrl = targetPath.slice(0, questionMarkIndex);
      queryString = targetPath.slice(questionMarkIndex + 1);
    }

    const targetUrl = new URL(baseUrl);
    if (queryString) {
      const params = new URLSearchParams(queryString);
      // remove qualquer key antiga e adiciona a do Worker
      params.delete('key');
      params.set('key', env.GOOGLE_MAPS_API_KEY);
      targetUrl.search = params.toString();
    } else {
      targetUrl.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);
    }

    // ✅ Verifica se o domínio é permitido
    const allowedHost = "googleapis.com";
    if (!targetUrl.hostname.endsWith(allowedHost)) {
      console.log("❌ Host não permitido:", targetUrl.hostname);
      return new Response(`Apenas domínios terminando em "${allowedHost}" são permitidos.`, {
        status: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("🌍 Final Request URL:", targetUrl.toString());

    try {
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const body = await response.text();

      console.log("✅ Response status:", response.status);

      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      console.log("💥 Error fetching from Google Maps:", error);
      return new Response("Internal error", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
