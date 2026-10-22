import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Orçamento não encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        followUpDone: true,
      },
    });

    return NextResponse.json({
      ok: true,
      status: updated.status,
      approvedAt: updated.approvedAt,
    });
  } catch (error) {
    console.error("Error approving quote:", error);
    return NextResponse.json(
      { error: "Erro ao aprovar orçamento." },
      { status: 500 }
    );
  }
}
