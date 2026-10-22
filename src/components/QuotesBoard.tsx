"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  MessageCircle,
  Printer,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  STATUS_CONFIG,
  buildQuoteWhatsAppUrl,
  buildFollowUpWhatsAppUrl,
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

export default function QuotesBoard({
  companyName,
  initialQuotes,
}: {
  companyName: string;
  initialQuotes: QuoteType[];
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteType[]>(initialQuotes);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const tabs = [
    { key: "ALL", label: "Todos" },
    { key: "NEW", label: "Novos / Rascunho" },
    { key: "SENT", label: "Enviados" },
    { key: "APPROVED", label: "Aprovados" },
    { key: "COMPLETED", label: "Concluídos" },
    { key: "REJECTED", label: "Perdidos" },
  ];

  const filtered = quotes.filter((q) => {
    if (statusFilter !== "ALL" && q.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        q.title.toLowerCase().includes(term) ||
        q.client.name.toLowerCase().includes(term) ||
        String(q.number).includes(term)
      );
    }
    return true;
  });

  async function handleStatusChange(quoteId: string, newStatus: string) {
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, ...data.quote } : q))
      );
      router.refresh();
    }
  }

  async function handleDelete(quoteId: string) {
    if (!confirm("Deseja excluir este orçamento?")) return;
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Orçamentos & Status dos Serviços
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie seus orçamentos, envie no WhatsApp e acompanhe o status de
            cada serviço.
          </p>
        </div>

        <Link
          href="/orcamentos/novo"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Criar Orçamento
        </Link>
      </div>

      {/* Abas de Status + Busca */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const count =
              tab.key === "ALL"
                ? quotes.length
                : quotes.filter((q) => q.status === tab.key).length;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, número ou serviço..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Cards de Orçamentos */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">
            Nenhum orçamento encontrado neste filtro
          </p>
          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            <PlusCircle className="w-4 h-4" /> Criar Novo Orçamento
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((quote) => {
            const st = STATUS_CONFIG[quote.status] || STATUS_CONFIG.NEW;

            const zapQuoteUrl = buildQuoteWhatsAppUrl({
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

            const zapFollowUpUrl = buildFollowUpWhatsAppUrl({
              clientName: quote.client.name,
              clientPhone: quote.client.phone,
              companyName,
              quoteNumber: quote.number,
              title: quote.title,
              total: quote.total,
            });

            return (
              <div
                key={quote.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                      #{quote.number}
                    </span>
                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="font-extrabold text-slate-900 hover:text-blue-600 text-base"
                    >
                      {quote.client.name}
                    </Link>

                    {/* Seletor rápido de Status */}
                    <select
                      value={quote.status}
                      onChange={(e) =>
                        handleStatusChange(quote.id, e.target.value)
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${st.badgeBg} ${st.border}`}
                    >
                      <option value="NEW">Novo / Rascunho</option>
                      <option value="SENT">Orçamento Enviado</option>
                      <option value="APPROVED">Aprovado</option>
                      <option value="COMPLETED">Concluído</option>
                      <option value="REJECTED">Perdido / Recusado</option>
                    </select>
                  </div>

                  <Link
                    href={`/orcamentos/${quote.id}`}
                    className="block text-sm font-semibold text-slate-700 hover:text-blue-600"
                  >
                    🔧 {quote.title}
                  </Link>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                    <span>Criado em {formatDate(quote.createdAt)}</span>
                    {quote.followUpDate && !quote.followUpDone && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        Retornar em: {formatDate(quote.followUpDate)}
                      </span>
                    )}
                    <span>{quote.items.length} iten(s)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="sm:text-right mr-2">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">
                      Valor Total
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={zapQuoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (quote.status === "NEW") {
                          handleStatusChange(quote.id, "SENT");
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Enviar Zap
                    </a>

                    {quote.status === "SENT" && (
                      <a
                        href={zapFollowUpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        Cobrar Retorno
                      </a>
                    )}

                    <Link
                      href={`/orcamentos/${quote.id}/imprimir`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                      title="Imprimir / Gerar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                    >
                      Detalhes
                    </Link>

                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
