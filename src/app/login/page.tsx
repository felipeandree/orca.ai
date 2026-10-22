"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageCircle,
  BellRing,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("Elétrica e Ar-Condicionado");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          specialty,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao autenticar.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "contato@silvaeletrica.com.br",
          password: "123456",
        }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Conta demo não encontrada. Rode o seed do banco.");
        setLoading(false);
      }
    } catch {
      setError("Erro ao entrar na conta demo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      {/* Coluna de apresentação do SaaS */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight">
                Orça<span className="text-blue-400">AI</span>
              </span>
              <span className="block text-xs text-slate-400">
                Sistema de Orçamentos & Follow-up Inteligente
              </span>
            </div>
          </div>

          <h1 className="mt-10 text-3xl lg:text-4xl font-extrabold leading-tight">
            Envie orçamentos em{" "}
            <span className="text-blue-400">30 segundos</span> no WhatsApp e
            nunca mais esqueça de retornar um cliente.
          </h1>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            Feito sob medida para instaladores, eletricistas, pintores, técnicos
            de refrigeração e empresas de manutenção.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5 bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">
                  Modelos Prontos + PDF Profissional
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Separe Mão de Obra e Materiais, gere PDF com sua marca e envie
                  pelo WhatsApp com 1 toque.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
              <BellRing className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">
                  Radar de Retorno (Follow-up Automático)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  O OrçaAI avisa quais clientes você precisa chamar hoje para
                  fechar o serviço antes da concorrência.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
              <MessageCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">
                  Mensagens de Cobrança Gentil no WhatsApp
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clique em &ldquo;Cobrar Retorno&rdquo; e abra o WhatsApp do
                  cliente já com o texto pronto para fechar negócio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>OrçaAI SaaS • Multi-empresa</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Celular e PC
          </span>
        </div>
      </div>

      {/* Coluna de Login / Cadastro */}
      <div className="lg:w-1/2 p-6 sm:p-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Botão de Acesso Rápido Demo */}
          <div className="mb-6 p-4 rounded-2xl bg-blue-600/15 border border-blue-500/30">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Testar Agora (1 Clique)
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Entre com a empresa demonstrativa já populada:
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
              >
                Entrar Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === "login"
                  ? "bg-slate-950 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === "register"
                  ? "bg-slate-950 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cadastrar Empresa
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome da sua Empresa ou Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Silva Elétrica & Ar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Seu WhatsApp Comercial
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ramo / Especialidade
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="Elétrica e Ar-Condicionado">
                        Elétrica / Ar-Condicionado
                      </option>
                      <option value="Pintura e Reforma">Pintura e Reforma</option>
                      <option value="Manutenção Predial / Residencial">
                        Manutenção Geral
                      </option>
                      <option value="Instalações e Segurança">
                        Instalações / CFTV
                      </option>
                      <option value="Prestador de Serviços">Outro</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail de acesso *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@suaempresa.com.br"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition"
            >
              {loading
                ? "Carregando..."
                : mode === "login"
                ? "Entrar no OrçaAI"
                : "Criar Minha Conta Agora"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
