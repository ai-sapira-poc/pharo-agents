import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* ignore in server components */ }
        },
      },
    }
  );
}

export async function getUser() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  // Get profile with role
  const { data: profile } = await sb.from("user_profiles").select("*").eq("id", user.id).single();
  return { ...user, profile };
}

export async function getUserWorkspaces(userId: string) {
  const sb = await createSupabaseServer();
  const { data: profile } = await sb.from("user_profiles").select("role").eq("id", userId).single();

  if (profile?.role === "super_admin") {
    // Super admins see all gateways
    const { data } = await sb.from("gateways").select("*").order("registered_at");
    return data || [];
  }

  // Regular users see only assigned workspaces
  const { data } = await sb
    .from("workspace_access")
    .select("gateway_id, role, gateways(*)")
    .eq("user_id", userId);

  return (data || []).map((wa: Record<string, unknown>) => wa.gateways);
}
