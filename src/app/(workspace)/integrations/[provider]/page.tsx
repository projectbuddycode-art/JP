import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { PROVIDER_CATALOG } from "@/lib/integrations/catalog";
import { publicEnv } from "@/lib/public-env";

export const instant = false;

export default async function IntegrationGuidePage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  await requireActiveProfile();
  const doc = PROVIDER_CATALOG.find((item) => item.id === provider);
  if (!doc) notFound();
  const origin = publicEnv().appUrl;
  return (
    <div>
      <PageHeader title={doc.title} description={doc.captures} actions={<Link href="/integrations" className="text-sm text-accent">Back</Link>} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Setup</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {doc.setup.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {doc.webhookPath ? <p className="mt-4 text-sm break-all">Webhook URL: {origin}{doc.webhookPath}</p> : null}
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Requirements</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted">Account</dt><dd>{doc.accountType}</dd></div>
            <div><dt className="text-muted">Developer access</dt><dd>{doc.developerAccess}</dd></div>
            <div><dt className="text-muted">Permissions</dt><dd>{doc.permissions.join(", ") || "None"}</dd></div>
            <div><dt className="text-muted">Credentials</dt><dd>{doc.credentials.join(", ") || "None"}</dd></div>
            <div><dt className="text-muted">Test</dt><dd>{doc.testMethod}</dd></div>
            <div><dt className="text-muted">Limitations</dt><dd>{doc.limitations}</dd></div>
            <div><dt className="text-muted">Recovery</dt><dd>{doc.recovery}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
