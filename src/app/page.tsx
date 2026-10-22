import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const company = await getCurrentCompany();
  if (!company) {
    redirect("/login");
  }

  const [quotes, clientsCount] = await Promise.all([
    prisma.quote.findMany({
      where: { companyId: company.id },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({
      where: { companyId: company.id },
    }),
  ]);

  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );

  const pendingFollowUpsCount = quotes.filter((q) => {
    if (q.status !== "SENT" && q.status !== "NEW") return false;
    if (q.followUpDone) return false;
    if (!q.followUpDate) return q.status === "SENT";
    return new Date(q.followUpDate) <= endOfToday;
  }).length;

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
    <AppShell
      companyName={company.name}
      companySpecialty={company.specialty}
      pendingFollowUpsCount={pendingFollowUpsCount}
    >
      <DashboardClient
        companyName={company.name}
        quotes={serializedQuotes}
        clientsCount={clientsCount}
      />
    </AppShell>
  );
}
