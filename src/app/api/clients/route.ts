import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { companyId: session.companyId },
    include: {
      quotes: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, email, address, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e WhatsApp do cliente são obrigatórios." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        companyId: session.companyId,
        name: name.trim(),
        phone: phone.trim(),
        email: (email || "").trim(),
        address: (address || "").trim(),
        notes: (notes || "").trim(),
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar cliente." },
      { status: 500 }
    );
  }
}
