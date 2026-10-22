"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  MapPin,
  FilePlus2,
  Trash2,
  Phone,
  Edit3,
  X,
} from "lucide-react";
import {
  cleanPhone,
  formatCurrency,
  formatPhoneDisplay,
  STATUS_CONFIG,
} from "@/lib/whatsapp";

interface ClientQuote {
  id: string;
  number: number;
  title: string;
  status: string;
  total: number;
}

interface ClientType {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  quotes: ClientQuote[];
}

export default function ClientsManager({
  initialClients,
}: {
  initialClients: ClientType[];
}) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientType[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  function openNew() {
    setEditingClient(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setShowModal(true);
  }

  function openEdit(c: ClientType) {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setAddress(c.address || "");
    setNotes(c.notes || "");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, address, notes }),
        });
        if (res.ok) {
          const data = await res.json();
          setClients((prev) =>
            prev.map((item) =>
              item.id === editingClient.id
                ? { ...item, ...data.client }
                : item
            )
          );
          setShowModal(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, address, notes }),
        });
        if (res.ok) {
          const data = await res.json();
          setClients((prev) => [{ ...data.client, quotes: [] }, ...prev]);
          setShowModal(false);
          router.refresh();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir este cliente e seus orçamentos?")) {
      return;
    }
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Meus Clientes ({clients.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadastre os clientes que chamaram no WhatsApp e veja o histórico de
            serviços.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nome, WhatsApp ou bairro/endereço..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Lista de Clientes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Adicione seu primeiro cliente clicando no botão acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client) => {
            const zapUrl = `https://wa.me/${cleanPhone(client.phone)}`;
            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {client.name}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {formatPhoneDisplay(client.phone)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(client)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Editar cliente"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {client.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {client.address}
                    </p>
                  )}

                  {client.notes && (
                    <p className="text-xs bg-slate-50 border border-slate-100 text-slate-600 p-2.5 rounded-xl mt-2.5">
                      📝 {client.notes}
                    </p>
                  )}

                  {/* Histórico rápido de orçamentos do cliente */}
                  {client.quotes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase text-slate-400">
                        Orçamentos deste cliente ({client.quotes.length})
                      </span>
                      {client.quotes.slice(0, 2).map((q) => {
                        const st =
                          STATUS_CONFIG[q.status] || STATUS_CONFIG.NEW;
                        return (
                          <Link
                            key={q.id}
                            href={`/orcamentos/${q.id}`}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition"
                          >
                            <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                              #{q.number} {q.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badgeBg}`}
                              >
                                {st.label}
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(q.total)}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={zapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chamar no Zap
                  </a>
                  <Link
                    href={`/orcamentos/novo?clientId=${client.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    Criar Orçamento
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criar / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Cliente / Condomínio / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Carlos (Apto 42)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 11987654321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço / Bairro da Obra
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 120 - Centro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações (horário de preferência, indicação, etc.)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pediu visita na parte da manhã."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  {saving ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
