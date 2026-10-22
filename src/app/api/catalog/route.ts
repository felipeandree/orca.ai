import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { description, type, unitPrice, unit } = body;

  if (!description) {
    return NextResponse.json(
      { error: "Informe a descrição do serviço/material." },
      { status: 400 }
    );
  }

  const item = await prisma.catalogItem.create({
    data: {
      companyId: session.companyId,
      description: description.trim(),
      type: type || "SERVICE",
      unitPrice: Number(unitPrice) || 0,
      unit: unit || "un",
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  await prisma.catalogItem.deleteMany({
    where: { id, companyId: session.companyId },
  });

  return NextResponse.json({ ok: true });
}
