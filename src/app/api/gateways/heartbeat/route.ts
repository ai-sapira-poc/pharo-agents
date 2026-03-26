import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gateway_id, name, machine_host, machine_os, openclaw_version, agents, reported_at } = body;

    if (!gateway_id) {
      return NextResponse.json({ error: "gateway_id required" }, { status: 400 });
    }

    // Update gateway metadata
    await supabase.from("gateways").update({
      status: "online",
      last_seen_at: reported_at || new Date().toISOString(),
      machine_host: machine_host || undefined,
      machine_os: machine_os || undefined,
      openclaw_version: openclaw_version || undefined,
      agent_count: agents?.length || undefined,
    }).eq("id", gateway_id);

    // Update agents with full data
    if (agents?.length) {
      for (const agent of agents) {
        const sessions = agent.sessions || {};
        const skills = agent.skills || [];
        const config = agent.config || {};
        const identity = agent.identity || {};
        const bindings = agent.bindings || [];

        await supabase.from("gateway_agents").upsert({
          gateway_id,
          agent_id: agent.id,
          name: agent.name || agent.id,
          model: agent.model || "unknown",
          workspace: agent.workspace || null,
          purpose: agent.purpose || null,
          status: agent.status || "active",
          config: JSON.stringify({
            skills,
            bindings,
            tools: config.tools || {},
            subagents: config.subagents || {},
            heartbeat: config.heartbeat || {},
            identity,
            sessions: {
              count: sessions.count || 0,
              total_tokens: sessions.total_tokens || 0,
              total_cost: sessions.total_cost || 0,
              models: sessions.models || [],
            },
          }),
          updated_at: reported_at || new Date().toISOString(),
        }, { onConflict: "gateway_id,agent_id" });
      }
    }

    return NextResponse.json({ ok: true, agents_updated: agents?.length || 0 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
