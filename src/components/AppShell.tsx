"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  PlusCircle,
  LogOut,
  Sparkles,
  Bell,
  ShieldCheck,
} from "lucide-react";

interface AppShellProps {
  companyName: string;
  companySpecialty?: string;
  pendingFollowUpsCount?: number;
  children: React.ReactNode;
}

export default function AppShell({
  companyName,
  companySpecialty,
  pendingFollowUpsCount = 0,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      href: "/",
      label: "Início & Alertas",
      icon: LayoutDashboard,
      badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined,
    },
    {
      href: "/orcamentos",
      label: "Orçamentos",
      icon: FileText,
    },
    {
      href: "/orcamentos/novo",
      label: "Novo Orçamento",
      icon: PlusCircle,
      highlight: true,
    },
    {
      href: "/clientes",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/configuracoes",
      label: "Minha Empresa",
      icon: Settings,
    },
    {
      href: "/admin",
      label: "Painel SaaS (Admin)",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Top Bar Mobile */}
      <header className="md:hidden no-print sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-base">
              Orça<span className="text-blue-400">AI</span>
            </span>
            <p className="text-[11px] text-slate-300 leading-none truncate max-w-[170px]">
              {companyName}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {pendingFollowUpsCount > 0 && (
            <Link
              href="/"
              className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              {pendingFollowUpsCount} retorno{pendingFollowUpsCount > 1 ? "s" : ""}
            </Link>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex no-print w-64 bg-slate-900 text-white flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen">
        <div>
          <div className="p-5 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight leading-none">
                  Orça<span className="text-blue-400">AI</span>
                </h1>
                <span className="text-[11px] text-slate-400 font-medium">
                  Orçamentos & Follow-up
                </span>
              </div>
            </Link>
          </div>

          <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <p className="text-xs text-slate-400">Empresa conectada</p>
            <p className="font-semibold text-sm text-white truncate">
              {companyName}
            </p>
            {companySpecialty && (
              <p className="text-[11px] text-blue-300 truncate mt-0.5">
                {companySpecialty}
              </p>
            )}
          </div>

          <nav className="mt-5 px-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    (item.href !== "/orcamentos" &&
                      pathname.startsWith(item.href));

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 my-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-800 text-white border-l-4 border-blue-500"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="md:hidden no-print fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg shadow-blue-600/30"
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[11px] font-medium ${
                isActive ? "text-blue-600 font-semibold" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(" ")[0]}</span>
              {item.badge && (
                <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
