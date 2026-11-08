"use client";

import { useActionState } from "react";
import { submitReviewAction } from "@/app/actions/public";

export function ReviewForm() {
  const [state, action, pending] = useActionState(submitReviewAction, { error: null, ok: false });
  if (state?.ok) {
    return (
      <div className="site-card p-8">
        <p className="site-kicker">Received</p>
        <h2 className="mt-3 font-serif text-3xl">Thank you. Your review is waiting for desk approval.</h2>
        <p className="mt-3 text-[#5d6d7a]">It will appear on the website only after permission is checked and a teammate publishes it. We do not auto-publish reviews.</p>
      </div>
    );
  }
  return (
    <form action={action} className="site-card grid gap-4 p-6 md:grid-cols-2 md:p-8">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Your name</span>
        <input name="traveller_name" required className="site-input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Destination</span>
        <input name="destination" className="site-input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Trip name</span>
        <input name="trip_name" className="site-input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Rating</span>
        <select name="rating" className="site-input">
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="md:col-span-2 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Your review</span>
        <textarea name="quote" required rows={5} className="site-input" />
      </label>
      <label className="md:col-span-2 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5d6d7a]">Photo URL (optional, approved before publish)</span>
        <input name="photo_url" type="url" className="site-input" placeholder="https://" />
      </label>
      <label className="flex items-start gap-2 text-sm text-[#5d6d7a]">
        <input type="checkbox" name="consent" required className="mt-1 accent-[#f26b4e]" />
        I give permission for Northridge to publish this review after approval.
      </label>
      <label className="flex items-start gap-2 text-sm text-[#5d6d7a]">
        <input type="checkbox" name="photo_permission" className="mt-1 accent-[#2f9ed8]" />
        I also permit use of the photograph if one is provided.
      </label>
      {state?.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="site-btn-gold md:col-span-2 disabled:opacity-50">
        {pending ? "Sending…" : "Submit for approval"}
      </button>
    </form>
  );
}
