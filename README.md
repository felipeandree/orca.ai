# ⚡ OrçaAI — Sistema SaaS de Orçamentos, Follow-up e WhatsApp

Sistema web **Mobile-First** voltado para instaladores, eletricistas, pintores, técnicos de climatização e empresas de manutenção.

## 🚀 Funcionalidades Principais

- **🪄 OrçaAI Mágico (IA/NLP)**: Transforma texto livre ou áudio transcrito do WhatsApp em orçamento completo (separa mão de obra, materiais, quantidades, preços, cliente e desconto).
- **🔔 Radar de Retorno (Follow-up)**: Painel de alertas de orçamentos que vencem hoje ou estão atrasados, com disparo de mensagem gentil de cobrança no WhatsApp em 1 clique.
- **📄 PDF Profissional + Link Público Interativo**: Geração de folha A4 com logo da empresa, Chave PIX Copia e Cola e botão **"Aprovar Orçamento Agora (1 Clique)"** para o cliente.
- **📊 Gestão de Status e Clientes**: Controle de orçamentos (`Novo`, `Enviado`, `Aprovado`, `Concluído`, `Perdido`), edição completa e duplicação rápida.
- **👑 Painel Super Admin SaaS (`/admin`)**: Controle de empresas assinantes, MRR (Receita Recorrente Mensal), taxas de implantação e bloqueio/liberação de acesso.

## 🛠️ Tecnologias

- **Next.js 15 (App Router)** + **React 19** + **TypeScript**
- **Tailwind CSS** + **Lucide Icons**
- **Prisma ORM** + **SQLite** (fácil migração para PostgreSQL/Supabase)
- **Autenticação JWT** (`jose` + `bcryptjs`)

## 💻 Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'JWT_SECRET="orca-ai-secret-key"' >> .env

# 3. Criar banco de dados e popular dados de demonstração
npx prisma db push
npm run db:seed

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.
- **Login Demo**: `contato@silvaeletrica.com.br` | **Senha**: `123456`
