import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      company: true,
      items: true,
    },
  });

  if (!quote) {
    return NextResponse.json(
      { error: "Orçamento não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ quote });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.quote.findFirst({
    where: { id, companyId: session.companyId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Orçamento não encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const {
    status,
    followUpDate,
    followUpDone,
    lastContactAt,
    internalNotes,
    notes,
    title,
    discount,
    items,
  } = body;

  const data: Record<string, unknown> = {};

  if (status !== undefined) {
    data.status = status;
    if (status === "SENT" && !existing.sentAt) {
      data.sentAt = new Date();
      // Se ainda não tinha followUpDate definido, agenda para +2 dias
      if (!existing.followUpDate && followUpDate === undefined) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        data.followUpDate = d;
        data.followUpDone = false;
      }
    }
    if (status === "APPROVED") {
      data.approvedAt = new Date();
      data.followUpDone = true;
    }
    if (status === "COMPLETED") {
      data.completedAt = new Date();
      data.followUpDone = true;
    }
    if (status === "REJECTED") {
      data.followUpDone = true;
    }
  }

  if (followUpDate !== undefined) {
    data.followUpDate = followUpDate ? new Date(followUpDate) : null;
  }
  if (followUpDone !== undefined) {
    data.followUpDone = Boolean(followUpDone);
  }
  if (lastContactAt !== undefined) {
    data.lastContactAt = lastContactAt ? new Date(lastContactAt) : null;
  }
  if (internalNotes !== undefined) {
    data.internalNotes = internalNotes;
  }
  if (notes !== undefined) {
    data.notes = notes;
  }
  if (title !== undefined) {
    data.title = title;
  }

  if (items && Array.isArray(items)) {
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
    const disc = discount !== undefined ? Number(discount) : existing.discount;
    data.subtotal = subtotal;
    data.discount = disc;
    data.total = Math.max(0, subtotal - disc);

    await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
    await prisma.quoteItem.createMany({
      data: formattedItems.map((i) => ({ ...i, quoteId: id })),
    });
  }

  const updated = await prisma.quote.update({
    where: { id },
    data,
    include: {
      client: true,
      items: true,
    },
  });

  return NextResponse.json({ quote: updated });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.quote.findFirst({
    where: { id, companyId: session.companyId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Orçamento não encontrado" },
      { status: 404 }
    );
  }

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
