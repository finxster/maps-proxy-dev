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
    const url = new URL(request.url)
    const targetPath = url.searchParams.get("url")
    
    if (!targetPath) {
      return new Response("Missing `url` query parameter.", { status: 400 })
    }

    const targetUrl = new URL(targetPath)
    
    // Anexa a API Key automaticamente
    targetUrl.searchParams.set("key", env.GOOGLE_MAPS_API_KEY)

    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const body = await response.text()
    
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*", // Libera o CORS
      },
    })
  },
}

