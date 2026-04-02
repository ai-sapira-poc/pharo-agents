import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Generate recovery link via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://agents.pharo-ai.com/auth/update-password" },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const actionLink = data?.properties?.action_link;
    if (!actionLink) return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_fgQwPk1g_4UWw194fyoKGY2Nq4vzdtbhX",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pharo Agents <noreply@sapira.email>",
        to: email,
        subject: "Reset your Pharo Agents password",
        html: '<div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;"><h1 style="font-size: 28px; font-weight: 300; font-style: italic; margin-bottom: 24px;">Pharo</h1><p style="font-size: 14px; color: #404040; line-height: 1.6; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p><a href="' + actionLink + '" style="display: inline-block; background: #0a0a0a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Reset password</a><p style="font-size: 12px; color: #737373; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p></div>',
      }),
    });

    if (!resendRes.ok) return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
