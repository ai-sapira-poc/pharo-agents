import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gatewayId: string }> }
) {
  const { gatewayId } = await params;

  // Lookup gateway
  const { data: gw } = await supabase
    .from("gateways")
    .select("tunnel_url, api_token")
    .eq("id", gatewayId)
    .single();

  if (!gw?.tunnel_url || !gw?.api_token) {
    return NextResponse.json({ error: "Gateway not connected or missing tunnel" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${gw.tunnel_url}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gw.api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach gateway" }, { status: 502 });
  }
}
