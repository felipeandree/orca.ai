import { notFound, redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import QuoteDetailClient from "@/components/QuoteDetailClient";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: { id, companyId: company.id },
    include: {
      client: true,
      company: true,
      items: true,
    },
  });

  if (!quote) {
    notFound();
  }

  const serializedQuote = {
    ...quote,
    followUpDate: quote.followUpDate ? quote.followUpDate.toISOString() : null,
    createdAt: quote.createdAt.toISOString(),
  };

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <QuoteDetailClient quote={serializedQuote} />
    </AppShell>
  );
}
