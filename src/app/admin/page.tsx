import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import AdminSaaSClient from "@/components/AdminSaaSClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: {
          clients: true,
          quotes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = companies.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <AppShell companyName={company.name} companySpecialty={company.specialty}>
      <AdminSaaSClient initialCompanies={serialized} />
    </AppShell>
  );
}
