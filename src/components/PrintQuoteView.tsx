"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ThumbsUp,
} from "lucide-react";
import {
  cleanPhone,
  formatCurrency,
  formatDate,
  formatPhoneDisplay,
} from "@/lib/whatsapp";

interface PrintQuoteProps {
  quote: {
    id: string;
    number: number;
    title: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    validDays: number;
    notes: string;
    createdAt: string;
    client: {
      name: string;
      phone: string;
      address: string;
      email: string;
    };
    company: {
      name: string;
      phone: string;
      email: string;
      document: string;
      address: string;
      specialty: string;
      pixKey?: string;
      logoUrl?: string;
    };
    items: {
      id: string;
      description: string;
      type: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  };
}

export default function PrintQuoteView({ quote }: PrintQuoteProps) {
  const [status, setStatus] = useState(quote.status);
  const [approving, setApproving] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const createdDate = new Date(quote.createdAt);
  const validUntil = new Date(createdDate);
  validUntil.setDate(validUntil.getDate() + (quote.validDays || 7));

  const isApproved = status === "APPROVED" || status === "COMPLETED";

  const approveWhatsAppUrl = `https://wa.me/${cleanPhone(
    quote.company.phone
  )}?text=${encodeURIComponent(
    `Olá, ${quote.company.name}! Acabei de APROVAR online o Orçamento #${quote.number} (${quote.title}) no valor de ${formatCurrency(
      quote.total
    )}. Podemos combinar o agendamento?`
  )}`;

  async function handleOneClickApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("APPROVED");
      }
    } finally {
      setApproving(false);
    }
  }

  function handleCopyPix() {
    if (!quote.company.pixKey) return;
    navigator.clipboard.writeText(quote.company.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      {/* Barra de controles (oculta na impressão) */}
      <div className="no-print max-w-4xl mx-auto mb-5 bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href={`/orcamentos/${quote.id}`}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Painel
          </Link>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Esta é a página pública e de PDF do orçamento.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isApproved ? (
            <button
              type="button"
              onClick={handleOneClickApprove}
              disabled={approving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
            >
              <ThumbsUp className="w-4 h-4" />
              {approving
                ? "Aprovando..."
                : "Aprovar Orçamento Agora (1 Clique)"}
            </button>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Orçamento Aprovado!
            </span>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Banner de Confirmação quando o cliente aprova online */}
      {isApproved && (
        <div className="no-print max-w-4xl mx-auto mb-5 bg-emerald-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-white shrink-0" />
            <div>
              <h3 className="font-extrabold text-base">
                Orçamento #{quote.number} Aprovado com Sucesso! 🎉
              </h3>
              <p className="text-xs text-emerald-100">
                O prestador ({quote.company.name}) já recebeu a confirmação no
                painel.
              </p>
            </div>
          </div>

          {quote.company.phone && (
            <a
              href={approveWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow"
            >
              <MessageCircle className="w-4 h-4" />
              Avisar no WhatsApp e Agendar
            </a>
          )}
        </div>
      )}

      {/* Folha A4 do Orçamento */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl print:shadow-none print:rounded-none p-6 sm:p-10 border border-slate-200 print:border-none">
        {/* Cabeçalho da Empresa Prestadora */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div className="flex items-start gap-4">
            {quote.company.logoUrl && (
              <img
                src={quote.company.logoUrl}
                alt={quote.company.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl border border-slate-200 p-1 bg-white shrink-0"
              />
            )}
            <div>
              <div className="inline-block bg-blue-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider mb-2">
                {quote.company.specialty || "Proposta Comercial"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {quote.company.name}
              </h1>
              <div className="mt-1.5 text-xs text-slate-600 space-y-0.5">
                {quote.company.document && (
                  <p>CPF/CNPJ: {quote.company.document}</p>
                )}
                {quote.company.phone && (
                  <p>WhatsApp: {formatPhoneDisplay(quote.company.phone)}</p>
                )}
                {quote.company.email && <p>E-mail: {quote.company.email}</p>}
                {quote.company.address && <p>{quote.company.address}</p>}
              </div>
            </div>
          </div>

          <div className="sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-400 block">
              Orçamento Nº
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              #{quote.number}
            </span>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>
                <strong>Emissão:</strong> {formatDate(createdDate)}
              </p>
              <p>
                <strong>Válido até:</strong> {formatDate(validUntil)} (
                {quote.validDays} dias)
              </p>
            </div>
          </div>
        </div>

        {/* Dados do Cliente e Serviço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
              Cliente / Contratante
            </span>
            <p className="font-extrabold text-slate-900 text-base">
              {quote.client.name}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              WhatsApp: {formatPhoneDisplay(quote.client.phone)}
            </p>
            {quote.client.address && (
              <p className="text-xs text-slate-600 mt-0.5">
                Local: {quote.client.address}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
            <span className="text-[11px] font-bold uppercase text-blue-600 block mb-1">
              Referência do Serviço
            </span>
            <p className="font-extrabold text-slate-900 text-base">
              {quote.title}
            </p>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {isApproved
                ? "Status: APROVADO PELO CLIENTE"
                : "Orçamento detalhado de serviços e materiais"}
            </p>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] font-extrabold uppercase text-slate-500">
                <th className="py-3 pr-3">Item / Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-center">Qtd</th>
                <th className="py-3 px-3 text-right">Vlr. Unit.</th>
                <th className="py-3 pl-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {quote.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {index + 1}. {item.description}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-500">
                    {item.type === "MATERIAL" ? "Material" : "Mão de Obra"}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3.5 pl-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mt-6 pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Documento gerado digitalmente via sistema <strong>OrçaAI</strong>.
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {formatCurrency(quote.subtotal)}
              </span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Desconto:</span>
                <span className="font-semibold">
                  - {formatCurrency(quote.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>TOTAL:</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Condições de Pagamento + Quadro Chave PIX */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4">
          {quote.notes && (
            <div
              className={`${
                quote.company.pixKey ? "md:col-span-7" : "md:col-span-12"
              } p-4 rounded-xl bg-slate-50 border border-slate-200`}
            >
              <h3 className="text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                Condições de Pagamento, Prazo e Garantia
              </h3>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {quote.notes}
              </p>
            </div>
          )}

          {quote.company.pixKey && (
            <div
              className={`${
                quote.notes ? "md:col-span-5" : "md:col-span-12"
              } p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between gap-2`}
            >
              <div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs uppercase">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Pagamento Rápido via PIX
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Chave PIX oficial de <strong>{quote.company.name}</strong>:
                </p>
                <p className="mt-1.5 font-mono font-bold text-xs text-slate-900 bg-white px-3 py-2 rounded-lg border border-emerald-200 break-all">
                  {quote.company.pixKey}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyPix}
                className="no-print w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Chave PIX Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar Chave PIX
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Botão de Aprovação no Rodapé para o Cliente (Mobile-friendly) */}
        {!isApproved && (
          <div className="no-print mt-8 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Deseja aprovar este orçamento agora?
              </h4>
              <p className="text-xs text-slate-300">
                Clique no botão ao lado para confirmar sua aprovação para{" "}
                {quote.company.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOneClickApprove}
              disabled={approving}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-lg transition"
            >
              <ThumbsUp className="w-4 h-4" />
              {approving ? "Confirmando..." : "Aprovar Orçamento (1 Clique)"}
            </button>
          </div>
        )}

        {/* Assinaturas */}
        <div className="mt-14 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-10 text-center text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-2">
            <strong className="text-slate-900 block">
              {quote.company.name}
            </strong>
            <span>Responsável Técnico / Prestador</span>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <strong className="text-slate-900 block">
              {quote.client.name}
            </strong>
            <span>
              {isApproved
                ? "✅ Aprovado Digitalmente pelo Cliente"
                : "De acordo / Aprovação do Cliente"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
