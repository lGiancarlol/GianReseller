import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import LicenseRequestDetailClient from "@/components/license-requests/LicenseRequestDetailClient";

export default async function LicenseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const request = await prisma.licenseRequest.findUnique({
    where: { id },
    include: {
      reseller: { select: { id: true, name: true, username: true } },
      provider: { select: { id: true, name: true, type: true } },
      product: { select: { id: true, name: true, externalId: true } },
      logs: { orderBy: { createdAt: "asc" } },
      movements: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) notFound();

  return <LicenseRequestDetailClient request={request} />;
}
