import { inviteUserAction, setUserStatusAction, updateUserRoleAction } from "@/app/actions/team";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/rbac";
import { formatIst } from "@/lib/reports/timezone";

export const instant = false;

export default async function TeamPage() {
  const { supabase } = await requirePermission("users.manage");
  const { data: members } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, workspace_role, status, last_active_at, must_change_password")
    .order("email");
  const { data: invites } = await supabase.from("team_invites").select("*").order("created_at", { ascending: false });
  const { data: logins } = await supabase
    .from("login_events")
    .select("id, email, success, created_at, ip_address")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <PageHeader title="Partner & user management" description="Every person has their own login. Roles and permissions are enforced on the server and in the database." />
      <Card>
        <h2 className="font-serif text-xl">Invite a user</h2>
        <form action={inviteUserAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Role</Label>
            <select name="workspace_role" className="w-full rounded-md border border-line px-3 py-2 text-sm" defaultValue="partner">
              {ROLES.filter((role) => role !== "owner").map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Send invite</Button>
          </div>
        </form>
      </Card>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-soft text-muted">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((member) => (
              <tr key={member.id} className="border-t border-line">
                <td className="px-3 py-2">
                  {member.full_name || "—"}
                  <div className="text-xs text-muted">{member.email}</div>
                </td>
                <td className="px-3 py-2">{member.workspace_role || member.role}</td>
                <td className="px-3 py-2">{member.status}{member.must_change_password ? " · change password" : ""}</td>
                <td className="px-3 py-2">{formatIst(member.last_active_at)}</td>
                <td className="px-3 py-2">
                  <form action={updateUserRoleAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="user_id" value={member.id} />
                    <select name="workspace_role" defaultValue={member.workspace_role || "sales"} className="rounded-md border border-line px-2 py-1">
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <Button variant="secondary" type="submit">Update role</Button>
                  </form>
                  <form action={setUserStatusAction} className="mt-2">
                    <input type="hidden" name="user_id" value={member.id} />
                    <input type="hidden" name="status" value={member.status === "disabled" ? "active" : "disabled"} />
                    <Button variant={member.status === "disabled" ? "primary" : "danger"} type="submit">
                      {member.status === "disabled" ? "Activate" : "Disable"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Pending invites</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(invites ?? []).length ? (invites ?? []).map((invite) => (
              <li key={invite.id}>{invite.email} · {invite.workspace_role ?? "member"}</li>
            )) : <li className="text-muted">No outstanding invites.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Login history</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(logins ?? []).length ? (logins ?? []).map((event) => (
              <li key={event.id}>
                {event.email} · {event.success ? "success" : "failed"} · {formatIst(event.created_at)}
              </li>
            )) : <li className="text-muted">No login events recorded yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
