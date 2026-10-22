import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import QuotesBoard from "@/components/QuotesBoard";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage() {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    include: {
      client: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedQuotes = quotes.map((q) => ({
    ...q,
    followUpDate: q.followUpDate ? q.followUpDate.toISOString() : null,
    lastContactAt: q.lastContactAt ? q.lastContactAt.toISOString() : null,
    sentAt: q.sentAt ? q.sentAt.toISOString() : null,
    approvedAt: q.approvedAt ? q.approvedAt.toISOString() : null,
    completedAt: q.completedAt ? q.completedAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    client: {
      ...q.client,
      createdAt: q.client.createdAt.toISOString(),
      updatedAt: q.client.updatedAt.toISOString(),
    },
  }));

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <QuotesBoard
        companyName={company.name}
        initialQuotes={serializedQuotes}
      />
    </AppShell>
  );
}
