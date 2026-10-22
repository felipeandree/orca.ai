import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: {
      catalogItems: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ company });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    phone,
    document,
    address,
    specialty,
    pixKey,
    logoUrl,
    defaultValidDays,
    defaultFollowUpDays,
    defaultNotes,
  } = body;

  const updated = await prisma.company.update({
    where: { id: session.companyId },
    data: {
      name: name?.trim(),
      phone: phone?.trim(),
      document: document?.trim(),
      address: address?.trim(),
      specialty: specialty?.trim(),
      pixKey: pixKey !== undefined ? pixKey.trim() : undefined,
      logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      defaultValidDays: Number(defaultValidDays) || 7,
      defaultFollowUpDays: Number(defaultFollowUpDays) || 2,
      defaultNotes: defaultNotes ?? "",
    },
  });

  return NextResponse.json({ company: updated });
}
