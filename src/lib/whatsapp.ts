export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function cleanPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  NEW: {
    label: "Novo / Rascunho",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    badgeBg: "bg-slate-200 text-slate-800",
  },
  SENT: {
    label: "Orçamento Enviado",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    badgeBg: "bg-amber-100 text-amber-800",
  },
  APPROVED: {
    label: "Aprovado",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  COMPLETED: {
    label: "Concluído",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    badgeBg: "bg-blue-100 text-blue-800",
  },
  REJECTED: {
    label: "Perdido / Recusado",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-300",
    badgeBg: "bg-rose-100 text-rose-800",
  },
};

export function buildQuoteWhatsAppUrl(params: {
  clientName: string;
  clientPhone: string;
  companyName: string;
  quoteNumber: number;
  title: string;
  items: { description: string; quantity: number; total: number; type: string }[];
  subtotal: number;
  discount: number;
  total: number;
  validDays: number;
  notes?: string;
  publicUrl?: string;
}): string {
  const phone = cleanPhone(params.clientPhone);
  const firstName = params.clientName.split(" ")[0];

  const itemsList = params.items
    .map(
      (i) =>
        `• ${i.quantity}x ${i.description}: *${formatCurrency(i.total)}*`
    )
    .join("\n");

  const discountLine =
    params.discount > 0
      ? `\nSubtotal: ${formatCurrency(params.subtotal)}\nDesconto: -${formatCurrency(params.discount)}`
      : "";

  const linkLine = params.publicUrl
    ? `\n\n📄 *Link para visualizar / baixar PDF:*\n${params.publicUrl}`
    : "";

  const message =
    `Olá, *${firstName}*! Tudo bem? 👋\n` +
    `Aqui é da *${params.companyName}*.\n\n` +
    `Segue o seu *Orçamento #${params.quoteNumber}* referente a:\n` +
    `🔧 *${params.title}*\n\n` +
    `*Itens do Orçamento:*\n${itemsList}` +
    `${discountLine}\n\n` +
    `💰 *VALOR TOTAL: ${formatCurrency(params.total)}*\n` +
    `📅 *Validade:* ${params.validDays} dias\n` +
    (params.notes ? `\n📋 *Condições:*\n${params.notes}` : "") +
    linkLine +
    `\n\nFico à disposição caso tenha qualquer dúvida. Podemos agendar a execução?`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildFollowUpWhatsAppUrl(params: {
  clientName: string;
  clientPhone: string;
  companyName: string;
  quoteNumber: number;
  title: string;
  total: number;
}): string {
  const phone = cleanPhone(params.clientPhone);
  const firstName = params.clientName.split(" ")[0];

  const message =
    `Olá, *${firstName}*! Tudo bem? 😊\n` +
    `Aqui é da *${params.companyName}*.\n\n` +
    `Estou passando rapidinho para saber se você conseguiu avaliar o *Orçamento #${params.quoteNumber}* (*${params.title}* - ${formatCurrency(params.total)}).\n\n` +
    `Ficou alguma dúvida sobre o serviço ou condições de pagamento? Se quiser, já consigo reservar um horário na agenda para você essa semana! 🔧👍`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const AI_TEMPLATES = [
  {
    category: "Ar-Condicionado",
    name: "Instalação de Split 9k/12k BTUs Completa",
    title: "Instalação de Ar-Condicionado Split + Material",
    items: [
      {
        description: "Mão de obra de instalação de Ar-Condicionado Split (com vácuo no sistema)",
        type: "SERVICE",
        quantity: 1,
        unitPrice: 450,
      },
      {
        description: "Kit tubulação de cobre até 3m + isolamento + cabo PP + suporte",
        type: "MATERIAL",
        quantity: 1,
        unitPrice: 250,
      },
    ],
  },
  {
    category: "Elétrica",
    name: "Troca de Quadro de Disjuntores (QDC)",
    title: "Substituição e Adequação de Quadro de Disjuntores",
    items: [
      {
        description: "Mão de obra para montagem de QDC com barramentos, DR e DPS",
        type: "SERVICE",
        quantity: 1,
        unitPrice: 650,
      },
      {
        description: "Kit Disjuntores DIN + Interruptor DR + DPS + Terminais tubulares",
        type: "MATERIAL",
        quantity: 1,
        unitPrice: 420,
      },
    ],
  },
  {
    category: "Pintura",
    name: "Pintura de Apartamento / Cômodo",
    title: "Serviço de Pintura Interna com Preparação de Parede",
    items: [
      {
        description: "Lixamento, correção com massa corrida e 2 demãos de tinta acrílica",
        type: "SERVICE",
        quantity: 60,
        unitPrice: 32,
      },
      {
        description: "Lata Tinta Acrílica Premium 18L + Massa + Lixas + Fita Crepe + Lona",
        type: "MATERIAL",
        quantity: 1,
        unitPrice: 540,
      },
    ],
  },
  {
    category: "Manutenção Geral",
    name: "Visita Técnica + Pequenos Reparos",
    title: "Manutenção Residencial / Comercial",
    items: [
      {
        description: "Diária técnica para reparos hidráulicos e elétricos diversos",
        type: "SERVICE",
        quantity: 1,
        unitPrice: 380,
      },
      {
        description: "Insumos básicos (veda rosca, buchas, parafusos, fita isolante)",
        type: "MATERIAL",
        quantity: 1,
        unitPrice: 65,
      },
    ],
  },
];
