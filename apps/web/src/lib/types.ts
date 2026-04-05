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
  online_ordering_count: number;
  no_online_ordering_count: number;
  claimed_count: number;
  unclaimed_count: number;
  ai_phone_count: number;
  website_count: number;
  opportunity_score: number;
}

export interface RestaurantListItem {
  name: string;
  phone: string | null;
  website_url: string | null;
  has_online_ordering: boolean;
  has_ai_phone: boolean;
  is_claimed: boolean;
  lead_score: number;
  rating?: number | null;
  user_rating_count?: number | null;
  price_level?: string | null;
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
  short_description: string | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  photo_urls: string[] | null;
  menu_image_urls: string[] | null;
  site_profile_published: boolean;
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
  template_key: string | null;
}

export interface RestaurantReviewItem {
  id: string;
  name: string;
  rating: number;
  quote: string;
  source: string;
  source_url: string | null;
  relative_time: string | null;
  published_at: string | null;
}

export interface RestaurantReviewsResponse {
  items: RestaurantReviewItem[];
  refreshed_at: string | null;
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

export interface AdminClaimQueueItem {
  claim_request_id: string;
  status: string;
  status_label: string;
  status_detail: string;
  payment_unlocked: boolean;
  setup_deposit_state: string;
  kickoff_state: string;
  review_state: string;
  submitted_at: string;
  kickoff_scheduled_for: string | null;
  review_responded_at: string | null;
  review_issue_areas: string[];
  review_notes: string | null;
  setup_intake_status: string;
  setup_intake_submitted_at: string | null;
  setup_intake_summary: AdminSetupIntakeSummary | null;
  template_key: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  preferred_contact_method: string;
  verification_method: string;
  verification_status: string;
  manual_review_reason: string | null;
  restaurant_name: string;
  restaurant_city: string;
  restaurant_state: string;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
}

export interface AdminClaimQueueResponse {
  items: AdminClaimQueueItem[];
}

export interface AdminUnlistedOwnerRequestItem {
  request_id: string;
  restaurant_name: string;
  city: string;
  state: string;
  restaurant_phone: string | null;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  preferred_contact_method: string;
  website_url: string | null;
  google_maps_url: string | null;
  yelp_url: string | null;
  notes: string | null;
  source_path: string | null;
  status: string;
  created_at: string;
}

export interface AdminUnlistedOwnerRequestResponse {
  items: AdminUnlistedOwnerRequestItem[];
}

export interface AdminSetupIntakeSummary {
  preferredContactMethod?: string;
  preferred_contact_method?: string;
  hoursFulfillmentNotes?: string | null;
  hours_fulfillment_notes?: string | null;
  googleBusinessProfileStatus?: string;
  google_business_profile_status?: string;
  yelpStatus?: string;
  yelp_status?: string;
  domainStatus?: string;
  domain_status?: string;
  logoPhotosStatus?: string;
  logo_photos_status?: string;
  posPaymentStatus?: string;
  pos_payment_status?: string;
  setupNotes?: string | null;
  setup_notes?: string | null;
}

export interface AdminDiagnostics {
  api_admin_token_configured: boolean;
  payment_provider: string;
  stripe_ready: boolean;
  sms_provider: string;
  smtp_ready: boolean;
  smtp_auth_configured: boolean;
  smtp_sender_ready: boolean;
  web_base_url_configured: boolean;
  claim_alert_recipient_ready: boolean;
  claim_alert_ready: boolean;
  owner_notifications_ready: boolean;
  warnings: string[];
}

export interface AdminTestEmailResponse {
  recipient: string;
  detail: string;
}

export interface SearchResultItem {
  name: string;
  phone: string | null;
  website_url?: string | null;
  has_online_ordering?: boolean;
  is_claimed?: boolean;
  rating?: number | null;
  user_rating_count?: number | null;
  address1: string;
  city: string;
  state: string;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
  rank: number;
}
