import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);

    // POST /admin-auth/setup — create/reset admin password (only if no admin exists)
    if (req.method === "POST" && url.pathname.endsWith("/setup")) {
      const { password } = await req.json();
      if (!password || password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase.from("admin_users").select("id").limit(1).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "Admin already configured." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hash = await sha256(password);
      await supabase.from("admin_users").insert({ password_hash: hash });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /admin-auth/login
    if (req.method === "POST" && url.pathname.endsWith("/login")) {
      const { password } = await req.json();
      if (!password) {
        return new Response(JSON.stringify({ error: "Password required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hash = await sha256(password);
      const { data } = await supabase
        .from("admin_users")
        .select("id")
        .eq("password_hash", hash)
        .maybeSingle();

      if (!data) {
        return new Response(JSON.stringify({ error: "Invalid password." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Issue a simple signed token: base64(payload).signature
      const payload = JSON.stringify({ id: data.id, exp: Date.now() + 8 * 60 * 60 * 1000 });
      const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sig = await sha256(payload + secret);
      const token = btoa(payload) + "." + sig;

      return new Response(JSON.stringify({ token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /admin-auth/verify — verify token validity
    if (req.method === "POST" && url.pathname.endsWith("/verify")) {
      const { token } = await req.json();
      const valid = await verifyToken(token, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      return new Response(JSON.stringify({ valid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, sig] = token.split(".");
    const payload = atob(payloadB64);
    const expectedSig = await (async () => {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload + secret));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    })();
    if (sig !== expectedSig) return false;
    const { exp } = JSON.parse(payload);
    return Date.now() < exp;
  } catch {
    return false;
  }
}
