import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(
  input: string | null | undefined,
  defaultCountry: "IN" = "IN",
) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function phonesMatch(a?: string | null, b?: string | null) {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return Boolean(left && right && left === right);
}
