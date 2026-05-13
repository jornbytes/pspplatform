import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const IP_LANG_MAP: Record<string, string> = {
  NL: "nl", BE: "nl", DE: "de", AT: "de", CH: "de",
  GB: "en", US: "en", AU: "en", CA: "en", IE: "en", NZ: "en",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Cloudflare / Supabase edge populate CF-IPCountry; fall back to x-country header
    const country =
      req.headers.get("CF-IPCountry") ??
      req.headers.get("X-Country") ??
      "";

    const locale = IP_LANG_MAP[country.toUpperCase()] ?? "en";

    return new Response(JSON.stringify({ locale, country: country || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ locale: "en", error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
