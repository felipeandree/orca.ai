import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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

  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      specialty,
      password,
      monthlyFee,
      setupFee,
      dueDay,
      planStatus,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha provisória são obrigatórios." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: (phone || "").trim(),
        specialty: specialty || "Prestador de Serviços",
        passwordHash,
        monthlyFee: Number(monthlyFee) || 97,
        setupFee: Number(setupFee) || 297,
        dueDay: Number(dueDay) || 10,
        planStatus: planStatus || "ACTIVE",
      },
      include: {
        _count: {
          select: { clients: true, quotes: true },
        },
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Admin create company error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar empresa (verifique se o e-mail já existe)." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { id, planStatus, monthlyFee, setupFee, dueDay } = body;

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (planStatus !== undefined) data.planStatus = planStatus;
  if (monthlyFee !== undefined) data.monthlyFee = Number(monthlyFee);
  if (setupFee !== undefined) data.setupFee = Number(setupFee);
  if (dueDay !== undefined) data.dueDay = Number(dueDay);

  const updated = await prisma.company.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { clients: true, quotes: true },
      },
    },
  });

  return NextResponse.json({ company: updated });
}
