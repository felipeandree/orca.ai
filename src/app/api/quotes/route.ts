import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const quotes = await prisma.quote.findMany({
    where: { companyId: session.companyId },
    include: {
      client: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      clientId,
      newClient,
      title,
      status,
      discount,
      validDays,
      followUpDate,
      notes,
      internalNotes,
      items,
    } = body;

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Informe o título do serviço e pelo menos 1 item." },
        { status: 400 }
      );
    }

    let resolvedClientId = clientId;

    if (!resolvedClientId && newClient?.name && newClient?.phone) {
      const createdClient = await prisma.client.create({
        data: {
          companyId: session.companyId,
          name: newClient.name.trim(),
          phone: newClient.phone.trim(),
          address: (newClient.address || "").trim(),
        },
      });
      resolvedClientId = createdClient.id;
    }

    if (!resolvedClientId) {
      return NextResponse.json(
        { error: "Selecione um cliente ou cadastre um novo." },
        { status: 400 }
      );
    }

    // Próximo número sequencial do orçamento na empresa
    const lastQuote = await prisma.quote.findFirst({
      where: { companyId: session.companyId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastQuote?.number || 100) + 1;

    const formattedItems = items.map(
      (item: {
        description: string;
        type?: string;
        quantity: number;
        unitPrice: number;
      }) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        return {
          description: item.description.trim(),
          type: item.type || "SERVICE",
          quantity: qty,
          unitPrice: price,
          total: qty * price,
        };
      }
    );

    const subtotal = formattedItems.reduce((sum, i) => sum + i.total, 0);
    const disc = Number(discount) || 0;
    const total = Math.max(0, subtotal - disc);

    const quote = await prisma.quote.create({
      data: {
        number: nextNumber,
        companyId: session.companyId,
        clientId: resolvedClientId,
        title: title.trim(),
        status: status || "NEW",
        subtotal,
        discount: disc,
        total,
        validDays: Number(validDays) || 7,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        sentAt: status === "SENT" ? new Date() : null,
        notes: notes ?? "",
        internalNotes: internalNotes ?? "",
        items: {
          create: formattedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Create quote error:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento." },
      { status: 500 }
    );
  }
}
