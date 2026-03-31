// @ts-nocheck
import { getUser } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { UserActions } from "@/components/user-actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const gwId = params.gw;
  const isSuperAdmin = user.profile?.role === "super_admin";

  // Check access: super_admin or workspace admin
  if (!isSuperAdmin) {
    if (!gwId) redirect("/");
    const { data: access } = await supabase
      .from("workspace_access")
      .select("role")
      .eq("user_id", user.id)
      .eq("gateway_id", gwId)
      .single();
    if (access?.role !== "admin") redirect("/");
  }

  // Get users (exclude super admins)
  let profiles = [];
  let access = [];

  if (isSuperAdmin) {
    const { data: p } = await supabase
      .from("user_profiles").select("*").neq("role", "super_admin").order("created_at");
    profiles = p || [];
    const { data: a } = await supabase.from("workspace_access").select("*, gateways(name)");
    access = a || [];
  } else if (gwId) {
    const { data: a } = await supabase
      .from("workspace_access")
      .select("*, user_profiles(*), gateways(name)")
      .eq("gateway_id", gwId);
    access = (a || []).filter((x) => x.user_profiles?.role !== "super_admin");
    profiles = access.map((x) => x.user_profiles).filter(Boolean);
  }

  const { data: gateways } = await supabase.from("gateways").select("id, name");

  const roleColors = {
    super_admin: "var(--danger)",
    admin: "var(--warning)",
    user: "var(--text-muted)",
  };

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Users</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
          {profiles.length} user{profiles.length !== 1 ? "s" : ""}
        </p>
      </div>

      <UserActions 
        gateways={gateways || []} 
        isSuperAdmin={isSuperAdmin}
        defaultGatewayId={gwId || undefined}
      />

      {profiles.length === 0 ? (
        <div className="border rounded-lg p-16 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No users yet. Add one above.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b flex"
            style={{ color: "var(--text-muted)", background: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
            <span className="w-2/5">User</span>
            <span className="w-1/5">Role</span>
            <span className="w-2/5">Workspaces</span>
          </div>
          {profiles.map((p, i) => {
            const userAccess = access.filter((a) => a.user_id === p.id);
            return (
              <div key={p.id} className="px-5 py-3 flex items-center text-[12px]"
                style={{ borderBottom: i < profiles.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                <div className="w-2/5">
                  <p className="font-semibold">{p.name || p.email}</p>
                  <p className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{p.email}</p>
                </div>
                <div className="w-1/5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                    style={{ color: roleColors[p.role] || "var(--text-muted)", background: "var(--bg-raised)" }}>
                    {p.role}
                  </span>
                </div>
                <div className="w-2/5">
                  {userAccess.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {userAccess.map((a) => (
                        <span key={a.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                          {a.gateways?.name || "?"} ({a.role})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>No workspace</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
