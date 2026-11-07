"use client";

import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/public";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, { error: null, ok: false });
  if (state?.ok) {
    return <p className="text-sm text-[#c4a574]">Subscription recorded with consent. Email delivery waits until a mail provider is connected.</p>;
  }
  return (
    <form action={action} className="mt-3 space-y-2">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full border border-white/20 bg-transparent px-3 py-2 text-sm"
      />
      <label className="flex items-start gap-2 text-xs text-white/55">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#c4a574]" />
        I agree to receive occasional journey notes. This is separate from trip enquiries.
      </label>
      {state?.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="text-xs uppercase tracking-[0.16em] text-[#c4a574]">
        {pending ? "Saving…" : "Subscribe"}
      </button>
    </form>
  );
}
