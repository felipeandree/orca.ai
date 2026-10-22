import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, signSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, specialty, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Preencha nome da empresa, e-mail e senha." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.company.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: (phone || "").trim(),
        specialty: specialty || "Prestador de Serviços",
        passwordHash,
      },
    });

    const token = await signSessionToken({
      companyId: company.id,
      email: company.email,
      name: company.name,
    });

    const res = NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta." },
      { status: 500 }
    );
  }
}
