// Supabase Edge Function: server-side fetch of a public Rayshift NA profile.
// Deploy this function, then set rayshiftProxyUrl in config.js.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const friendId = (url.searchParams.get("id") || "").replace(/\D/g, "");
  if (!friendId) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  if (friendId.length < 7 || friendId.length > 12) return new Response(JSON.stringify({ error: "Invalid friend id" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  const upstream = `https://rayshift.io/na/${friendId}`;
  try {
    const r = await fetch(upstream, { headers: { "user-agent": "Mozilla/5.0 ChaldeaCommand/1.0" } });
    const text = await r.text();
    return new Response(JSON.stringify({ ok: r.ok, status: r.status, source: upstream, html: text }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
