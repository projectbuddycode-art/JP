import { z } from "zod";

export const enquirySchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  destination: z.string().optional(),
  preferred_start: z.string().optional(),
  travellers: z.coerce.number().int().positive().optional(),
  budget_max: z.coerce.number().optional(),
  consent: z.literal("on"),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  package_id: z.string().optional(),
  trip_name: z.string().optional(),
  trip_type: z.string().optional(),
  notes: z.string().optional(),
  landing_page: z.string().optional(),
  flexible_dates: z.string().optional(),
  communication_preference: z.string().optional(),
  departure_id: z.string().optional(),
});

export const reviewSchema = z.object({
  traveller_name: z.string().min(1).max(120),
  quote: z.string().min(12).max(2000),
  trip_name: z.string().optional(),
  destination: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
  consent: z.literal("on"),
  photo_permission: z.string().optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
  consent: z.literal("on"),
});
