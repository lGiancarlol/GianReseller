import { Metadata } from "next";
import LicenseRequestsClient from "@/components/license-requests/LicenseRequestsClient";

export const metadata: Metadata = { title: "License Requests — GianReseller" };

export default function LicenseRequestsPage() {
  return <LicenseRequestsClient />;
}
