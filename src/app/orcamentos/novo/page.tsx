import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import NewQuoteForm from "@/components/NewQuoteForm";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; duplicateId?: string }>;
}) {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const { clientId, duplicateId } = await searchParams;

  const [clients, catalogItems, duplicateQuote] = await Promise.all([
    prisma.client.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, phone: true, address: true },
      orderBy: { name: "asc" },
    }),
    prisma.catalogItem.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
    duplicateId
      ? prisma.quote.findFirst({
          where: { id: duplicateId, companyId: company.id },
          include: { items: true },
        })
      : Promise.resolve(null),
  ]);

  const initialQuoteData = duplicateQuote
    ? {
        clientId: duplicateQuote.clientId,
        title: `${duplicateQuote.title} (Cópia)`,
        discount: duplicateQuote.discount,
        validDays: duplicateQuote.validDays,
        notes: duplicateQuote.notes,
        items: duplicateQuote.items.map((i) => ({
          description: i.description,
          type: (i.type as "SERVICE" | "MATERIAL") || "SERVICE",
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }
    : undefined;

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <NewQuoteForm
        clients={clients}
        catalogItems={catalogItems}
        preselectedClientId={clientId}
        initialQuoteData={initialQuoteData}
        defaultValidDays={company.defaultValidDays}
        defaultFollowUpDays={company.defaultFollowUpDays}
        defaultNotes={company.defaultNotes}
      />
    </AppShell>
  );
}
