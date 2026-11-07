import { createLeadAction } from "@/app/actions/crm";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

export function LeadForm() {
  return (
    <Card>
      <h2 className="font-serif text-xl">New enquiry</h2>
      <form action={createLeadAction} className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <Input name="full_name" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input name="phone" placeholder="+91…" />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" />
        </div>
        <div>
          <Label>Destination</Label>
          <Input name="destination" placeholder="Spiti Valley" />
        </div>
        <div>
          <Label>Source</Label>
          <select name="source" defaultValue="incoming_call" className="w-full rounded-md border border-line px-3 py-2 text-sm">
            <option value="incoming_call">Incoming phone call</option>
            <option value="walk_in">Walk-in</option>
            <option value="existing_customer">Existing customer</option>
            <option value="referral">Referral</option>
            <option value="hotel_referral">Hotel referral</option>
            <option value="driver_referral">Driver referral</option>
            <option value="partner_referral">Partner referral</option>
            <option value="google_business">Google Business Profile</option>
            <option value="offline_campaign">Offline campaign</option>
            <option value="manual">Other / manual</option>
          </select>
        </div>
        <div>
          <Label>Travellers</Label>
          <Input name="travellers" type="number" min={1} />
        </div>
        <div>
          <Label>Start date</Label>
          <Input name="preferred_start" type="date" />
        </div>
        <div>
          <Label>Budget ceiling (INR)</Label>
          <Input name="budget_max" type="number" />
        </div>
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea name="notes" rows={3} />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="consent_marketing" />
          Marketing messages permitted
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Save lead</Button>
        </div>
      </form>
    </Card>
  );
}
