"use client";

import { useActionState } from "react";
import { claimOwnerAction } from "@/app/actions/auth";
import { bootstrapInitialOwnerAction } from "@/app/actions/bootstrap";
import { Button, Card, Input, Label } from "@/components/ui";

export default function SetupPage() {
  const [state, action, pending] = useActionState(claimOwnerAction, { error: null, message: null });
  const [boot, bootAction, bootPending] = useActionState(bootstrapInitialOwnerAction, { error: null, message: null });
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg space-y-8">
        <div>
          <h1 className="font-serif text-3xl">Workspace setup</h1>
          <p className="mt-2 text-sm text-muted">
            The initial owner is created only from server environment variables. Credentials are never collected on this page.
          </p>
        </div>
        <form action={bootAction} className="space-y-3">
          <p className="text-sm">
            Uses <code>BOOTSTRAP_ADMIN_EMAIL</code> and <code>BOOTSTRAP_ADMIN_PASSWORD</code> from the deployment environment. This operation is one-time and then locked.
          </p>
          {boot?.error ? <p className="text-sm text-danger">{boot.error}</p> : null}
          <Button type="submit" disabled={bootPending}>
            Create initial owner from server env
          </Button>
        </form>
        <form action={action} className="space-y-4 border-t border-line pt-6">
          <p className="text-sm text-muted">
            If you already signed in as the authorised email, you can claim owner using{" "}
            <code>OWNER_BOOTSTRAP_EMAIL</code> or <code>OWNER_BOOTSTRAP_SECRET</code>.
          </p>
          <div>
            <Label>Bootstrap secret</Label>
            <Input name="secret" type="password" placeholder="Leave blank if your email is pre-authorised" />
          </div>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <Button variant="secondary" type="submit" disabled={pending}>
            Claim owner workspace
          </Button>
        </form>
      </Card>
    </div>
  );
}
