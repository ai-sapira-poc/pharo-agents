import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN_HANSOLO;
const JEREMIE_SLACK_ID = "U08SMBT6PJP";
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

async function sendSlackDM(text: string) {
  if (!SLACK_BOT_TOKEN) {
    console.log("No SLACK_BOT_TOKEN_HANSOLO — skipping DM:", text);
    return;
  }
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: "Bearer " + SLACK_BOT_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: JEREMIE_SLACK_ID, text, mrkdwn: true }),
  });
}

async function getLatestOpenClawVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/openclaw/latest");
    if (!res.ok) return null;
    const data = await res.json() as { version?: string };
    return data.version || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret (auto-set by Vercel for cron routes)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const { data: gateways } = await supabase
      .from("gateways")
      .select("id, name, status, last_seen_at, openclaw_version");

    if (!gateways?.length) {
      return NextResponse.json({ ok: true, checked: 0 });
    }

    const latestVersion = await getLatestOpenClawVersion();
    const alerts: string[] = [];

    for (const gw of gateways) {
      const lastSeen = gw.last_seen_at ? new Date(gw.last_seen_at).getTime() : 0;
      const isStale = (now - lastSeen) > OFFLINE_THRESHOLD_MS;

      // --- Gateway went offline (status was online, now stale) ---
      if (isStale && gw.status === "online") {
        await supabase.from("gateways").update({ status: "offline" }).eq("id", gw.id);
        const minutesAgo = Math.round((now - lastSeen) / 60000);
        alerts.push(`:red_circle: *${gw.name || gw.id}* is offline (last seen ${minutesAgo}m ago)`);
      }

      // --- OpenClaw update available ---
      if (latestVersion && gw.openclaw_version) {
        const current = gw.openclaw_version.replace(/[^0-9.]/g, "");
        const latest = latestVersion.replace(/[^0-9.]/g, "");
        if (current && latest && current !== latest) {
          // Only alert once per version: check monitor_alerts table
          const { data: existing } = await supabase
            .from("monitor_alerts")
            .select("id")
            .eq("gateway_id", gw.id)
            .eq("alert_type", "version")
            .eq("alert_key", latestVersion)
            .limit(1);

          if (!existing?.length) {
            await supabase.from("monitor_alerts").insert({
              gateway_id: gw.id,
              alert_type: "version",
              alert_key: latestVersion,
              message: "Update available: " + gw.openclaw_version + " -> " + latestVersion,
            });
            alerts.push(`:arrow_up: *${gw.name || gw.id}* is on OpenClaw \`${gw.openclaw_version}\` — update available: \`${latestVersion}\``);
          }
        }
      }
    }

    if (alerts.length > 0) {
      await sendSlackDM(":satellite: *Pharo Agents Monitor*\n\n" + alerts.join("\n"));
    }

    return NextResponse.json({ ok: true, checked: gateways.length, alerts: alerts.length });
  } catch (err) {
    console.error("Monitor error:", err);
    return NextResponse.json({ error: "Monitor failed" }, { status: 500 });
  }
}
