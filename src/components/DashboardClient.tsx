"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  MessageCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Printer,
  Users,
  Sparkles,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  STATUS_CONFIG,
  buildFollowUpWhatsAppUrl,
  buildQuoteWhatsAppUrl,
} from "@/lib/whatsapp";

interface QuoteItemType {
  id: string;
  description: string;
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteType {
  id: string;
  number: number;
  title: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  validDays: number;
  followUpDate: string | null;
  followUpDone: boolean;
  notes: string;
  internalNotes: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
  items: QuoteItemType[];
}

interface DashboardClientProps {
  companyName: string;
  quotes: QuoteType[];
  clientsCount: number;
}

export default function DashboardClient({
  companyName,
  quotes: initialQuotes,
  clientsCount,
}: DashboardClientProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteType[]>(initialQuotes);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );

  // Orçamentos que precisam de retorno hoje ou estão atrasados
  const followUpAlerts = quotes.filter((q) => {
    if (q.status !== "SENT" && q.status !== "NEW") return false;
    if (q.followUpDone) return false;
    if (!q.followUpDate) return q.status === "SENT";
    return new Date(q.followUpDate) <= endOfToday;
  });

  // Indicadores financeiros
  const sentQuotes = quotes.filter(
    (q) => q.status === "SENT" || q.status === "NEW"
  );
  const openTotal = sentQuotes.reduce((acc, q) => acc + q.total, 0);

  const wonQuotes = quotes.filter(
    (q) => q.status === "APPROVED" || q.status === "COMPLETED"
  );
  const wonTotal = wonQuotes.reduce((acc, q) => acc + q.total, 0);

  const conversionRate =
    quotes.length > 0 ? Math.round((wonQuotes.length / quotes.length) * 100) : 0;

  async function handleQuickAction(
    quoteId: string,
    payload: Record<string, unknown>
  ) {
    setUpdatingId(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes((prev) =>
          prev.map((q) => (q.id === quoteId ? { ...q, ...data.quote } : q))
        );
        router.refresh();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function handlePostponeFollowUp(quoteId: string, days = 2) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    handleQuickAction(quoteId, {
      followUpDate: nextDate.toISOString(),
      followUpDone: false,
      lastContactAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho de boas-vindas e Ação Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Painel do Prestador
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Olá, {companyName}! 👋
          </h2>
          <p className="text-sm text-slate-500">
            Acompanhe seus pedidos do WhatsApp e não deixe nenhum orçamento
            esfriar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/clientes"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-slate-500" />
            Clientes ({clientsCount})
          </Link>
          <Link
            href="/orcamentos/novo"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Orçamento
          </Link>
        </div>
      </div>

      {/* RADAR DE RETORNO (FOLLOW-UP) - Principal diferencial do problema citado! */}
      <section className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Lembretes de Retorno (Follow-up)
                </h3>
                <span className="bg-amber-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {followUpAlerts.length} pendente{followUpAlerts.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Clientes que receberam orçamento ou pediram atenção e precisam
                do seu retorno hoje:
              </p>
            </div>
          </div>
        </div>

        {followUpAlerts.length === 0 ? (
          <div className="bg-white/80 rounded-xl p-6 text-center border border-amber-200/60">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              Parabéns! Você está em dia com todos os clientes hoje.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Quando enviar um novo orçamento, o OrçaAI agendará o lembrete
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {followUpAlerts.map((quote) => {
              const isOverdue =
                quote.followUpDate &&
                new Date(quote.followUpDate) <
                  new Date(now.getFullYear(), now.getMonth(), now.getDate());

              const followUpUrl = buildFollowUpWhatsAppUrl({
                clientName: quote.client.name,
                clientPhone: quote.client.phone,
                companyName,
                quoteNumber: quote.number,
                title: quote.title,
                total: quote.total,
              });

              const sendQuoteUrl = buildQuoteWhatsAppUrl({
                clientName: quote.client.name,
                clientPhone: quote.client.phone,
                companyName,
                quoteNumber: quote.number,
                title: quote.title,
                items: quote.items,
                subtotal: quote.subtotal,
                discount: quote.discount,
                total: quote.total,
                validDays: quote.validDays,
                notes: quote.notes,
              });

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          quote.status === "NEW"
                            ? "bg-slate-200 text-slate-800"
                            : isOverdue
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {quote.status === "NEW"
                          ? "Falta Enviar Orçamento!"
                          : isOverdue
                          ? `Retorno Atrasado (${formatDate(quote.followUpDate)})`
                          : "Retornar Hoje"}
                      </span>

                      <span className="font-extrabold text-sm text-slate-900">
                        {formatCurrency(quote.total)}
                      </span>
                    </div>

                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 text-sm sm:text-base line-clamp-1"
                    >
                      #{quote.number} — {quote.client.name}
                    </Link>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      🔧 {quote.title}
                    </p>

                    {quote.internalNotes && (
                      <p className="mt-2 text-xs bg-amber-50 border border-amber-200/70 text-amber-900 px-2.5 py-1.5 rounded-lg">
                        💡 <strong>Nota:</strong> {quote.internalNotes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {quote.status === "NEW" ? (
                      <a
                        href={sendQuoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          handleQuickAction(quote.id, { status: "SENT" })
                        }
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Enviar Orçamento no Zap
                      </a>
                    ) : (
                      <a
                        href={followUpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handlePostponeFollowUp(quote.id, 2)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Cobrar Retorno no WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={updatingId === quote.id}
                      onClick={() =>
                        handleQuickAction(quote.id, { status: "APPROVED" })
                      }
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-2.5 rounded-lg transition"
                      title="Marcar como Aprovado"
                    >
                      Aprovou! 🎉
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === quote.id}
                      onClick={() => handlePostponeFollowUp(quote.id, 2)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-2.5 rounded-lg flex items-center gap-1 transition"
                      title="Adiar lembrete por +2 dias"
                    >
                      <CalendarClock className="w-3.5 h-3.5" /> +2d
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Em Negociação / Abertos</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(openTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {sentQuotes.length} orçamento{sentQuotes.length === 1 ? "" : "s"}{" "}
            aguardando fechamento
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Serviços Fechados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {formatCurrency(wonTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {wonQuotes.length} serviço{wonQuotes.length === 1 ? "" : "s"}{" "}
            aprovado{wonQuotes.length === 1 ? "" : "s"} / concluído
            {wonQuotes.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Taxa de Aprovação</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {conversionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            De um total de {quotes.length} orçamentos criados
          </p>
        </div>
      </div>

      {/* Lista Rápida dos Últimos Orçamentos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Orçamentos Recentes
            </h3>
            <p className="text-xs text-slate-500">
              Clique em um orçamento para editar, mudar status ou gerar o PDF
            </p>
          </div>
          <Link
            href="/orcamentos"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver Todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {quotes.slice(0, 6).map((quote) => {
            const st = STATUS_CONFIG[quote.status] || STATUS_CONFIG.NEW;
            return (
              <div
                key={quote.id}
                className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">
                      #{quote.number}
                    </span>
                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 text-sm"
                    >
                      {quote.client.name}
                    </Link>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.badgeBg}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{quote.title}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <span className="block font-extrabold text-slate-900 text-sm">
                      {formatCurrency(quote.total)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {formatDate(quote.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/orcamentos/${quote.id}/imprimir`}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title="Imprimir / Salvar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
