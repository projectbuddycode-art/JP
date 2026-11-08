"use client";

import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/public";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, { error: null, ok: false });
  if (state?.ok) {
    return <p className="text-sm text-[#3d7ab5]">Subscription recorded with consent. Email delivery waits until a mail provider is connected.</p>;
  }
  return (
    <form action={action} className="mt-3 space-y-2">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full border border-[#d7e2ee] bg-transparent px-3 py-2 text-sm"
      />
      <label className="flex items-start gap-2 text-xs text-[#6b7a88]">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#4f8fc4]" />
        I agree to receive occasional journey notes. This is separate from trip enquiries.
      </label>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="text-xs uppercase tracking-[0.16em] text-[#3d7ab5]">
        {pending ? "Saving…" : "Subscribe"}
      </button>
    </form>
  );
}
