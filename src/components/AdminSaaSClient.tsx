"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  DollarSign,
  Plus,
  MessageCircle,
  Lock,
  Unlock,
  Clock,
  X,
} from "lucide-react";
import {
  cleanPhone,
  formatCurrency,
  formatDate,
  formatPhoneDisplay,
} from "@/lib/whatsapp";

interface SaaSCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  planStatus: string; // ACTIVE | TRIAL | BLOCKED
  monthlyFee: number;
  setupFee: number;
  dueDay: number;
  createdAt: string;
  _count: {
    clients: number;
    quotes: number;
  };
}

export default function AdminSaaSClient({
  initialCompanies,
}: {
  initialCompanies: SaaSCompany[];
}) {
  const router = useRouter();
  const [companies, setCompanies] = useState<SaaSCompany[]>(initialCompanies);
  const [showModal, setShowModal] = useState(false);

  // Novo Assinante (Implantação)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("Elétrica e Ar-Condicionado");
  const [password, setPassword] = useState("123456");
  const [setupFee, setSetupFee] = useState(297);
  const [monthlyFee, setMonthlyFee] = useState(97);
  const [dueDay, setDueDay] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeCompanies = companies.filter((c) => c.planStatus === "ACTIVE");
  const mrr = activeCompanies.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);
  const totalSetupRevenue = companies.reduce(
    (sum, c) => sum + (c.setupFee || 0),
    0
  );

  async function handleStatusChange(companyId: string, planStatus: string) {
    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: companyId, planStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? data.company : c))
      );
      router.refresh();
    }
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          specialty,
          password,
          setupFee,
          monthlyFee,
          dueDay,
          planStatus: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao cadastrar empresa.");
        setSaving(false);
        return;
      }

      setCompanies((prev) => [data.company, ...prev]);
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dono do SaaS */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/15 border border-blue-400/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Gestão Comercial do Seu SaaS
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2">
            Painel de Assinantes, Implantação & Mensalidades
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Controle as empresas que contratam o OrçaAI, cobre mensalidades pelo
            WhatsApp e libere/bloqueie acessos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 shrink-0 transition"
        >
          <Plus className="w-4 h-4" />
          Implantar Nova Empresa
        </button>
      </div>

      {/* Indicadores Financeiros do SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Receita Recorrente (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {formatCurrency(mrr)}/mês
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {activeCompanies.length} empresa(s) pagando mensalidade ativa
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Receita de Implantações</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(totalSetupRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total acumulado de taxa de implantação inicial
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Total de Empresas no SaaS</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {companies.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {companies.filter((c) => c.planStatus === "TRIAL").length} em teste
            • {companies.filter((c) => c.planStatus === "BLOCKED").length}{" "}
            bloqueada(s)
          </p>
        </div>
      </div>

      {/* Lista de Empresas Assinantes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base">
            Empresas Cadastradas ({companies.length})
          </h3>
          <p className="text-xs text-slate-500">
            Gerencie o status da assinatura e envie lembrete da mensalidade de
            suporte/hospedagem pelo WhatsApp.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {companies.map((company) => {
            const billingZapUrl = `https://wa.me/${cleanPhone(
              company.phone
            )}?text=${encodeURIComponent(
              `Olá, *${company.name}*! Tudo bem? 😊\nPassando para lembrar do vencimento da sua mensalidade de suporte e hospedagem do sistema *OrçaAI* (dia ${
                company.dueDay
              }, valor *${formatCurrency(
                company.monthlyFee
              )}*).\n\nQualquer dúvida ou suporte que precisar na plataforma, estamos à disposição!`
            )}`;

            return (
              <div
                key={company.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-base">
                      {company.name}
                    </span>

                    {company.planStatus === "ACTIVE" && (
                      <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Assinatura Ativa
                      </span>
                    )}
                    {company.planStatus === "TRIAL" && (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Período de Teste
                      </span>
                    )}
                    {company.planStatus === "BLOCKED" && (
                      <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Bloqueado (Inadimplente)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    {company.specialty} • Login:{" "}
                    <strong>{company.email}</strong> • WhatsApp:{" "}
                    {formatPhoneDisplay(company.phone)}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                    <span>
                      Implantação:{" "}
                      <strong>{formatCurrency(company.setupFee)}</strong>
                    </span>
                    <span>
                      Mensalidade:{" "}
                      <strong className="text-emerald-700">
                        {formatCurrency(company.monthlyFee)}/mês
                      </strong>{" "}
                      (Venc. dia {company.dueDay})
                    </span>
                    <span>
                      Uso: {company._count?.clients || 0} clientes /{" "}
                      {company._count?.quotes || 0} orçamentos
                    </span>
                    <span>Desde {formatDate(company.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {company.phone && (
                    <a
                      href={billingZapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Cobrar Mensalidade
                    </a>
                  )}

                  <select
                    value={company.planStatus}
                    onChange={(e) =>
                      handleStatusChange(company.id, e.target.value)
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="ACTIVE">✅ Ativo (Em dia)</option>
                    <option value="TRIAL">⏳ Em Teste (Trial)</option>
                    <option value="BLOCKED">🔒 Bloqueado (Atraso)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Implantação de Nova Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Implantar Nova Empresa (Novo Cliente SaaS)
                </h3>
                <p className="text-xs text-slate-500">
                  Crie a conta pronta para entregar ao seu cliente e defina a
                  mensalidade.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Empresa / Prestador *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Oliveira Instalações & Ar"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha Inicial *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp do Profissional
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taxa Implantação (R$)
                  </label>
                  <input
                    type="number"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                >
                  {saving ? "Criando..." : "Criar Conta do Assinante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
