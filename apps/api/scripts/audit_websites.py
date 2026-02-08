"""
Audit restaurant websites to identify sales prospects.

Checks each restaurant's website for:
  - HTTP status (broken sites)
  - SSL validity
  - Redirect destination
  - Platform detection (BeyondMenu, MenuPix, Wix, etc.)
  - Online ordering capability

Usage:
    python -m scripts.audit_websites              # audit all with website_url
    python -m scripts.audit_websites --no-website  # list restaurants with no website
    python -m scripts.audit_websites --state CT    # audit only CT restaurants
    python -m scripts.audit_websites --recheck     # re-audit previously checked
"""

import argparse
import asyncio
import csv
import ssl
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from sqlalchemy import select, func

from app.database import async_session_maker
from app.models import Restaurant, RestaurantLocation, WebsiteAudit

# Delay between requests (be polite)
REQUEST_DELAY = 1.0
REQUEST_TIMEOUT = 15

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

# Platform detection: (signature in HTML or headers, platform name)
PLATFORM_SIGNATURES = [
    ("beyondmenu.com", "beyondmenu"),
    ("menupix.com", "menupix"),
    ("menufy.com", "menufy"),
    ("chownow.com", "chownow"),
    ("grubhub.com", "grubhub"),
    ("doordash.com", "doordash"),
    ("ubereats.com", "ubereats"),
    ("squarespace.com", "squarespace"),
    ("squarespace-cdn.com", "squarespace"),
    ("wix.com", "wix"),
    ("weebly.com", "weebly"),
    ("godaddy.com", "godaddy"),
    ("wordpress.com", "wordpress"),
    ("wp-content", "wordpress"),
    ("shopify.com", "shopify"),
    ("restaurantji.com", "restaurantji"),
    ("zmenu.com", "zmenu"),
    ("allmenus.com", "allmenus"),
    ("order.online", "square"),
    ("square.site", "square"),
    ("gloriacx.com", "gloria-food"),
    ("gloriafood.com", "gloria-food"),
    ("popmenu.com", "popmenu"),
    ("toasttab.com", "toast"),
    ("clover.com", "clover"),
    ("olo.com", "olo"),
]

# Ordering signals in page HTML
ORDERING_SIGNALS = [
    "order online",
    "order now",
    "start order",
    "place order",
    "online ordering",
    "add to cart",
    "checkout",
    "order.online",
    "chownow",
    "menufy",
    "olo.com",
    "toasttab",
    "doordash.com/store",
    "grubhub.com/restaurant",
]


def detect_platform(html: str, url: str, headers: dict) -> str | None:
    """Detect website platform from HTML content and URL."""
    combined = (html + " " + url + " " + str(headers)).lower()
    for signature, platform in PLATFORM_SIGNATURES:
        if signature in combined:
            return platform
    return None


def detect_ordering(html: str, url: str) -> bool:
    """Detect if the site has online ordering."""
    combined = (html + " " + url).lower()
    return any(signal in combined for signal in ORDERING_SIGNALS)


def check_ssl(hostname: str) -> bool:
    """Quick SSL certificate check."""
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(
            __import__("socket").create_connection((hostname, 443), timeout=10),
            server_hostname=hostname,
        ) as sock:
            sock.getpeercert()
        return True
    except Exception:
        return False


def audit_url(url: str) -> dict:
    """Audit a single URL. Returns audit result dict."""
    result = {
        "http_status": None,
        "redirect_url": None,
        "ssl_valid": None,
        "platform": None,
        "has_online_ordering": None,
        "error": None,
    }

    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""

        # SSL check
        if parsed.scheme == "https" or not parsed.scheme:
            result["ssl_valid"] = check_ssl(hostname)

        # HTTP request (follow redirects)
        resp = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; TakeoutBot/1.0)"},
            allow_redirects=True,
        )
        result["http_status"] = resp.status_code

        # Check for redirects
        if resp.url != url:
            result["redirect_url"] = resp.url

        html = resp.text[:200_000]  # cap at 200KB
        result["platform"] = detect_platform(html, resp.url, dict(resp.headers))
        result["has_online_ordering"] = detect_ordering(html, resp.url)

    except requests.exceptions.SSLError as e:
        result["ssl_valid"] = False
        result["error"] = f"SSL error: {str(e)[:200]}"
    except requests.exceptions.ConnectionError as e:
        result["error"] = f"Connection error: {str(e)[:200]}"
    except requests.exceptions.Timeout:
        result["error"] = "Timeout"
    except requests.exceptions.RequestException as e:
        result["error"] = f"Request error: {str(e)[:200]}"

    return result


async def get_restaurants_to_audit(
    state: str | None, recheck: bool
) -> list[tuple[str, str, str, str]]:
    """Get (restaurant_id, name, website_url, state) tuples to audit."""
    async with async_session_maker() as session:
        stmt = (
            select(
                Restaurant.id,
                Restaurant.name,
                Restaurant.website_url,
                RestaurantLocation.state,
            )
            .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
            .where(Restaurant.website_url.isnot(None))
            .where(Restaurant.website_url != "")
        )

        if state:
            stmt = stmt.where(RestaurantLocation.state == state.upper())

        if not recheck:
            # Exclude already-audited restaurants
            audited = select(WebsiteAudit.restaurant_id).distinct()
            stmt = stmt.where(Restaurant.id.notin_(audited))

        stmt = stmt.order_by(RestaurantLocation.state, Restaurant.name)
        result = await session.execute(stmt)
        return [(str(r[0]), r[1], r[2], r[3]) for r in result.all()]


async def get_no_website_restaurants(state: str | None) -> list[tuple]:
    """Get restaurants with no website."""
    async with async_session_maker() as session:
        stmt = (
            select(
                Restaurant.name,
                Restaurant.phone,
                RestaurantLocation.address1,
                RestaurantLocation.city,
                RestaurantLocation.state,
            )
            .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
            .where(
                (Restaurant.website_url.is_(None)) | (Restaurant.website_url == "")
            )
        )
        if state:
            stmt = stmt.where(RestaurantLocation.state == state.upper())
        stmt = stmt.order_by(RestaurantLocation.state, RestaurantLocation.city, Restaurant.name)
        result = await session.execute(stmt)
        return result.all()


async def save_audit(restaurant_id: str, url: str, result: dict) -> None:
    """Save audit result to database."""
    async with async_session_maker() as session:
        async with session.begin():
            audit = WebsiteAudit(
                restaurant_id=restaurant_id,
                url_checked=url,
                http_status=result["http_status"],
                redirect_url=result["redirect_url"],
                ssl_valid=result["ssl_valid"],
                platform=result["platform"],
                has_online_ordering=result["has_online_ordering"],
                error=result["error"],
            )
            session.add(audit)


def write_report(audits: list[dict], output_path: Path) -> None:
    """Write audit results to CSV."""
    fieldnames = [
        "name", "state", "website_url", "http_status", "ssl_valid",
        "redirect_url", "platform", "has_online_ordering", "error",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(audits)


async def main():
    parser = argparse.ArgumentParser(description="Audit restaurant websites")
    parser.add_argument("--state", help="Filter by state (2-letter code)")
    parser.add_argument("--no-website", action="store_true", help="List restaurants with no website")
    parser.add_argument("--recheck", action="store_true", help="Re-audit previously checked sites")
    parser.add_argument("--limit", type=int, help="Max restaurants to audit")
    parser.add_argument("--output", help="Output CSV path", default=str(DATA_DIR / "website_audit.csv"))
    args = parser.parse_args()

    if args.no_website:
        restaurants = await get_no_website_restaurants(args.state)
        print(f"\nRestaurants with no website: {len(restaurants)}\n")
        print(f"{'Name':<40} {'Phone':<16} {'Address':<30} {'City':<20} {'State'}")
        print("-" * 120)
        for name, phone, addr, city, state in restaurants:
            print(f"{(name or ''):<40} {(phone or ''):<16} {(addr or ''):<30} {(city or ''):<20} {state}")

        # Write to CSV
        output_path = Path(args.output).with_name("no_website_restaurants.csv")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["name", "phone", "address1", "city", "state"])
            for row in restaurants:
                writer.writerow(row)
        print(f"\nCSV written to: {output_path}")
        return

    restaurants = await get_restaurants_to_audit(args.state, args.recheck)
    if not restaurants:
        print("No restaurants to audit.")
        return

    if args.limit:
        restaurants = restaurants[:args.limit]

    print(f"Auditing {len(restaurants)} restaurant websites...\n")

    audits: list[dict] = []
    broken = 0
    no_ssl = 0
    has_ordering = 0
    platforms: dict[str, int] = {}

    for i, (rid, name, url, state) in enumerate(restaurants):
        print(f"  [{i+1}/{len(restaurants)}] {name} ({state}) - {url[:60]}...", end=" ", flush=True)

        result = audit_url(url)
        await save_audit(rid, url, result)

        # Track stats
        status = result["http_status"]
        if result["error"] or (status and status >= 400):
            broken += 1
            print(f"BROKEN ({result['error'] or status})")
        elif result["ssl_valid"] is False:
            no_ssl += 1
            print(f"SSL INVALID (status={status})")
        else:
            print(f"OK (status={status})")

        if result["platform"]:
            platforms[result["platform"]] = platforms.get(result["platform"], 0) + 1
        if result["has_online_ordering"]:
            has_ordering += 1

        audits.append({
            "name": name,
            "state": state,
            "website_url": url,
            **result,
        })

        time.sleep(REQUEST_DELAY)

    # Summary
    total = len(audits)
    pct = lambda n: f"{100*n/total:.1f}%" if total else "0%"

    print(f"\n{'='*60}")
    print("AUDIT SUMMARY")
    print(f"{'='*60}")
    print(f"Total audited:        {total}")
    print(f"Broken/unreachable:   {broken} ({pct(broken)})")
    print(f"SSL invalid:          {no_ssl} ({pct(no_ssl)})")
    print(f"Has online ordering:  {has_ordering} ({pct(has_ordering)})")
    print(f"No online ordering:   {total - has_ordering} ({pct(total - has_ordering)})")
    print()
    print("PLATFORMS DETECTED:")
    for platform, count in sorted(platforms.items(), key=lambda x: -x[1]):
        print(f"  {platform:<25} {count:4d} ({pct(count)})")
    print(f"  {'(none/custom)':<25} {total - sum(platforms.values()):4d}")
    print(f"{'='*60}")

    # Write CSV
    output_path = Path(args.output)
    write_report(audits, output_path)
    print(f"\nCSV written to: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
