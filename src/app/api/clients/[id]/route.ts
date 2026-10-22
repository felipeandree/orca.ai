import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { name, phone, email, address, notes } = body;

  const existing = await prisma.client.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      address: address ?? existing.address,
      notes: notes ?? existing.notes,
    },
  });

  return NextResponse.json({ client });
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
  const existing = await prisma.client.findFirst({
    where: { id, companyId: session.companyId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
