# 🚀 Road Map: Zeta Barbershop (Próximos Passos)

Este documento descreve as funcionalidades em desenvolvimento e os planos de expansão da Zeta para melhor atender barbeiros e clientes.

---

## 🟢 Em Testes Agora (Beta)
- **Fila Inteligente Online:** Gestão de clientes em tempo real.
- **Display Fotográfico:** Visualização de quem está na cadeira com foto de perfil.
- **PWA (App Instalável):** Instalação direta no celular para acesso rápido.
- **Compartilhamento Dinâmico:** Botão para indicar a Zeta para outros barbeiros.

---

## 🔜 Próxima Grande Atualização: Conexão WhatsApp API

Estamos planejando a integração oficial com a **WhatsApp Cloud API** para automatizar avisos e reduzir faltas.

### 1. Notificação Automática de Vez
O sistema enviará um WhatsApp automático quando faltarem 15 minutos para a vez do cliente ou quando ele for chamado para a cadeira.

### 2. Confirmação "Estou Chegando"
O cliente poderá confirmar presença via um botão no próprio WhatsApp, sincronizando instantaneamente com o seu dashboard.

### 3. Botão de Notificação no Dashboard
O barbeiro terá um botão direto para dar um "cutucão" no cliente via WhatsApp caso ele esteja atrasado.

### 4. Status de Entrega
Você poderá ver no dashboard se o cliente recebeu e se leu a mensagem (✓✓ azul).

---

## 🛠 Como funcionará a implementação técnica
- **Motor:** Supabase Edge Functions (Serverless).
- **Provedor:** Meta Business (WhatsApp Official API).
- **Segurança:** Dados criptografados e conformidade com as regras do Meta.

---
> **"Nosso objetivo é que você se preocupe apenas com o corte. Deixe a gestão da fila e a comunicação com a Zeta."**
