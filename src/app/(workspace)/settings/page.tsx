import { inviteMemberAction, resetDemoDataAction } from "@/app/actions/auth";
import { changePasswordAction } from "@/app/actions/team";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { KPI_DEFINITIONS } from "@/lib/kpi";
import { REPORT_DEFINITIONS } from "@/lib/reports/intelligence";
import { profileRole } from "@/lib/auth/permissions";

export const instant = false;

export default async function SettingsPage() {
  const { supabase, profile, demo } = await requireActiveProfile();
  const { data: settings } = await supabase.from("workspace_settings").select("*").maybeSingle();
  const { data: members } = await supabase.from("profiles").select("email, role, status, full_name");
  const owner = profileRole(profile) === "owner";
  return (
    <div>
      <PageHeader title="Settings" description="Workspace, team, and metric definitions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Workspace</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-muted">Business</dt><dd>{settings?.business_name}</dd></div>
            <div><dt className="text-muted">Timezone</dt><dd>{settings?.timezone}</dd></div>
            <div><dt className="text-muted">Currency</dt><dd>{settings?.default_currency}</dd></div>
            <div><dt className="text-muted">Demo mode</dt><dd>{settings?.demo_mode ? "On — seed data is labelled" : "Off"}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Team</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(members ?? []).map((member) => (
              <li key={member.email}>{member.full_name} · {member.email} · {member.role} · {member.status}</li>
            ))}
          </ul>
          {owner ? (
            <form action={inviteMemberAction} className="mt-4 space-y-2">
              <Label>Invite member email</Label>
              <Input name="email" type="email" required />
              <Button type="submit">Invite</Button>
            </form>
          ) : null}
          <p className="mt-3 text-sm"><a className="text-accent" href="/team">Open full team management</a></p>
        </Card>
        {demo ? (
          <Card>
            <h2 className="font-serif text-xl">Reset demo data</h2>
            <p className="mt-2 text-sm text-muted">Restores the synthetic JP demonstration records in memory. This does not touch any production database.</p>
            <form action={resetDemoDataAction} className="mt-4">
              <Button type="submit" variant="secondary">Reset demo data</Button>
            </form>
          </Card>
        ) : (
        <Card>
          <h2 className="font-serif text-xl">Change password</h2>
          {profile.must_change_password ? (
            <p className="mt-2 text-sm text-warm">This is a temporary password. Change it before continuing with partner work.</p>
          ) : null}
          <form action={changePasswordAction} className="mt-4 space-y-2">
            <Label>New password</Label>
            <Input name="password" type="password" minLength={10} required />
            <Button type="submit">Update password</Button>
          </form>
        </Card>
        )}
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">KPI definitions</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {Object.entries({ ...KPI_DEFINITIONS, ...REPORT_DEFINITIONS }).map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium">{key}</dt>
              <dd className="text-muted">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
