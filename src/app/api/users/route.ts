import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.profile?.role;
  const gwParam = req.nextUrl.searchParams.get("gw");

  if (role === "super_admin") {
    // Super admins see all non-super_admin users
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .neq("role", "super_admin")
      .order("created_at");
    const { data: access } = await supabase
      .from("workspace_access")
      .select("*, gateways(name)")
      .order("created_at");
    return NextResponse.json({ profiles: profiles || [], access: access || [] });
  }

  // Workspace admins see users in their workspaces
  if (gwParam) {
    const { data: myAccess } = await supabase
      .from("workspace_access")
      .select("role")
      .eq("user_id", user.id)
      .eq("gateway_id", gwParam)
      .single();

    if (myAccess?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: access } = await supabase
      .from("workspace_access")
      .select("*, user_profiles(*), gateways(name)")
      .eq("gateway_id", gwParam);

    // Filter out super admins
    const filtered = (access || []).filter(
      (a: Record<string, unknown>) => (a.user_profiles as Record<string, unknown>)?.role !== "super_admin"
    );

    const profiles = filtered.map((a: Record<string, unknown>) => a.user_profiles);
    return NextResponse.json({ profiles, access: filtered });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = user.profile?.role;
  const body = await req.json();
  const { email, password, name, role, gateway_id, workspace_role, magic_link } = body;

  // Super admins can do anything; workspace admins can only add to their workspace
  if (userRole !== "super_admin") {
    if (!gateway_id) return NextResponse.json({ error: "Workspace required" }, { status: 400 });

    const { data: myAccess } = await supabase
      .from("workspace_access")
      .select("role")
      .eq("user_id", user.id)
      .eq("gateway_id", gateway_id)
      .single();

    if (myAccess?.role !== "admin") {
      return NextResponse.json({ error: "Only workspace admins can invite users" }, { status: 403 });
    }
  }

  if (magic_link) {
    // Send magic link invitation via Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: "https://agents.pharo-ai.com/" },
    });

    if (error) {
      // User might not exist yet — create first, then send magic link
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: name || email.split("@")[0] },
      });

      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

      // Update profile
      await supabase.from("user_profiles").upsert({
        id: newUser.user!.id,
        email,
        name: name || email.split("@")[0],
        role: role || "user",
      });

      // Grant workspace access
      if (gateway_id) {
        await supabase.from("workspace_access").upsert({
          user_id: newUser.user!.id,
          gateway_id,
          role: workspace_role || "viewer",
          invited_by: user.id,
        }, { onConflict: "user_id,gateway_id" });
      }

      // Send magic link
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: "https://agents.pharo-ai.com/" },
      });

      return NextResponse.json({ ok: true, method: "magic_link", user_id: newUser.user?.id });
    }

    return NextResponse.json({ ok: true, method: "magic_link" });
  }

  // Create with password
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: password || undefined,
    email_confirm: true,
    user_metadata: { name: name || email.split("@")[0] },
  });

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

  if (newUser.user) {
    await supabase.from("user_profiles").upsert({
      id: newUser.user.id,
      email,
      name: name || email.split("@")[0],
      role: (userRole === "super_admin" && role) ? role : "user",
    });

    const targetGw = gateway_id || (userRole !== "super_admin" ? body.default_gateway_id : null);
    if (targetGw) {
      await supabase.from("workspace_access").upsert({
        user_id: newUser.user.id,
        gateway_id: targetGw,
        role: workspace_role || "viewer",
        invited_by: user.id,
      }, { onConflict: "user_id,gateway_id" });
    }
  }

  return NextResponse.json({ ok: true, method: "password", user_id: newUser.user?.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user?.profile?.role || user.profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (user_id === user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  // Don't allow deleting other super admins via API
  const { data: target } = await supabase.from("user_profiles").select("role").eq("id", user_id).single();
  if (target?.role === "super_admin") return NextResponse.json({ error: "Cannot delete super admins" }, { status: 400 });

  await supabase.auth.admin.deleteUser(user_id);
  return NextResponse.json({ ok: true });
}
