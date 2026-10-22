import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Atualizando seed do OrçaAI...");

  const passwordHash = await bcrypt.hash("123456", 10);

  const existing = await prisma.company.findUnique({
    where: { email: "contato@silvaeletrica.com.br" },
  });

  if (existing) {
    await prisma.company.update({
      where: { id: existing.id },
      data: {
        isAdmin: true,
        pixKey: "42.198.765/0001-10 (CNPJ - Silva Elétrica)",
        planStatus: "ACTIVE",
        monthlyFee: 97,
        setupFee: 297,
      },
    });
  }

  // Criar mais 2 empresas assinantes de exemplo para o Painel Super Admin SaaS
  const tenant2 = await prisma.company.findUnique({
    where: { email: "atendimento@martinspinturas.com.br" },
  });
  if (!tenant2) {
    await prisma.company.create({
      data: {
        name: "Martins Pinturas & Reformas",
        email: "atendimento@martinspinturas.com.br",
        passwordHash,
        phone: "11988112233",
        document: "31.456.789/0001-99",
        address: "Santo André - SP",
        specialty: "Pintura Residencial e Predial",
        pixKey: "11988112233",
        planStatus: "ACTIVE",
        monthlyFee: 97,
        setupFee: 297,
        dueDay: 15,
      },
    });
  }

  const tenant3 = await prisma.company.findUnique({
    where: { email: "contato@sosmanutencao.com.br" },
  });
  if (!tenant3) {
    await prisma.company.create({
      data: {
        name: "SOS Marido de Aluguel & Hidráulica",
        email: "contato@sosmanutencao.com.br",
        passwordHash,
        phone: "21977665544",
        document: "19.876.543/0001-22",
        address: "Rio de Janeiro - RJ",
        specialty: "Manutenção Hidráulica e Elétrica",
        pixKey: "contato@sosmanutencao.com.br",
        planStatus: "TRIAL",
        monthlyFee: 97,
        setupFee: 250,
        dueDay: 20,
      },
    });
  }

  console.log("✅ Banco atualizado com Chave PIX, Super Admin e assinantes SaaS!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
