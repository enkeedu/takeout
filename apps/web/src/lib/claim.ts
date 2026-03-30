import { apiFetch } from "@/lib/api";

export type ClaimTemplateChoice =
  | "local-order"
  | "local-storefront"
  | "local-express";
export type PreferredContactMethod = "call" | "text" | "whatsapp" | "email";
export type SetupDepositState = "pending" | "paid" | "failed" | "refunded";
export type KickoffState = "pending" | "scheduled" | "confirmed";
export type MonthlyBillingState = "pending" | "active";
export type MockDepositOutcome = "paid" | "failed" | "cancelled";
export type ClaimReviewState = "pending" | "changes_requested" | "approved";
export type ClaimReviewDecision = "approved" | "changes_requested";
export type ClaimReviewIssueArea =
  | "branding_photos"
  | "menu_pricing"
  | "hours_contact"
  | "fulfillment_ordering"
  | "links_cta";
export type ClaimSetupExternalStatus = "ready" | "need_help" | "not_sure";
export type ClaimSetupDomainStatus =
  | "have_access"
  | "need_help"
  | "no_domain_yet"
  | "not_sure";
export type ClaimSetupAssetStatus = "ready" | "partial" | "need_help";
export type ClaimSetupPosStatus =
  | "ready"
  | "need_help"
  | "not_applicable"
  | "not_sure";
export type ClaimSetupIntakeStatus = "missing" | "submitted";

type ClaimPathInput = {
  stateSlug?: string | null;
  citySlug?: string | null;
  restaurantSlug?: string | null;
  templateKey?: string | null;
};

export type ClaimSendCodeRequest = {
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
};

export type ClaimSendCodeResponse = {
  sessionId: string;
  maskedPhone: string;
  expiresInSeconds: number;
  providerMode: "mock" | "twilio";
};

export type ClaimVerifyCodeRequest = {
  sessionId: string;
  code: string;
};

export type ClaimVerifyCodeResponse = {
  verified: boolean;
  verifiedToken: string;
  expiresInSeconds: number;
};

export type ClaimSubmitRequest = {
  verifiedToken: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  preferredContactMethod: PreferredContactMethod;
  templateKey: ClaimTemplateChoice;
  menuConfirmed: boolean;
  hoursContactConfirmed: boolean;
  launchTermsAccepted: boolean;
};

export type ClaimSubmitResponse = {
  claimRequestId: string;
  status: string;
  launchAccessToken: string;
};

export type ClaimProgressStep = {
  key: string;
  label: string;
  state: "completed" | "current" | "upcoming";
  detail: string;
};

export type ClaimPricingSnapshot = {
  setupDepositCents: number;
  monthlyPlanCents: number;
  currency: string;
};

export type ClaimSetupIntakeSummary = {
  preferredContactMethod: PreferredContactMethod;
  hoursFulfillmentNotes: string | null;
  googleBusinessProfileStatus: ClaimSetupExternalStatus;
  yelpStatus: ClaimSetupExternalStatus;
  domainStatus: ClaimSetupDomainStatus;
  logoPhotosStatus: ClaimSetupAssetStatus;
  posPaymentStatus: ClaimSetupPosStatus;
  setupNotes: string | null;
};

export type ClaimRequestStatusResponse = {
  claimRequestId: string;
  status: string;
  statusLabel: string;
  statusDetail: string;
  paymentUnlocked: boolean;
  setupDepositState: SetupDepositState;
  setupDepositDetail: string;
  setupDepositPaidAt: string | null;
  kickoffState: KickoffState;
  kickoffDetail: string;
  kickoffScheduledFor: string | null;
  reviewState: ClaimReviewState;
  reviewRespondedAt: string | null;
  reviewIssueAreas: ClaimReviewIssueArea[];
  reviewNotes: string | null;
  monthlyBillingState: MonthlyBillingState;
  monthlyBillingDetail: string;
  monthlyBillingStartsAt: string | null;
  setupIntakeStatus: ClaimSetupIntakeStatus;
  setupIntakeSubmittedAt: string | null;
  setupIntakeSummary: ClaimSetupIntakeSummary | null;
  pricing: ClaimPricingSnapshot;
  templateKey: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  preferredContactMethod: PreferredContactMethod;
  verificationMethod: string;
  verificationStatus: string;
  menuConfirmed: boolean;
  hoursContactConfirmed: boolean;
  launchTermsAcceptedAt: string | null;
  submittedAt: string;
  nextStepTitle: string;
  nextStepDetail: string;
  restaurant: {
    name: string;
    phone: string | null;
    address1: string;
    city: string;
    state: string;
    stateSlug: string;
    citySlug: string;
    restaurantSlug: string;
  };
  timeline: ClaimProgressStep[];
};

export type ClaimManualReviewRequest = {
  stateSlug: string;
  citySlug: string;
  restaurantSlug: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  preferredContactMethod: PreferredContactMethod;
  templateKey: ClaimTemplateChoice;
  reason: string;
};

export type ClaimManualReviewResponse = {
  claimRequestId: string;
  status: string;
  launchAccessToken: string;
};

export type ClaimDepositCheckoutRequest = {
  accessToken: string;
};

export type ClaimDepositCheckoutResponse = {
  checkoutUrl: string;
};

export type ClaimMockDepositCompleteRequest = {
  accessToken: string;
  outcome: MockDepositOutcome;
};

export type ClaimReviewDecisionRequest = {
  accessToken: string;
  decision: ClaimReviewDecision;
  issueAreas?: ClaimReviewIssueArea[];
  notes?: string | null;
};

export type ClaimSetupIntakeRequest = ClaimSetupIntakeSummary & {
  accessToken: string;
};

function normalizePart(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

export function hasClaimContext(input: ClaimPathInput): boolean {
  return Boolean(
    normalizePart(input.stateSlug) &&
      normalizePart(input.citySlug) &&
      normalizePart(input.restaurantSlug)
  );
}

export function buildClaimHref(input: ClaimPathInput): string {
  const state = normalizePart(input.stateSlug);
  const city = normalizePart(input.citySlug);
  const slug = normalizePart(input.restaurantSlug);

  if (!state || !city || !slug) {
    return "/search?claim=1";
  }

  const params = new URLSearchParams({ state, city, slug });
  if (input.templateKey?.trim()) {
    params.set("template", input.templateKey.trim());
  }
  return `/claim?${params.toString()}`;
}

export function buildListingHref(input: ClaimPathInput): string {
  const state = normalizePart(input.stateSlug);
  const city = normalizePart(input.citySlug);
  const slug = normalizePart(input.restaurantSlug);
  if (!state || !city || !slug) return "/search?claim=1";
  return `/${state}/${city}/${slug}`;
}

export function buildLaunchStatusHref(
  claimRequestId: string,
  accessToken?: string,
  extraParams?: Record<string, string | null | undefined>
): string {
  const normalized = claimRequestId.trim();
  if (!normalized) return "/search?claim=1";
  const params = new URLSearchParams();
  if (accessToken?.trim()) params.set("access", accessToken.trim());
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value && value.trim()) params.set(key, value.trim());
    });
  }
  const query = params.toString();
  return query
    ? `/launch/${encodeURIComponent(normalized)}?${query}`
    : `/launch/${encodeURIComponent(normalized)}`;
}

export async function sendClaimCode(
  payload: ClaimSendCodeRequest
): Promise<ClaimSendCodeResponse> {
  return apiFetch<ClaimSendCodeResponse>("/claim/send-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyClaimCode(
  payload: ClaimVerifyCodeRequest
): Promise<ClaimVerifyCodeResponse> {
  return apiFetch<ClaimVerifyCodeResponse>("/claim/verify-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitClaimRequest(
  payload: ClaimSubmitRequest
): Promise<ClaimSubmitResponse> {
  return apiFetch<ClaimSubmitResponse>("/claim/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitClaimManualReview(
  payload: ClaimManualReviewRequest
): Promise<ClaimManualReviewResponse> {
  return apiFetch<ClaimManualReviewResponse>("/claim/manual-review", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getClaimRequestStatus(
  claimRequestId: string,
  accessToken: string
): Promise<ClaimRequestStatusResponse> {
  return apiFetch<ClaimRequestStatusResponse>(
    `/claim/requests/${encodeURIComponent(claimRequestId)}`,
    {
      headers: { "X-Launch-Access-Token": accessToken },
    }
  );
}

export async function createClaimDepositCheckout(
  claimRequestId: string,
  payload: ClaimDepositCheckoutRequest
): Promise<ClaimDepositCheckoutResponse> {
  return apiFetch<ClaimDepositCheckoutResponse>(
    `/claim/requests/${encodeURIComponent(claimRequestId)}/deposit-checkout`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function completeMockClaimDeposit(
  claimRequestId: string,
  payload: ClaimMockDepositCompleteRequest
): Promise<ClaimRequestStatusResponse> {
  return apiFetch<ClaimRequestStatusResponse>(
    `/claim/requests/${encodeURIComponent(claimRequestId)}/mock-deposit-complete`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function submitClaimReviewDecision(
  claimRequestId: string,
  payload: ClaimReviewDecisionRequest
): Promise<ClaimRequestStatusResponse> {
  return apiFetch<ClaimRequestStatusResponse>(
    `/claim/requests/${encodeURIComponent(claimRequestId)}/review-decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function submitClaimSetupIntake(
  claimRequestId: string,
  payload: ClaimSetupIntakeRequest
): Promise<ClaimRequestStatusResponse> {
  return apiFetch<ClaimRequestStatusResponse>(
    `/claim/requests/${encodeURIComponent(claimRequestId)}/setup-intake`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
