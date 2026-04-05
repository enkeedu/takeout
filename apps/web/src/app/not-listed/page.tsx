import type { Metadata } from "next";
import { UnlistedOwnerRequestForm } from "./unlisted-owner-request-form";

export const metadata: Metadata = {
  title: "Restaurant Not Listed",
  description:
    "Send your restaurant details if it is not listed yet and we will help create the website entry path manually.",
  robots: { index: false, follow: false },
};

export default function NotListedPage() {
  return <UnlistedOwnerRequestForm />;
}
