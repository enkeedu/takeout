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
  template_key: string | null;
}

export interface ModifierOptionOut {
  id: string;
  name: string;
  price_cents: number;
  is_default: boolean;
  sort_order: number;
}

export interface ModifierGroupOut {
  id: string;
  name: string;
  description: string | null;
  min_select: number;
  max_select: number;
  is_required: boolean;
  sort_order: number;
  options: ModifierOptionOut[];
}

export interface MenuItemOut {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
  modifier_groups: ModifierGroupOut[];
}

export interface MenuCategoryOut {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  items: MenuItemOut[];
}

export interface MenuOut {
  id: string;
  name: string;
  is_active: boolean;
  categories: MenuCategoryOut[];
}

export interface MenuItemIn {
  name: string;
  description?: string | null;
  price_cents: number;
  sort_order?: number | null;
  is_active?: boolean;
}

export interface MenuCategoryIn {
  name: string;
  description?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  items: MenuItemIn[];
}

export interface MenuUpsert {
  name: string;
  is_active?: boolean;
  categories: MenuCategoryIn[];
}

export interface OrderItemCreate {
  menu_item_id: string;
  quantity: number;
  modifiers?: OrderItemModifierCreate[];
}

export interface OrderCreate {
  customer_name?: string | null;
  customer_phone?: string | null;
  fulfillment_type?: string;
  notes?: string | null;
  items: OrderItemCreate[];
}

export interface OrderItemModifierCreate {
  modifier_group_id: string;
  modifier_option_id: string;
}

export interface OrderItemModifierOut {
  modifier_group_id: string;
  modifier_group_name: string;
  modifier_option_id: string;
  modifier_option_name: string;
  price_cents: number;
}

export interface OrderItemOut {
  id: string;
  menu_item_id: string | null;
  name: string;
  price_cents: number;
  quantity: number;
  modifiers: OrderItemModifierOut[];
}

export interface OrderOut {
  id: string;
  status: string;
  fulfillment_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  fees_cents: number;
  total_cents: number;
  items: OrderItemOut[];
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
