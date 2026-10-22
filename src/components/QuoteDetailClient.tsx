"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Printer,
  ArrowLeft,
  CheckCircle2,
  CalendarClock,
  Phone,
  MapPin,
  Wrench,
  Package,
  Copy,
  Check,
  BellRing,
  Edit3,
  Files,
  Trash2,
  Save,
  X,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPhoneDisplay,
  STATUS_CONFIG,
  buildQuoteWhatsAppUrl,
  buildFollowUpWhatsAppUrl,
} from "@/lib/whatsapp";

interface QuoteItem {
  id?: string;
  description: string;
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteDetailProps {
  quote: {
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
      email: string;
      address: string;
    };
    company: {
      id: string;
      name: string;
      phone: string;
      document: string;
      address: string;
      specialty: string;
      pixKey?: string;
      logoUrl?: string;
    };
    items: QuoteItem[];
  };
}

export default function QuoteDetailClient({
  quote: initialQuote,
}: QuoteDetailProps) {
  const router = useRouter();
  const [quote, setQuote] = useState(initialQuote);
  const [copied, setCopied] = useState(false);
  const [followUpInput, setFollowUpInput] = useState(
    initialQuote.followUpDate
      ? initialQuote.followUpDate.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [internalNotes, setInternalNotes] = useState(
    initialQuote.internalNotes || ""
  );
  const [savingNotes, setSavingNotes] = useState(false);

  // Modo de edição completa do orçamento
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialQuote.title);
  const [editDiscount, setEditDiscount] = useState(initialQuote.discount);
  const [editNotes, setEditNotes] = useState(initialQuote.notes);
  const [editItems, setEditItems] = useState<QuoteItem[]>(initialQuote.items);
  const [savingEdit, setSavingEdit] = useState(false);

  const st = STATUS_CONFIG[quote.status] || STATUS_CONFIG.NEW;

  const publicPrintUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/orcamentos/${quote.id}/imprimir`
      : "";

  const zapSendUrl = buildQuoteWhatsAppUrl({
    clientName: quote.client.name,
    clientPhone: quote.client.phone,
    companyName: quote.company.name,
    quoteNumber: quote.number,
    title: quote.title,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    total: quote.total,
    validDays: quote.validDays,
    notes: quote.notes,
    publicUrl: publicPrintUrl,
  });

  const zapFollowUpUrl = buildFollowUpWhatsAppUrl({
    clientName: quote.client.name,
    clientPhone: quote.client.phone,
    companyName: quote.company.name,
    quoteNumber: quote.number,
    title: quote.title,
    total: quote.total,
  });

  async function updateQuote(payload: Record<string, unknown>) {
    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setQuote((prev) => ({ ...prev, ...data.quote }));
      router.refresh();
    }
  }

  function handleCopyPublicLink() {
    if (!publicPrintUrl) return;
    navigator.clipboard.writeText(publicPrintUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSaveInternalNotes() {
    setSavingNotes(true);
    await updateQuote({
      internalNotes,
      followUpDate: followUpInput,
      followUpDone: false,
    });
    setSavingNotes(false);
  }

  function handleEditItemChange(
    idx: number,
    field: keyof QuoteItem,
    val: unknown
  ) {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, [field]: val };
        next.total = (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0);
        return next;
      })
    );
  }

  function handleAddEditItem(type: "SERVICE" | "MATERIAL") {
    setEditItems((prev) => [
      ...prev,
      { description: "", type, quantity: 1, unitPrice: 0, total: 0 },
    ]);
  }

  function handleRemoveEditItem(idx: number) {
    if (editItems.length <= 1) return;
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveFullEdit(e: React.FormEvent) {
    e.preventDefault();
    const valid = editItems.filter((i) => i.description.trim() !== "");
    if (!editTitle.trim() || valid.length === 0) return;

    setSavingEdit(true);
    await updateQuote({
      title: editTitle,
      discount: editDiscount,
      notes: editNotes,
      items: valid,
    });
    setSavingEdit(false);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/orcamentos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Orçamentos
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditTitle(quote.title);
              setEditDiscount(quote.discount);
              setEditNotes(quote.notes);
              setEditItems(quote.items);
              setIsEditing(!isEditing);
            }}
            className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "Cancelar Edição" : "Editar Itens / Valores"}
          </button>

          <Link
            href={`/orcamentos/novo?duplicateId=${quote.id}`}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Files className="w-3.5 h-3.5" />
            Duplicar Orçamento
          </Link>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar Link do Cliente
              </>
            )}
          </button>

          <Link
            href={`/orcamentos/${quote.id}/imprimir`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Visualizar PDF / Link Público
          </Link>
        </div>
      </div>

      {/* Formulário de Edição Rápida de Itens / Valores */}
      {isEditing && (
        <form
          onSubmit={handleSaveFullEdit}
          className="bg-blue-50/60 border-2 border-blue-300 rounded-2xl p-5 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              Editando Orçamento #{quote.number}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título do Serviço
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Itens e Preços
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddEditItem("SERVICE")}
                  className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg"
                >
                  + Serviço
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEditItem("MATERIAL")}
                  className="text-xs font-bold bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg"
                >
                  + Material
                </button>
              </div>
            </div>

            {editItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end"
              >
                <div className="sm:col-span-2">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      handleEditItemChange(idx, "type", e.target.value)
                    }
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  >
                    <option value="SERVICE">🔧 Serviço</option>
                    <option value="MATERIAL">📦 Material</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) =>
                      handleEditItemChange(idx, "description", e.target.value)
                    }
                    placeholder="Descrição do item"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:col-span-4 gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleEditItemChange(
                        idx,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleEditItemChange(
                        idx,
                        "unitPrice",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveEditItem(idx)}
                    disabled={editItems.length <= 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={editDiscount}
                onChange={(e) => setEditDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Condições de Pagamento / Garantia
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              {savingEdit ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      )}

      {/* Card Principal de Disparo WhatsApp e Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                ORÇAMENTO #{quote.number}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${st.badgeBg}`}
              >
                {st.label}
              </span>
              <span className="text-xs text-slate-400">
                Criado em {formatDate(quote.createdAt)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {quote.title}
            </h2>
          </div>

          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl md:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
              Valor Total
            </span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {formatCurrency(quote.total)}
            </span>
          </div>
        </div>

        {/* Botões de Ação Principal (WhatsApp + Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={zapSendUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (quote.status === "NEW") {
                updateQuote({ status: "SENT" });
              }
            }}
            className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar Orçamento Completo no WhatsApp
          </a>

          <a
            href={zapFollowUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const next = new Date();
              next.setDate(next.getDate() + 2);
              updateQuote({
                lastContactAt: new Date().toISOString(),
                followUpDate: next.toISOString(),
              });
            }}
            className="py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <BellRing className="w-5 h-5" />
            Cobrar Retorno (Follow-up Gentil no Zap)
          </a>
        </div>

        {/* Régua de Status Rápida */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-500 block mb-2">
            Alterar Status do Serviço (1 Clique):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(["NEW", "SENT", "APPROVED", "COMPLETED", "REJECTED"] as const).map(
              (key) => {
                const cfg = STATUS_CONFIG[key];
                const active = quote.status === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateQuote({ status: key })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      active
                        ? `${cfg.badgeBg} border-slate-900 ring-2 ring-slate-900/10`
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Grid Cliente + Follow-up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
            Dados do Cliente
          </h3>
          <p className="font-extrabold text-lg text-slate-900">
            {quote.client.name}
          </p>
          <p className="text-sm text-slate-700 flex items-center gap-2 font-medium">
            <Phone className="w-4 h-4 text-emerald-600" />
            {formatPhoneDisplay(quote.client.phone)}
          </p>
          {quote.client.address && (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              {quote.client.address}
            </p>
          )}
        </div>

        {/* Controle de Lembrete / Follow-up */}
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              Agenda de Retorno (Follow-up)
            </h3>
            {quote.followUpDone ? (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Concluído
              </span>
            ) : (
              <span className="text-[11px] bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                Ativo
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Data do Lembrete
              </label>
              <input
                type="date"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Anotação Interna
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ex: Ligar sexta-feira"
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveInternalNotes}
              disabled={savingNotes}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
            >
              {savingNotes ? "Salvando..." : "Atualizar Lembrete"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Itens do Orçamento */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base">
            Itens do Orçamento ({quote.items.length})
          </h3>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar itens
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {quote.items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "MATERIAL"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {item.type === "MATERIAL" ? (
                    <Package className="w-4 h-4" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.type === "MATERIAL" ? "Material" : "Mão de Obra / Serviço"}{" "}
                    • {item.quantity}x de {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>

              <span className="font-extrabold text-slate-900 text-sm whitespace-nowrap">
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Desconto Aplicado:</span>
              <span className="font-semibold">
                - {formatCurrency(quote.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Final:</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Condições e Observações */}
      {quote.notes && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2">
            Condições de Pagamento e Garantia
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line">
            {quote.notes}
          </p>
        </div>
      )}
    </div>
  );
}
