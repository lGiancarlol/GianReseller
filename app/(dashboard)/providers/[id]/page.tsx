import ProviderDetailClient from "@/components/providers/ProviderDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProviderDetailClient id={id} />;
}
