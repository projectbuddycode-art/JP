import { can, profileRole, type SessionProfile } from "@/lib/auth/permissions";

export function canAccessDeparture(
  profile: SessionProfile,
  departure: { trip_leader_id?: string | null },
) {
  const role = profileRole(profile);
  if (role === "owner" || role === "admin" || role === "finance") return true;
  if (role === "trip_leader") return departure.trip_leader_id === profile.id;
  return can(profile, "bookings.manage") || can(profile, "operations.manage");
}
