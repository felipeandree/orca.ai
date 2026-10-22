import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrçaAI — Sistema de Orçamentos e Follow-up no WhatsApp",
  description:
    "Plataforma rápida de orçamentos em PDF, acompanhamento de clientes e lembretes de retorno pelo WhatsApp para prestadores de serviços.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
