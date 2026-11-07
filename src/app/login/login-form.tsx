"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { Button, Card, Input, Label } from "@/components/ui";

export function LoginForm({ demoEnabled }: { demoEnabled: boolean }) {
  const [signInState, signIn, signInPending] = useActionState(signInAction, { error: null, message: null });
  const [signUpState, signUp, signUpPending] = useActionState(signUpAction, { error: null, message: null });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1b2430] lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=60)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-serif text-4xl">Northridge</p>
          <p className="mt-3 max-w-md text-sm text-white/80">
            A private operating system for Spiti, Manali, Ladakh, and Himalayan travel enquiries.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <h1 className="font-serif text-3xl">Sign in</h1>
          {demoEnabled ? (
            <p className="mt-1 text-sm text-muted">
              JP client demonstration. Use the username and password issued privately. This session never writes to a production database.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Sign in with your workspace email.</p>
          )}
          <form action={signIn} className="mt-6 space-y-4">
            <div>
              <Label>{demoEnabled ? "Username" : "Email"}</Label>
              <Input
                name={demoEnabled ? "username" : "email"}
                type={demoEnabled ? "text" : "email"}
                required
                autoComplete={demoEnabled ? "username" : "email"}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" required autoComplete="current-password" />
            </div>
            {signInState?.error ? <p className="text-sm text-danger">{signInState.error}</p> : null}
            <Button type="submit" disabled={signInPending} className="w-full">
              {signInPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          {demoEnabled ? null : (
            <>
              <p className="mt-4 text-sm">
                <Link href="/forgot-password" className="text-accent">
                  Forgot password
                </Link>
              </p>
              <hr className="my-6 border-line" />
              <p className="text-sm text-muted">Create an account only if you were invited or are completing first-owner setup.</p>
              <form action={signUp} className="mt-4 space-y-4">
                <Input name="email" type="email" required placeholder="Invite email" />
                <Input name="password" type="password" required placeholder="Password (8+ characters)" />
                {signUpState?.error ? <p className="text-sm text-danger">{signUpState.error}</p> : null}
                {signUpState?.message ? <p className="text-sm text-success">{signUpState.message}</p> : null}
                <Button type="submit" variant="secondary" disabled={signUpPending} className="w-full">
                  Create account
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
