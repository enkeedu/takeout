export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StateInfo {
  state: string;
  restaurant_count: number;
}

export interface CityInfo {
  city: string;
  city_slug: string;
  state: string;
  restaurant_count: number;
}

export interface RestaurantListItem {
  name: string;
  phone: string | null;
  address1: string;
  city: string;
  state: string;
  zip: string;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
}

export interface RestaurantDetail {
  id: string;
  name: string;
  phone: string | null;
  website_url: string | null;
  has_online_ordering: boolean;
  has_ai_phone: boolean;
  is_claimed: boolean;
  rating: number | null;
  user_rating_count: number | null;
  price_level: string | null;
  google_place_id: string | null;
  google_maps_uri: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  hours_json: Record<string, unknown> | null;
  has_takeout: boolean | null;
  has_delivery: boolean | null;
  has_dine_in: boolean | null;
  business_status: string | null;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
  is_canonical: boolean;
}

export interface LeadItem {
  restaurant_id: string;
  name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  platform: string | null;
  has_online_ordering: boolean;
  http_status: number | null;
  ssl_valid: boolean | null;
  audit_error: string | null;
  rating: number | null;
  user_rating_count: number | null;
  lead_score: number;
  estimated_monthly_spend: number;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
}

export interface ChartEntry {
  label: string;
  value: number;
}

export interface LeadStats {
  total_restaurants: number;
  no_website_count: number;
  broken_website_count: number;
  avg_lead_score: number;
  platform_counts: ChartEntry[];
  score_distribution: ChartEntry[];
  website_status: ChartEntry[];
  ordering_counts: ChartEntry[];
}

export interface LeadsResponse {
  stats: LeadStats;
  items: LeadItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SearchResultItem {
  name: string;
  phone: string | null;
  address1: string;
  city: string;
  state: string;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
  rank: number;
}
