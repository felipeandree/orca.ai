import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, signSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe seu e-mail e senha." },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!company) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, company.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login." },
      { status: 500 }
    );
  }
}
