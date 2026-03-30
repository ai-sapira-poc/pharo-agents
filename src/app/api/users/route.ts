import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSupabaseServer, getUser } from "@/lib/supabase-server";

// List users (admins only)
export async function GET() {
  const user = await getUser();
  if (!user?.profile?.role || !["super_admin"].includes(user.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profiles } = await supabase.from("user_profiles").select("*").order("created_at");
  const { data: access } = await supabase.from("workspace_access").select("*, gateways(name)").order("created_at");

  return NextResponse.json({ profiles: profiles || [], access: access || [] });
}

// Invite user
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.profile?.role || !["super_admin"].includes(user.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, name, role, gateway_id, workspace_role } = await req.json();

  // Create user in Supabase Auth
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: password || undefined,
    email_confirm: true,
  });

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // Update profile
  if (newUser.user) {
    await supabase.from("user_profiles").upsert({
      id: newUser.user.id,
      email,
      name: name || email.split("@")[0],
      role: role || "user",
    });

    // Grant workspace access if specified
    if (gateway_id) {
      await supabase.from("workspace_access").insert({
        user_id: newUser.user.id,
        gateway_id,
        role: workspace_role || "viewer",
        invited_by: user.id,
      });
    }
  }

  return NextResponse.json({ ok: true, user_id: newUser.user?.id });
}

// Delete user
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user?.profile?.role || !["super_admin"].includes(user.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (user_id === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await supabase.auth.admin.deleteUser(user_id);
  return NextResponse.json({ ok: true });
}
