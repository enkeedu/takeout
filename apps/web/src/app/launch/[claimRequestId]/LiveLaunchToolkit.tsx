"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { trackEvent } from "@/lib/analytics";

type LiveLaunchToolkitProps = {
  claimRequestId: string;
  templateKey: string;
  restaurantName: string;
  restaurantSlug: string;
  liveSiteUrl: string;
};

const SUPPORT_PHONE_URL = "tel:+18183420990";
const SUPPORT_WHATSAPP_URL = "https://wa.me/18183420990";
const GOOGLE_BUSINESS_PROFILE_URL = "https://business.google.com/locations";
const YELP_FOR_BUSINESS_URL = "https://biz.yelp.com/";

function sanitizeFilename(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "restaurant";
}

export function LiveLaunchToolkit({
  claimRequestId,
  templateKey,
  restaurantName,
  restaurantSlug,
  liveSiteUrl,
}: LiveLaunchToolkitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const linkFieldRef = useRef<HTMLInputElement | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const analyticsPayload = useMemo(
    () => ({
      claim_request_id: claimRequestId,
      template_key: templateKey,
      restaurant_slug: restaurantSlug,
    }),
    [claimRequestId, restaurantSlug, templateKey]
  );

  useEffect(() => {
    trackEvent("launch_live_toolkit_viewed", analyticsPayload);
  }, [analyticsPayload]);

  useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      if (!canvasRef.current) return;

      try {
        await QRCode.toCanvas(canvasRef.current, liveSiteUrl, {
          width: 220,
          margin: 1,
          color: {
            dark: "#1f1f1f",
            light: "#fff9f3",
          },
        });
        if (!cancelled) {
          setQrReady(true);
          setQrError(null);
        }
      } catch {
        if (!cancelled) {
          setQrReady(false);
          setQrError("QR code unavailable right now. The live link below still works.");
        }
      }
    }

    void renderQr();

    return () => {
      cancelled = true;
    };
  }, [liveSiteUrl]);

  async function handleCopyLiveLink(eventName = "launch_live_link_copied") {
    if (typeof window === "undefined") return;

    try {
      await navigator.clipboard.writeText(liveSiteUrl);
      setCopyMessage("Live link copied.");
      trackEvent(eventName, analyticsPayload);
      return;
    } catch {
      linkFieldRef.current?.focus();
      linkFieldRef.current?.select();
      setCopyMessage("Live link selected. Copy it with Ctrl+C or Cmd+C.");
      trackEvent(eventName, analyticsPayload);
    }
  }

  function handleDownloadQrCode() {
    if (!canvasRef.current || typeof document === "undefined") return;
    const downloadLink = document.createElement("a");
    downloadLink.href = canvasRef.current.toDataURL("image/png");
    downloadLink.download = `${sanitizeFilename(restaurantName)}-direct-order-qr.png`;
    downloadLink.click();
    trackEvent("launch_qr_downloaded", analyticsPayload);
  }

  return (
    <section className="rounded-3xl border border-[#d8ead8] bg-[#f7fcf7] p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6b39]">
            Live Launch Toolkit
          </p>
          <h2 className="font-[var(--font-display)] mt-2 text-3xl font-bold tracking-tight text-[#1f1f1f] md:text-4xl">
            Your site is live and ready to share
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665b52] md:text-base">
            Start pushing guests to your direct-order website today. Use the live link, post the
            QR code, and update Google, Yelp, and your social bios so repeat customers order from
            your own channel.
          </p>
        </div>
        <div className="rounded-2xl border border-[#d8ead8] bg-white/90 px-4 py-3 text-sm text-[#4f463f] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6b39]">
            Launch Complete
          </p>
          <p className="mt-2 font-semibold text-[#1f1f1f]">Monthly billing is now active.</p>
          <p className="mt-1 text-xs leading-5 text-[#665b52]">
            The handoff is finished. Keep sending guests to your direct-order website and support
            will help if you need post-launch updates.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#dfe7db] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
              Live Site
            </p>
            <input
              ref={linkFieldRef}
              readOnly
              value={liveSiteUrl}
              aria-label="Live site URL"
              className="mt-3 w-full rounded-2xl border border-[#ddc7b5] bg-[#fff9f3] px-4 py-3 text-sm text-[#3f372f] outline-none"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={liveSiteUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("launch_live_site_opened", analyticsPayload)}
                className="rounded-xl bg-[#c73f2f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3324]"
              >
                Open Live Site
              </a>
              <button
                type="button"
                onClick={() => void handleCopyLiveLink()}
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
              >
                Copy Live Link
              </button>
              <button
                type="button"
                onClick={handleDownloadQrCode}
                disabled={!qrReady}
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Download QR Code
              </button>
              <a
                href={SUPPORT_PHONE_URL}
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
              >
                Call Support
              </a>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#ddc7b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
              >
                WhatsApp Support
              </a>
            </div>
            {copyMessage ? (
              <p className="mt-3 text-sm text-[#2f6b39]">{copyMessage}</p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[#eadccf] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
              What To Update Today
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Update your Google Business Profile website or order link
                </p>
                <p className="mt-1 text-sm leading-6 text-[#665b52]">
                  Make sure guests who find you on Google land on your direct-order website instead
                  of a marketplace.
                </p>
                <a
                  href={GOOGLE_BUSINESS_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("launch_update_google_clicked", analyticsPayload)}
                  className="mt-3 inline-flex rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                >
                  Open Google Business Profile
                </a>
              </div>

              <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Update your Yelp website or order link
                </p>
                <p className="mt-1 text-sm leading-6 text-[#665b52]">
                  Send Yelp visitors into your own direct-order flow so repeat guests don’t bounce
                  into another ordering channel.
                </p>
                <a
                  href={YELP_FOR_BUSINESS_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("launch_update_yelp_clicked", analyticsPayload)}
                  className="mt-3 inline-flex rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                >
                  Open Yelp For Business
                </a>
              </div>

              <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Update your Instagram, Facebook, or TikTok bio link
                </p>
                <p className="mt-1 text-sm leading-6 text-[#665b52]">
                  Use the same live link in every social bio so guests always land on your direct
                  ordering page.
                </p>
                <button
                  type="button"
                  onClick={() => void handleCopyLiveLink("launch_update_social_clicked")}
                  className="mt-3 rounded-xl border border-[#ddc7b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b5543] hover:bg-[#fff8f2]"
                >
                  Copy Link For Social
                </button>
              </div>

              <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Add the QR code to your counter, pickup area, or printed menu
                </p>
                <p className="mt-1 text-sm leading-6 text-[#665b52]">
                  Make it easy for walk-in and pickup customers to order directly the next time
                  they visit.
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  Share the direct-order link with repeat customers today
                </p>
                <p className="mt-1 text-sm leading-6 text-[#665b52]">
                  Text it to regulars, post it in your stories, and use it in email or printed
                  promos so guests start using your own channel.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#eadccf] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7a66]">
            Share QR Code
          </p>
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-[#eadccf] bg-[#fff9f3] p-5">
            <canvas
              ref={canvasRef}
              aria-label={`QR code for ${restaurantName}`}
              className="h-[220px] w-[220px] rounded-2xl border border-[#eadccf] bg-[#fff9f3] p-2"
            />
            <p className="mt-4 text-center text-sm font-semibold text-[#1f1f1f]">
              {restaurantName}
            </p>
            <p className="mt-1 text-center text-xs leading-5 text-[#665b52]">
              Download and place this code anywhere you want guests to jump into your direct-order
              website.
            </p>
            {qrError ? <p className="mt-3 text-center text-xs text-[#9e3f28]">{qrError}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
