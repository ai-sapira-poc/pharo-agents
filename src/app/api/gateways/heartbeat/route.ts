import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { gateway_id, agents, usage } = await req.json();

    if (!gateway_id) {
      return NextResponse.json({ error: "gateway_id required" }, { status: 400 });
    }

    // Update gateway last_seen
    await supabase.from("gateways").update({
      status: "online",
      last_seen_at: new Date().toISOString(),
      agent_count: agents?.length || undefined,
    }).eq("id", gateway_id);

    // Update agent data if provided
    if (agents?.length) {
      for (const agent of agents) {
        await supabase.from("gateway_agents").upsert({
          gateway_id,
          agent_id: agent.id,
          name: agent.name || agent.id,
          model: agent.model,
          status: agent.status || "active",
          updated_at: new Date().toISOString(),
        }, { onConflict: "gateway_id,agent_id" });
      }
    }

    // Store usage data if provided
    if (usage?.length) {
      for (const u of usage) {
        await supabase.from("token_usage").insert({
          gateway_id,
          agent_id: u.agent_id,
          model: u.model,
          tokens_in: u.tokens_in || 0,
          tokens_out: u.tokens_out || 0,
          tokens_cache_read: u.tokens_cache_read || 0,
          session_key: u.session_key,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
