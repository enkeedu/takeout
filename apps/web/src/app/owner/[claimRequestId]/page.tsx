import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  buildListingHref,
  getOwnerSiteProfileWorkspace,
} from "@/lib/claim";
import { OwnerSiteWorkspace } from "./OwnerSiteWorkspace";

export const metadata: Metadata = {
  title: "Owner Website Workspace",
  robots: { index: false },
};

type OwnerWorkspaceParams = {
  claimRequestId?: string;
};

type OwnerWorkspaceSearchParams = {
  access?: string;
};

type OwnerWorkspaceFetchResult =
  | { status: "ok"; payload: Awaited<ReturnType<typeof getOwnerSiteProfileWorkspace>> }
  | { status: "not_found" }
  | { status: "access_denied" }
  | { status: "error" };

async function loadOwnerWorkspace(
  claimRequestId: string,
  accessToken: string
): Promise<OwnerWorkspaceFetchResult> {
  try {
    const payload = await getOwnerSiteProfileWorkspace(claimRequestId, accessToken);
    return { status: "ok", payload };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "not_found" };
    }
    if (error instanceof ApiError && error.status === 403) {
      return { status: "access_denied" };
    }
    return { status: "error" };
  }
}

export default async function OwnerWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<OwnerWorkspaceParams>;
  searchParams: Promise<OwnerWorkspaceSearchParams>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const claimRequestId = (routeParams.claimRequestId || "").trim();
  const accessToken = (query.access || "").trim();

  if (!claimRequestId) {
    return (
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Owner Website Workspace
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Missing claim request
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          We need a claim request ID before we can load the private owner workspace.
        </p>
        <div className="mt-4">
          <Link
            href="/search?claim=1"
            className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
          >
            Find My Restaurant
          </Link>
        </div>
      </section>
    );
  }

  if (!accessToken) {
    return (
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Owner Website Workspace
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Secure owner link required
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          Use the private claim link from your confirmation message so only the verified owner can
          edit website details.
        </p>
      </section>
    );
  }

  const result = await loadOwnerWorkspace(claimRequestId, accessToken);

  if (result.status === "not_found") {
    return (
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Owner Website Workspace
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Claim request not found
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          We could not find that owner access request. Start again from the restaurant listing if
          needed.
        </p>
      </section>
    );
  }

  if (result.status === "access_denied") {
    return (
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Owner Website Workspace
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Secure link expired
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          This workspace needs the current secure owner link from your claim confirmation.
        </p>
      </section>
    );
  }

  if (result.status === "error") {
    return (
      <section className="rounded-3xl border border-[#e6d6c6] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b04a2d]">
          Owner Website Workspace
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#1f1f1f]">
          Temporary loading issue
        </h1>
        <p className="mt-2 text-sm text-[#665b52]">
          We could not load your website workspace right now. Try again from the owner link.
        </p>
      </section>
    );
  }

  const workspace = result.payload;
  const publicListingHref = buildListingHref({
    stateSlug: workspace.baseline.stateSlug,
    citySlug: workspace.baseline.citySlug,
    restaurantSlug: workspace.baseline.restaurantSlug,
  });

  return (
    <OwnerSiteWorkspace
      claimRequestId={claimRequestId}
      accessToken={accessToken}
      workspace={workspace}
      previewHref={`${publicListingHref}?preview=1&template=${encodeURIComponent(
        workspace.profile.templateKey || workspace.baseline.templateKey || "local-order"
      )}`}
      listingHref={publicListingHref}
    />
  );
}
