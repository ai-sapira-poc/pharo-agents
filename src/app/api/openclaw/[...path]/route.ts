import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.OPENCLAW_API_URL || "http://127.0.0.1:18789";
const API_TOKEN = process.env.OPENCLAW_API_TOKEN || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = `${API_URL}/${path.join("/")}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach OpenClaw gateway" },
      { status: 502 }
    );
  }
}
