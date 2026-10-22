"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Calendar,
  FileCheck,
  Wrench,
  Package,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { AI_TEMPLATES, formatCurrency } from "@/lib/whatsapp";

interface ClientOption {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface CatalogOption {
  id: string;
  description: string;
  type: string;
  unitPrice: number;
}

interface FormItem {
  description: string;
  type: "SERVICE" | "MATERIAL";
  quantity: number;
  unitPrice: number;
}

interface InitialQuoteData {
  clientId?: string;
  title: string;
  discount: number;
  validDays: number;
  notes: string;
  items: FormItem[];
}

export default function NewQuoteForm({
  clients,
  catalogItems,
  preselectedClientId,
  initialQuoteData,
  defaultValidDays,
  defaultFollowUpDays,
  defaultNotes,
}: {
  clients: ClientOption[];
  catalogItems: CatalogOption[];
  preselectedClientId?: string;
  initialQuoteData?: InitialQuoteData;
  defaultValidDays: number;
  defaultFollowUpDays: number;
  defaultNotes: string;
}) {
  const router = useRouter();

  const [clientMode, setClientMode] = useState<"existing" | "new">(
    clients.length > 0 ? "existing" : "new"
  );
  const [selectedClientId, setSelectedClientId] = useState(
    initialQuoteData?.clientId ||
      preselectedClientId ||
      (clients[0]?.id ?? "")
  );

  // Dados para novo cliente rápido
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  // Assistente OrçaAI Mágico (Texto Livre -> Orçamento)
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const [title, setTitle] = useState(initialQuoteData?.title || "");
  const [items, setItems] = useState<FormItem[]>(
    initialQuoteData?.items && initialQuoteData.items.length > 0
      ? initialQuoteData.items
      : [{ description: "", type: "SERVICE", quantity: 1, unitPrice: 0 }]
  );
  const [discount, setDiscount] = useState<number>(
    initialQuoteData?.discount || 0
  );
  const [validDays, setValidDays] = useState<number>(
    initialQuoteData?.validDays || defaultValidDays || 7
  );

  // Data padrão de follow-up (hoje + defaultFollowUpDays)
  const defaultFollowUp = new Date();
  defaultFollowUp.setDate(
    defaultFollowUp.getDate() + (defaultFollowUpDays || 2)
  );
  const [followUpDate, setFollowUpDate] = useState(
    defaultFollowUp.toISOString().split("T")[0]
  );

  const [notes, setNotes] = useState(
    initialQuoteData?.notes || defaultNotes || ""
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  async function handleAiParse() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiSuccessMsg("");
    setError("");

    try {
      const res = await fetch("/api/ai/parse-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível interpretar o texto.");
        return;
      }

      if (data.title) setTitle(data.title);
      if (data.items && data.items.length > 0) setItems(data.items);
      if (data.discount !== undefined) setDiscount(data.discount);

      // Se identificou cliente no texto, verifica se já existe ou muda para aba "Novo Cliente"
      if (data.clientName || data.clientPhone) {
        const matched = clients.find(
          (c) =>
            (data.clientName &&
              c.name.toLowerCase().includes(data.clientName.toLowerCase())) ||
            (data.clientPhone && c.phone.includes(data.clientPhone))
        );

        if (matched) {
          setClientMode("existing");
          setSelectedClientId(matched.id);
        } else if (data.clientName && data.clientPhone) {
          setClientMode("new");
          setNewClientName(data.clientName);
          setNewClientPhone(data.clientPhone);
          if (data.clientAddress) setNewClientAddress(data.clientAddress);
        }
      }

      setAiSuccessMsg(
        "Orçamento preenchido automaticamente pela IA! Confira os itens abaixo."
      );
    } catch {
      setError("Erro ao processar texto com o OrçaAI.");
    } finally {
      setAiLoading(false);
    }
  }

  function applyTemplate(tpl: (typeof AI_TEMPLATES)[number]) {
    setTitle(tpl.title);
    setItems(
      tpl.items.map((i) => ({
        description: i.description,
        type: i.type as "SERVICE" | "MATERIAL",
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }))
    );
  }

  function addCatalogItem(cat: CatalogOption) {
    setItems((prev) => {
      const cleanPrev =
        prev.length === 1 && !prev[0].description && prev[0].unitPrice === 0
          ? []
          : prev;
      return [
        ...cleanPrev,
        {
          description: cat.description,
          type: (cat.type as "SERVICE" | "MATERIAL") || "SERVICE",
          quantity: 1,
          unitPrice: cat.unitPrice,
        },
      ];
    });
  }

  function updateItem(index: number, field: keyof FormItem, value: unknown) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addBlankItem(type: "SERVICE" | "MATERIAL" = "SERVICE") {
    setItems((prev) => [
      ...prev,
      { description: "", type, quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validItems = items.filter((i) => i.description.trim() !== "");
    if (!title.trim() || validItems.length === 0) {
      setError("Preencha o título do serviço e pelo menos 1 item com descrição.");
      return;
    }

    if (clientMode === "existing" && !selectedClientId) {
      setError("Selecione um cliente.");
      return;
    }

    if (
      clientMode === "new" &&
      (!newClientName.trim() || !newClientPhone.trim())
    ) {
      setError("Informe o nome e WhatsApp do novo cliente.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientMode === "existing" ? selectedClientId : undefined,
          newClient:
            clientMode === "new"
              ? {
                  name: newClientName,
                  phone: newClientPhone,
                  address: newClientAddress,
                }
              : undefined,
          title,
          status: "NEW",
          discount,
          validDays,
          followUpDate,
          notes,
          internalNotes,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar orçamento.");
        setSaving(false);
        return;
      }

      router.push(`/orcamentos/${data.quote.id}`);
      router.refresh();
    } catch {
      setError("Erro de conexão ao salvar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {initialQuoteData
              ? "Duplicar Orçamento"
              : "Criar Novo Orçamento Rápido"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Use o Assistente OrçaAI ou escolha um modelo para montar o orçamento
            em segundos.
          </p>
        </div>
      </div>

      {/* NOVO: ORÇAAI MÁGICO (Texto Livre -> Orçamento Estruturado) */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-blue-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 block">
                OrçaAI Mágico — Gerador por Texto / Áudio do WhatsApp
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Digite ou fale tudo junto e o OrçaAI monta a tabela sozinho!
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setAiPrompt(
                "Para Dona Helena 11988776655 na Rua Augusta 450: instalar 2 ventiladores de teto 160 cada, trocar chuveiro 90 reais, 180 de cabo elétrico e disjuntor, desconto de 30"
              )
            }
            className="text-[11px] font-bold text-blue-300 hover:text-white underline text-left sm:text-right"
          >
            Testar com exemplo pronto
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <textarea
            rows={2}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: Para Carlos 11988887777 na Rua das Flores 120: instalar 2 ar split 450 cada, 2 kit tubulação de cobre 240 cada, puxar ponto 220v 180 reais, desconto de 50"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={handleAiParse}
            disabled={aiLoading || !aiPrompt.trim()}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 shrink-0 transition"
          >
            <Wand2 className="w-4 h-4" />
            {aiLoading ? "Interpretando..." : "Montar com IA"}
          </button>
        </div>

        {aiSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {aiSuccessMsg}
          </div>
        )}

        {/* Modelos Rápidos de 1 Clique */}
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-semibold block mb-2">
            Ou escolha um modelo pronto por categoria (1 Clique):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {AI_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-400 transition group"
              >
                <span className="text-[10px] font-bold uppercase text-blue-300 block">
                  {tpl.category}
                </span>
                <span className="font-bold text-xs text-white mt-0.5 block">
                  {tpl.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {catalogItems.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              Adicionar item do seu catálogo:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {catalogItems.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addCatalogItem(cat)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-blue-400" />
                  {cat.description} ({formatCurrency(cat.unitPrice)})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Passo 1: Cliente */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            1. Dados do Cliente
          </h3>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setClientMode("existing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                clientMode === "existing"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Cliente Cadastrado
            </button>
            <button
              type="button"
              onClick={() => setClientMode("new")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                clientMode === "new"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
            </button>
          </div>
        </div>

        {clientMode === "existing" ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Selecione o cliente *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — WhatsApp: {c.phone}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp (com DDD) *
              </label>
              <input
                type="text"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Ex: 11988887777"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço / Bairro
              </label>
              <input
                type="text"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                placeholder="Ex: Av. Brasil, 500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Passo 2: Título e Itens do Orçamento */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
          2. Descrição do Serviço e Valores
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Título Resumido do Orçamento *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Instalação de 2 Ar-Condicionados Split + Elétrica"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Itens do Orçamento (Mão de Obra e Materiais)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addBlankItem("SERVICE")}
                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" /> + Serviço
              </button>
              <button
                type="button"
                onClick={() => addBlankItem("MATERIAL")}
                className="text-xs font-bold text-amber-700 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Package className="w-3.5 h-3.5" /> + Material
              </button>
            </div>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tipo
                </label>
                <select
                  value={item.type}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      "type",
                      e.target.value as "SERVICE" | "MATERIAL"
                    )
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="SERVICE">🔧 Serviço</option>
                  <option value="MATERIAL">📦 Material</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Descrição do Item
                </label>
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                  placeholder="Ex: Instalação de Split 12.000 BTUs"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:col-span-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Qtd
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Valor Unit. (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, "unitPrice", Number(e.target.value))
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 flex items-center justify-between sm:justify-end">
                <span className="sm:hidden text-xs font-bold text-slate-600">
                  Subtotal:{" "}
                  {formatCurrency(
                    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo de Valores e Desconto */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-36 px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Validade (dias)
              </label>
              <input
                type="number"
                min="1"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-right">
            <span className="text-xs text-slate-400 block">
              Total do Orçamento
            </span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Passo 3: Agendamento de Follow-up e Observações */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          3. Lembrete de Retorno (Follow-up) e Condições
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data para o OrçaAI te lembrar de retornar o cliente
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-sm font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              O cliente aparecerá no painel de alertas nessa data caso ainda não
              tenha aprovado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Anotação Interna (Só você vê)
            </label>
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Ex: Cliente pediu desconto à vista / Ligar após 14h"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Condições de Pagamento e Garantia (Sai no PDF e WhatsApp)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition"
        >
          <FileCheck className="w-5 h-5" />
          {saving
            ? "Gerando Orçamento..."
            : "Salvar e Preparar Envio no WhatsApp"}
        </button>
      </div>
    </form>
  );
}
