import type {
  ClaimTemplateChoice,
  PreferredContactMethod,
} from "@/lib/claim";

export type ClaimVerificationDraft = {
  session_id: string | null;
  masked_phone: string | null;
  provider_mode: "mock" | "twilio" | null;
  verified_token: string | null;
  verified_token_expires_at: string | null;
  verified_at: string | null;
};

export type ClaimDraftV2 = {
  version: 2;
  state_slug: string;
  city_slug: string;
  restaurant_slug: string;
  step: number;
  selected_template: ClaimTemplateChoice;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  preferred_contact: PreferredContactMethod;
  verified_identity: boolean;
  verified_contact: boolean;
  verified_menu: boolean;
  verified_hours: boolean;
  launch_ready: boolean;
  verification?: ClaimVerificationDraft | null;
  updated_at: string;
};

const CLAIM_DRAFT_STORAGE_KEY = "claim_draft_v2";

function getSafeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function parseDraftStore(raw: string | null): Record<string, ClaimDraftV2> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ClaimDraftV2>;
  } catch {
    return {};
  }
}

function writeDraftStore(store: Record<string, ClaimDraftV2>): void {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return;
  safeWindow.localStorage.setItem(CLAIM_DRAFT_STORAGE_KEY, JSON.stringify(store));
}

export function buildClaimDraftKey(input: {
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
}): string {
  return `${input.stateSlug}/${input.citySlug}/${input.restaurantSlug}`;
}

export function loadClaimDraft(key: string): ClaimDraftV2 | null {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return null;
  const store = parseDraftStore(safeWindow.localStorage.getItem(CLAIM_DRAFT_STORAGE_KEY));
  const draft = store[key];
  if (!draft || draft.version !== 2) return null;
  return draft;
}

export function saveClaimDraft(key: string, draft: ClaimDraftV2): void {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return;
  const store = parseDraftStore(safeWindow.localStorage.getItem(CLAIM_DRAFT_STORAGE_KEY));
  store[key] = draft;
  writeDraftStore(store);
}

export function clearClaimDraft(key: string): void {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return;
  const store = parseDraftStore(safeWindow.localStorage.getItem(CLAIM_DRAFT_STORAGE_KEY));
  if (!(key in store)) return;
  delete store[key];
  writeDraftStore(store);
}
