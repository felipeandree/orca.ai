import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import ClientsManager from "@/components/ClientsManager";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: { companyId: company.id },
    include: {
      quotes: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          total: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <ClientsManager initialClients={clients} />
    </AppShell>
  );
}
