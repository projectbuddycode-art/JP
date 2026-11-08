export type PublicPackage = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  region?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  duration_days?: number | null;
  itinerary?: unknown;
  best_season?: string | null;
  departure_points?: string | null;
  group_size?: string | null;
  price_per_person?: number | null;
  currency?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  accommodation?: string | null;
  transport?: string | null;
  difficulty?: string | null;
  faqs?: unknown;
  cancellation_policy?: string | null;
  status?: string;
  website_status?: string | null;
  cover_image_url?: string | null;
  video_url?: string | null;
  trip_type?: string | null;
  highlights?: unknown;
  price_visibility?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  published_at?: string | null;
};

export type PublicOffer = {
  id: string;
  title: string;
  discount_label?: string | null;
  coupon_code?: string | null;
  valid_until?: string | null;
  applicable_trips?: string | null;
  banner_image_url?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  status?: string | null;
};

export type PublicTestimonial = {
  id: string;
  quote: string;
  attribution?: string | null;
  traveller_name?: string | null;
  trip_name?: string | null;
  destination?: string | null;
  rating?: number | null;
  photo_url?: string | null;
  featured?: boolean | null;
  package_id?: string | null;
  published_at?: string | null;
  permission_recorded?: boolean | null;
};

export type PublicDeparture = {
  id: string;
  name: string;
  package_id?: string | null;
  destination?: string | null;
  start_date: string;
  end_date?: string | null;
  capacity?: number | null;
  status: string;
  start_location?: string | null;
  package?: PublicPackage | null;
  seats_remaining?: number | null;
  duration_days?: number | null;
};
