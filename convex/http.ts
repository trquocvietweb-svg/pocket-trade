import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// HTTP endpoint for getting settings (used for SEO metadata)
http.route({
  path: "/settings",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const settings = await ctx.runQuery(api.settings.get);
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  }),
});

// HTTP endpoint for setting trader offline (used by sendBeacon)
http.route({
  path: "/setOffline",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const traderId = body.id as Id<"traders">;
      
      if (traderId) {
        await ctx.runMutation(api.traders.setOffline, { id: traderId });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
