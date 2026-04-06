import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tunnel_url, api_token, machine_host, machine_os, openclaw_version, agents } = body;

    if (!name || !api_token) {
      return NextResponse.json({ error: "name and api_token are required" }, { status: 400 });
    }

    // Check if gateway with this name already exists
    const { data: existing } = await supabase
      .from("gateways")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    let gateway;

    if (existing) {
      // Update existing gateway
      const { data: updated, error: updateErr } = await supabase
        .from("gateways")
        .update({
          tunnel_url: tunnel_url || null,
          api_token,
          machine_host: machine_host || null,
          machine_os: machine_os || null,
          openclaw_version: openclaw_version || null,
          agent_count: agents?.length || 0,
          status: "online",
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      gateway = updated;
    } else {
      // Insert new gateway
      const { data: created, error: insertErr } = await supabase
        .from("gateways")
        .insert({
          name,
          tunnel_url: tunnel_url || null,
          api_token,
          machine_host: machine_host || null,
          machine_os: machine_os || null,
          openclaw_version: openclaw_version || null,
          agent_count: agents?.length || 0,
          status: "online",
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      gateway = created;
    }

    // Register/update agents
    if (agents?.length && gateway) {
      for (const agent of agents) {
        await supabase.from("gateway_agents").upsert({
          gateway_id: gateway.id,
          agent_id: agent.id,
          name: agent.name || agent.id,
          model: agent.model || "unknown",
          workspace: agent.workspace || null,
          purpose: agent.purpose || null,
          status: agent.status || "active",
          config: agent.config || {},
          updated_at: new Date().toISOString(),
        }, { onConflict: "gateway_id,agent_id" });
      }
    }

    return NextResponse.json({
      ok: true,
      gateway_id: gateway.id,
      message: `Gateway '${name}' ${existing ? "updated" : "registered"} with ${agents?.length || 0} agents`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
