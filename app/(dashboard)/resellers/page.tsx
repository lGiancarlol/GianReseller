import { Metadata } from "next";
import ResellersClient from "@/components/resellers/ResellersClient";

export const metadata: Metadata = { title: "Resellers — GianReseller" };

export default function ResellersPage() {
  return <ResellersClient />;
}
