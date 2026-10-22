"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Wrench,
  Package,
  QrCode,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

interface CatalogItem {
  id: string;
  description: string;
  type: string;
  unitPrice: number;
  unit: string;
}

interface CompanyData {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  specialty: string;
  pixKey: string;
  logoUrl: string;
  defaultValidDays: number;
  defaultFollowUpDays: number;
  defaultNotes: string;
  catalogItems: CatalogItem[];
}

export default function CompanySettingsClient({
  company: initialCompany,
}: {
  company: CompanyData;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialCompany.name);
  const [phone, setPhone] = useState(initialCompany.phone);
  const [document, setDocument] = useState(initialCompany.document);
  const [address, setAddress] = useState(initialCompany.address);
  const [specialty, setSpecialty] = useState(initialCompany.specialty);
  const [pixKey, setPixKey] = useState(initialCompany.pixKey || "");
  const [logoUrl, setLogoUrl] = useState(initialCompany.logoUrl || "");
  const [defaultValidDays, setDefaultValidDays] = useState(
    initialCompany.defaultValidDays
  );
  const [defaultFollowUpDays, setDefaultFollowUpDays] = useState(
    initialCompany.defaultFollowUpDays
  );
  const [defaultNotes, setDefaultNotes] = useState(initialCompany.defaultNotes);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Catálogo de Serviços / Materiais
  const [catalog, setCatalog] = useState<CatalogItem[]>(
    initialCompany.catalogItems
  );
  const [catDesc, setCatDesc] = useState("");
  const [catType, setCatType] = useState("SERVICE");
  const [catPrice, setCatPrice] = useState<number>(0);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(false);

    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          document,
          address,
          specialty,
          pixKey,
          logoUrl,
          defaultValidDays,
          defaultFollowUpDays,
          defaultNotes,
        }),
      });
      if (res.ok) {
        setSavedMsg(true);
        router.refresh();
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCatalog(e: React.FormEvent) {
    e.preventDefault();
    if (!catDesc.trim()) return;
    const res = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: catDesc,
        type: catType,
        unitPrice: catPrice,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCatalog((prev) => [data.item, ...prev]);
      setCatDesc("");
      setCatPrice(0);
      router.refresh();
    }
  }

  async function handleDeleteCatalog(id: string) {
    const res = await fetch(`/api/catalog?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCatalog((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Configurações da Minha Empresa, PIX & Catálogo
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Esses dados saem automaticamente no cabeçalho do seu PDF, no Link
          Público e nas mensagens de WhatsApp.
        </p>
      </div>

      {/* Formulário Dados da Empresa */}
      <form
        onSubmit={handleSaveCompany}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <h3 className="font-extrabold text-slate-900 text-base">
          1. Identificação do Profissional / Empresa
        </h3>

        {/* Upload de Logo e Chave PIX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Logotipo da Sua Empresa (Sai no PDF)
            </label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded-xl border border-slate-300 bg-white p-1 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 text-center p-1 shrink-0">
                  Sem Logo
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] text-rose-600 font-bold hover:underline"
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Sua Chave PIX (Para receber sinal / pagamento no orçamento)
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: 42.198.765/0001-10 ou seu celular/e-mail"
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white text-sm font-medium focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Aparece com botão &ldquo;Copiar Chave PIX&rdquo; no link do
              orçamento enviado ao cliente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Fantasia / Nome Profissional *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Especialidade / Ramo de Atuação
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Elétrica, Ar-Condicionado e Pintura"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              WhatsApp Comercial (com DDD)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              CPF ou CNPJ (Sai no PDF)
            </label>
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Endereço / Cidade de Atendimento
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Validade Padrão dos Orçamentos (dias)
            </label>
            <input
              type="number"
              min="1"
              value={defaultValidDays}
              onChange={(e) => setDefaultValidDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dias para Lembrete de Retorno (Follow-up)
            </label>
            <input
              type="number"
              min="1"
              value={defaultFollowUpDays}
              onChange={(e) => setDefaultFollowUpDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Texto Padrão de Pagamento e Garantia
          </label>
          <textarea
            rows={3}
            value={defaultNotes}
            onChange={(e) => setDefaultNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {savedMsg && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Dados da Empresa"}
          </button>
        </div>
      </form>

      {/* Catálogo de Serviços e Materiais Frequentes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">
            2. Meu Catálogo Rápido de Serviços e Materiais
          </h3>
          <p className="text-xs text-slate-500">
            Cadastre seus serviços e materiais mais comuns para inserir com 1
            clique ao montar orçamentos.
          </p>
        </div>

        <form
          onSubmit={handleAddCatalog}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-50 p-3.5 rounded-xl border border-slate-200"
        >
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tipo
            </label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
            >
              <option value="SERVICE">🔧 Mão de Obra / Serviço</option>
              <option value="MATERIAL">📦 Material / Peça</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nome do Serviço ou Material
            </label>
            <input
              type="text"
              required
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Ex: Instalação de Ventilador de Teto"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Preço Padrão (R$)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={catPrice}
              onChange={(e) => setCatPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </form>

        <div className="divide-y divide-slate-100">
          {catalog.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                {item.type === "MATERIAL" ? (
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  {item.description}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {formatCurrency(item.unitPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCatalog(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
