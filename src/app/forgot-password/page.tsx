"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button, Card, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(resetPasswordAction, { error: null, message: null });
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="font-serif text-3xl">Reset password</h1>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          {state?.message ? <p className="text-sm text-success">{state.message}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            Send recovery email
          </Button>
        </form>
        <Link href="/login" className="mt-4 inline-block text-sm text-accent">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
