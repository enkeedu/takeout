"use client";

import { useMemo, useState } from "react";
import type { MenuCategory } from "@/lib/restaurantDemo";
import { formatPrice } from "@/lib/restaurantDemo";
import type { TemplateKey } from "./types";

type OrderPanelProps = {
  restaurantName: string;
  menu: MenuCategory[];
  variant: TemplateKey;
};

type CartState = Record<string, number>;

const VARIANT_STYLES: Record<
  TemplateKey,
  {
    panel: string;
    button: string;
    accent: string;
    muted: string;
  }
> = {
  market: {
    panel: "border-orange-100 bg-white/90 text-slate-900",
    button: "bg-orange-600 text-white hover:bg-orange-500",
    accent: "text-orange-700",
    muted: "text-slate-500",
  },
  modern: {
    panel: "border-emerald-100 bg-white text-slate-900",
    button: "bg-emerald-600 text-white hover:bg-emerald-500",
    accent: "text-emerald-700",
    muted: "text-slate-500",
  },
  luxe: {
    panel: "border-amber-100 bg-white text-slate-900",
    button: "bg-[#b8893b] text-white hover:bg-[#a47730]",
    accent: "text-[#9c6b1f]",
    muted: "text-slate-500",
  },
};

export function OrderPanel({ restaurantName, menu, variant }: OrderPanelProps) {
  const [cart, setCart] = useState<CartState>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    "pickup"
  );
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const styles = VARIANT_STYLES[variant];

  const items = useMemo(() => menu.flatMap((category) => category.items), [menu]);

  const subtotal = items.reduce((sum, item) => {
    const qty = cart[item.id] || 0;
    return sum + qty * item.price;
  }, 0);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const cartItems = items.filter((item) => cart[item.id]);

  function handleAdd(itemId: string) {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  }

  function handleRemove(itemId: string) {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[itemId] || 0;
      if (current <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = current - 1;
      }
      return next;
    });
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold uppercase ${styles.accent}`}>
            Order Online
          </p>
          <h3 className="text-2xl font-semibold">
            {restaurantName} Pickup
          </h3>
          <p className={`text-sm ${styles.muted}`}>
            Pay online, track ETA, and earn points.
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${styles.accent}`}
        >
          Demo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          onClick={() => setFulfillment("pickup")}
          className={`rounded-lg border px-3 py-2 font-medium ${
            fulfillment === "pickup"
              ? `${styles.button} border-transparent`
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Pickup
        </button>
        <button
          type="button"
          onClick={() => setFulfillment("delivery")}
          className={`rounded-lg border px-3 py-2 font-medium ${
            fulfillment === "delivery"
              ? `${styles.button} border-transparent`
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Delivery
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {menu.map((category) => (
          <div key={category.name}>
            <h4 className="text-sm font-semibold uppercase text-slate-500">
              {category.name}
            </h4>
            <div className="mt-2 space-y-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="font-semibold">
                        {formatPrice(item.price)}
                      </span>
                      {item.popular && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          Popular
                        </span>
                      )}
                      {item.spice ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                          {item.spice === 1 ? "Medium" : "Hot"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(item.id)}
                    className={`h-8 rounded-full px-3 text-xs font-semibold ${styles.button}`}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-3">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Cart</span>
          <span>{totalItems} items</span>
        </div>
        {cartItems.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Add items to see your order summary.
          </p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatPrice(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="h-6 w-6 rounded-full border border-slate-200 text-xs font-semibold"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold">
                    {cart[item.id]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdd(item.id)}
                    className="h-6 w-6 rounded-full border border-slate-200 text-xs font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Estimated {fulfillment} time: 20-35 min
      </div>

      <button
        type="button"
        onClick={() => setShowDemoNotice(true)}
        className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold ${styles.button}`}
      >
        Place Order
      </button>

      {showDemoNotice ? (
        <p className="mt-3 text-xs text-slate-500">
          Demo checkout only. This showcases the ordering experience for{" "}
          {restaurantName}.
        </p>
      ) : null}
    </div>
  );
}
