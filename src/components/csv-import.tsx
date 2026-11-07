"use client";

import { useState } from "react";
import { importLeadsCsvAction } from "@/app/actions/import";
import { Button, Card } from "@/components/ui";

export function CsvImport() {
  const [result, setResult] = useState<string | null>(null);
  return (
    <Card>
      <h2 className="font-serif text-xl">CSV import</h2>
      <p className="mt-1 text-sm text-muted">
        Columns recognised: name, phone, email, destination, source, travellers, budget. Duplicate phone/email matches are linked, not merged by name.
      </p>
      <form
        className="mt-4 flex flex-wrap items-center gap-3"
        action={async (formData) => {
          const outcome = await importLeadsCsvAction(formData);
          setResult(
            outcome.error ??
              `Created ${outcome.created}. Potential duplicates linked: ${outcome.duplicates}. Invalid rows: ${outcome.invalid}.`,
          );
        }}
      >
        <input name="file" type="file" accept=".csv" required className="text-sm" />
        <Button type="submit">Import</Button>
      </form>
      {result ? <p className="mt-3 text-sm">{result}</p> : null}
    </Card>
  );
}
