// @ts-nocheck
import { getUser } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { Users, Shield, UserPlus, Trash2 } from "lucide-react";
import { UserActions } from "@/components/user-actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/auth/login");
  if (user.profile?.role !== "super_admin") redirect("/");

  const params = await searchParams;
  const gwId = params.gw;

  // Get all users
  const { data: profiles } = await supabase.from("user_profiles").select("*").order("created_at");
  
  // Get workspace access
  const { data: access } = await supabase.from("workspace_access").select("*, gateways(name)");
  
  // Get gateways for the invite form
  const { data: gateways } = await supabase.from("gateways").select("id, name");

  const roleColors: Record<string, string> = {
    super_admin: "var(--danger)",
    admin: "var(--warning)",
    user: "var(--text-muted)",
  };

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[36px] leading-tight">Users</h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
            Manage access to the platform
          </p>
        </div>
      </div>

      <UserActions gateways={gateways || []} />

      {/* User list */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b flex"
          style={{ color: "var(--text-muted)", background: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
          <span className="w-1/3">User</span>
          <span className="w-1/6">Role</span>
          <span className="w-1/3">Workspaces</span>
          <span className="w-1/6 text-right">Actions</span>
        </div>
        {(profiles || []).map((p, i) => {
          const userAccess = (access || []).filter((a) => a.user_id === p.id);
          return (
            <div key={p.id} className="px-5 py-3 flex items-center text-[12px]"
              style={{ borderBottom: i < (profiles?.length || 0) - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <div className="w-1/3">
                <p className="font-semibold">{p.name || p.email}</p>
                <p className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{p.email}</p>
              </div>
              <div className="w-1/6">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                  style={{ color: roleColors[p.role] || "var(--text-muted)", background: "var(--bg-raised)" }}>
                  {p.role}
                </span>
              </div>
              <div className="w-1/3">
                {p.role === "super_admin" ? (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>All workspaces</span>
                ) : userAccess.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {userAccess.map((a) => (
                      <span key={a.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                        {a.gateways?.name || "?"} ({a.role})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>No access</span>
                )}
              </div>
              <div className="w-1/6 text-right">
                {p.id !== user.id && (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
