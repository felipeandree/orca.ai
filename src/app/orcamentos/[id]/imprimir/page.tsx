import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintQuoteView from "@/components/PrintQuoteView";

export const dynamic = "force-dynamic";

export default async function ImprimirOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
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
    createdAt: quote.createdAt.toISOString(),
  };

  return <PrintQuoteView quote={serializedQuote} />;
}
