/**
 * VISIONGO Cloudflare Worker
 * Handles edge API routes, security headers, and static asset fallback.
 */

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "VISIONGO Web Platform",
          timestamp: new Date().toISOString(),
          edgeRegion: request.cf?.colo || "local",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Contact & Enterprise Inquiry API endpoint
    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          email?: string;
          name?: string;
          company?: string;
          product?: string;
          message?: string;
        };

        if (!body.email || !body.message) {
          return new Response(
            JSON.stringify({ error: "Email and message are required." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Return a structured response confirming receipt
        return new Response(
          JSON.stringify({
            success: true,
            message: "Inquiry received. The VISIONGO engineering team will reach out within 24 hours.",
            referenceId: `VG-${Date.now().toString(36).toUpperCase()}`,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON payload" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: serve static assets via Cloudflare Workers Assets
    const response = await env.ASSETS.fetch(request);

    // Add security and modern web performance headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
