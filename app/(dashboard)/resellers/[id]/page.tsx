import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResellerDetailClient from "@/components/resellers/ResellerDetailClient";

export default async function ResellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { id },
    include: {
      movements: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { requests: true } },
    },
  });

  if (!reseller) notFound();

  const { password: _, ...data } = reseller;

  return <ResellerDetailClient reseller={data} />;
}
