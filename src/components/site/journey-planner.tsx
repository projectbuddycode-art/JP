"use client";

import { useActionState, useState } from "react";
import { submitEnquiryAction } from "@/app/actions/public";

const STEPS = ["Destination", "Dates", "Details"];

export function JourneyPlanner({
  landingPath = "/",
  destination,
  defaultTripType,
}: {
  landingPath?: string;
  destination?: string;
  defaultTripType?: string;
}) {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(submitEnquiryAction, { error: null, ok: false });

  if (state?.ok) {
    return (
      <div className="border border-white/15 bg-white/5 p-8 md:p-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#c4a574]">Enquiry received</p>
        <h3 className="mt-3 font-serif text-4xl">The desk has your brief.</h3>
        <p className="mt-4 max-w-xl text-white/70">
          Thank you. A follow-up is created in the operations desk. We do not promise a fixed reply time unless the business has published one.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="border border-white/10 bg-black/20 p-6 md:p-10">
      <input type="hidden" name="landing_page" value={landingPath} />
      <ol className="mb-8 flex gap-6 text-[11px] uppercase tracking-[0.2em] text-white/40">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "text-[#c4a574]" : ""}>
            0{index + 1} {label}
          </li>
        ))}
      </ol>

      <div className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Field label="Destination" name="destination" defaultValue={destination} />
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/50">Trip type</span>
          <select name="trip_type" defaultValue={defaultTripType ?? ""} className="site-input">
            <option value="">Not specified</option>
            <option value="private">Private</option>
            <option value="group">Group</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <Field label="Travellers" name="travellers" type="number" />
        <Field label="Budget range (INR)" name="budget_max" type="number" />
      </div>

      <div className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Field label="Preferred start" name="preferred_start" type="date" />
        <label className="flex items-end gap-2 text-sm text-white/70">
          <input type="checkbox" name="flexible_dates" className="accent-[#c4a574]" />
          Dates are flexible
        </label>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/50">Special requirements</label>
          <textarea name="notes" rows={4} className="site-input" placeholder="Pacing, accessibility, celebrations, or anything the desk should know." />
        </div>
      </div>

      <div className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Field label="Full name" name="full_name" required={step === 2} />
        <Field label="Phone / WhatsApp" name="phone" required={step === 2} />
        <Field label="Email" name="email" type="email" />
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/50">Preferred contact</span>
          <select name="communication_preference" className="site-input">
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="md:col-span-2 flex items-start gap-2 text-sm text-white/70">
          <input type="checkbox" name="consent" required={step === 2} className="mt-1 accent-[#c4a574]" />
          I agree to be contacted about this enquiry.
        </label>
      </div>

      {state?.error ? <p className="mt-4 text-sm text-red-300">{state.error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 0 ? (
          <button type="button" className="site-btn-ghost" onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" className="site-btn-gold" onClick={() => setStep((value) => value + 1)}>
            Continue
          </button>
        ) : (
          <button type="submit" disabled={pending} className="site-btn-gold disabled:opacity-50">
            {pending ? "Sending…" : "Send to the travel desk"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="site-input" />
    </label>
  );
}
