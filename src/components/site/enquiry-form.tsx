"use client";

import { useActionState } from "react";
import { submitEnquiryAction } from "@/app/actions/public";

export function EnquiryForm({
  destination,
  packageId,
  tripName,
  tripType,
  landingPath,
  departureId,
}: {
  destination?: string;
  packageId?: string;
  tripName?: string;
  tripType?: string;
  landingPath?: string;
  departureId?: string;
}) {
  const [state, action, pending] = useActionState(submitEnquiryAction, { error: null, ok: false });
  if (state?.ok) {
    return (
      <div className="border border-[#d7e2ee] bg-[#eef4fa] p-8 text-[#1a2330]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#3d7ab5]">Enquiry received</p>
        <h2 className="mt-3 font-serif text-4xl">Your Himalayan journey starts here.</h2>
        <p className="mt-4 max-w-xl text-[#4a5866]">
          Thank you. Our travel team has received your request and will review your requirements. A follow-up is created in the operations desk — we do not promise a fixed reply time unless it has been published by the business.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="package_id" value={packageId ?? ""} />
      <input type="hidden" name="trip_name" value={tripName ?? ""} />
      <input type="hidden" name="landing_page" value={landingPath ?? ""} />
      <input type="hidden" name="departure_id" value={departureId ?? ""} />
      <Field label="Full name" name="full_name" required />
      <Field label="Phone / WhatsApp" name="phone" required />
      <Field label="Email" name="email" type="email" />
      <Field label="Destination" name="destination" defaultValue={destination} />
      <Field label="Preferred start" name="preferred_start" type="date" />
      <label className="flex items-end gap-2 text-sm text-[#4a5866]">
        <input type="checkbox" name="flexible_dates" className="accent-[#4f8fc4]" />
        Dates are flexible
      </label>
      <Field label="Travellers" name="travellers" type="number" />
      <Field label="Budget range (INR)" name="budget_max" type="number" />
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#6b7a88]">Trip type</label>
        <select name="trip_type" defaultValue={tripType ?? ""} className="site-input">
          <option value="">Not specified</option>
          <option value="private">Private</option>
          <option value="group">Group</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#6b7a88]">Preferred contact</label>
        <select name="communication_preference" className="site-input">
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
      </div>
      <Field label="UTM source" name="utm_source" />
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#6b7a88]">Requirements</label>
        <textarea name="notes" rows={4} className="site-input" />
      </div>
      <label className="md:col-span-2 flex items-start gap-2 text-sm text-[#4a5866]">
        <input type="checkbox" name="consent" required className="mt-1 accent-[#4f8fc4]" />
        I agree to be contacted about this enquiry. Marketing messages are not included unless I opt in separately.
      </label>
      {state?.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="site-btn-gold md:col-span-2 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
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
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#6b7a88]">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="site-input"
      />
    </div>
  );
}
