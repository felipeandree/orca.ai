import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import CompanySettingsClient from "@/components/CompanySettingsClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const sessionCompany = await getCurrentCompany();
  if (!sessionCompany) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: sessionCompany.id },
    include: {
      catalogItems: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    redirect("/login");
  }

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <CompanySettingsClient company={company} />
    </AppShell>
  );
}
