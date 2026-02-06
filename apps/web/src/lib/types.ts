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
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  hours_json: Record<string, unknown> | null;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
  is_canonical: boolean;
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
