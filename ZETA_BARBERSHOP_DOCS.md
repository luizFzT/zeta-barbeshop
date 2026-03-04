# Zeta Barbershop SaaS — Documentação Completa do Projeto

Este documento serve como um guia abrangente sobre a arquitetura, design, fluxos de usuário e modelos de dados do sistema **Zeta Barbershop**. Ele foi estruturado para fornecer contexto completo para IAs de análise (como o Google NotebookLM) ou para integração de novos desenvolvedores.

---

## 1. Visão Geral do Produto

O **Zeta Barbershop** é uma plataforma SaaS (Software as a Service) focada na resolução do maior problema das barbearias modernas: **o gerenciamento de filas e o tempo de espera dos clientes.**

Diferente de sistemas de agendamento tradicionais (onde o cliente marca uma hora exata, o que frequentemente gera atrasos e janelas vazias), o Zeta opera com uma **Fila Inteligente em Tempo Real**. O cliente entra na fila de onde estiver, o sistema calcula o tempo exato de espera baseado nos serviços escolhidos por todos que estão na frente, e notifica o cliente quando for a hora de se deslocar até a barbearia.

### 1.1 Proposta de Valor
- **Para o Barbeiro:** Otimização do tempo da cadeira, redução drástica de "no-shows" (clientes que faltam) através do sistema de confirmação e tolerância, gestão financeira simplificada e retenção via fidelidade.
- **Para o Cliente:** Fim da espera entediante na recepção da barbearia. Liberdade para fazer outras coisas enquanto acompanha sua posição pelo celular em tempo real.

---

## 2. Stack Tecnológica

O projeto é uma aplicação Single Page Application (SPA) moderna, rápida e responsiva.

- **Frontend Core:** React 19, Vite, React Router DOM.
- **Estilização:** Vanilla CSS com variáveis CSS para um Design System robusto (sem frameworks concorrentes para garantir flexibilidade máxima e estética premium).
- **Backend / BaaS (Planejado/Integrado):** Supabase (PostgreSQL, Auth, Realtime Subscriptions).
- **Notificações:** Web Push API via Service Workers (`sw-notify.js`).
- **QR Code:** `qrcode.react` para geração client-side em SVG e Canvas.

---

## 3. Design System & Estética (Premium Dark Mode)

Para transmitir modernidade, tecnologia e um aspecto "premium", a aplicação utiliza um design system baseado em *Dark Mode* com *Glassmorphism* (efeitos de vidro, desfoque de fundo e bordas translúcidas) e iluminação neon.

### 3.1 Iconografia e Estilo
- **Ícones Base:** Utiliza Google Material Symbols (variante Outlined) para todos os ícones de interface, garantindo consistência visual (ex: ícone de `light_mode` e `dark_mode` padronizados nas navegações).
- **Temas:** A alternância global de temas (Light/Dark) é mantida e sincronizada, refletindo o visual Outline do Material Symbols.

### 3.2 Paleta de Cores
- **Fundo Principal (Background):** `#0a061e` (Um azul marinho quase preto, profundo e sofisticado).
- **Textura Ambiente:** O sistema utiliza um padrão de linhas horizontais sutis (0.03% de opacidade) para preencher o fundo, simbolizando "frequências" e a medição do tempo.
- **Acento Primário Único (Cor da Marca):** `#a855f7` (Roxo Neon / Violeta). Fugimos da estética de gradientes coloridos múltiplos para focar em uma cor de acento sólida e imersiva. Usado em botões principais, ícones de destaque e glow effects.
- **Cards e Superfícies:** `rgba(30, 27, 75, 0.4)` a `0.6` (Roxo escuro translúcido promovendo o efeito glass) protegido por bordas sutis `rgba(168, 85, 247, 0.2)`.
- **Textos:**
  - Primário: `#f8fafc` (Branco gelo para alta legibilidade).
  - Secundário: `#94a3b8` (Cinza azulado escuro para labels e textos auxiliares).
- **Cores Semânticas:**
  - Sucesso/Confirmação: `#22c55e` (Verde vibrante). Fundo de badge: `rgba(34, 197, 94, 0.12)`.
  - Alerta/Pendente: `#f59e0b` (Âmbar/Laranja). Fundo de badge: `rgba(245, 158, 11, 0.12)`.
  - Erro/Perigo: `#ef4444` (Vermelho).

### 3.2 Tipografia e Espaçamento
- Fonte base focada em interfaces limpas (geralmente San Francisco, Inter ou Roboto dependendo do sistema).
- Títulos usam pesos grossos (`fontWeight: 700` ou `800`) e frequentemente aplicam preenchimento em gradiente (`background-clip: text`).
- Sistema de espaçamento baseado em raízes de 4px (`--space-2: 8px`, `--space-4: 16px`, `--space-8: 32px`).
- Arredondamentos exagerados para botões (`--radius-full`) e painéis suaves (`--radius-xl: 16px`).

---

## 4. Arquitetura e Estrutura de Módulos

O frontend é dividido em três áreas principais:

### 4.1 Client Queue Page (Interface do Cliente)
Acessada via URL dinâmica `/queue/:slug` (ex: `/queue/zeta-barbershop`).
- **Função:** Visualização do tempo estimado, seleção de serviços, ingresso na fila (via Google Auth ou como Visitante), acompanhamento de posição e sistema de check-in/confirmação.
- **Elementos Visuais Chave:** Cronômetro gigante de contagem regressiva, lista de pessoas na frente, distintivos de status (Aguardando / Confirmado).

### 4.2 Dashboard Page (Interface do Barbeiro)
Acessada via `/dashboard`. Área restrita contendo múltiplas abas:
- **Fila:** Gestão ativa. Chamar próximo, pular quem não confirmou, remover, adicionar manualmente (com seleção de servicos para refletir tempo correto).
- **Financeiro:** Resumo de faturamento, tickets médios e estimativas baseadas no dia histórico.
- **Fidelidade:** Leitura de estatísticas dos clientes regulares.
- **Estatísticas:** Gráficos de volume e horários de pico.
- **QR Code:** Geração visual do código para a barbearia, com download de mockup pronto para impressão, preview de impressão limpa e botão para copiar link.
- **Configurações:** Edição de dados da loja, gerenciamento dos serviços (nome, tempo, valor) e regras de negócio (Tolerância e Janela de Confirmação).

### 4.3 Storefront Page (Página Pública da Barbearia)
Acessada via `/store/:slug`. Uma Landing Page gerada automaticamente para a barbearia exibir seu portfólio, endereço, serviços oferecidos e direcionar o cliente para a fila.

---

## 5. Modelos de Dados (Entidades)

Estrutura simulada atualmente no Hook `useBarbershop.jsx` e projetada para o banco de dados relacional.

### 5.1 Barbearia (`barbershop`)
- `id`: UUID único.
- `slug`: String para URL (ex: `zeta-barbershop`).
- **Identidade da Barbearia:**
  - `name`: Nome do estabelecimento (ex: Zeta Barbershop).
  - `avatar_url`: URL do logotipo da barbearia.
- **Identidade do Profissional (Modelo Single-Barber):**
  - `barber_name`: Nome ou apelido do único profissional atendendo.
  - `barber_avatar_url`: Foto de perfil do profissional, separada do logo da barbearia para humanizar o atendimento.
- `address`, `phone`: Contato e localização.
- `loyalty_target`: Meta para corte grátis (ex: 10 cortes).
- **Settings:**
  - `tolerance_minutes`: Tempo (em min) que o cliente tem para chegar fisicamente após ser chamado (Posição 1). Padrão: 5.
  - `confirmation_window`: Tempo (em min) antes de ser chamado onde o sistema exige a confirmação do cliente. Padrão: 10.
- **Serviços (`services` array):**
  - Cada serviço possui: `id` (string), `name` (string), `duration_minutes` (inteiro), `price` (decimal).

### 5.2 Entrada na Fila (`queue_entry`)
- `id`: UUID.
- `customer_name`: Nome exibido na interface.
- `customer_id`: ID do usuário logado (opcional, nulo para visitantes).
- `services`: Array de IDs dos serviços escolhidos (usado para somar tempo e prever faturamento).
- `status`: Estado real (`waiting`, `in_progress`, `completed`, `expired`).
- `position`: Ordem calculada e exibida.
- `estimated_time`: Timestamp (ms) de quando ele deve sentar na cadeira.
- **Controle de Confirmação:**
  - `confirmation_status`: Define o estágio (`none` inicial, `pending` pedindo, `confirmed` ok).
  - `confirmation_deadline`: Timestamp exato de quando o cliente será removido automaticamente se não confirmar.

---

## 6. Lógica de Negócio e Workflows Principais

### 6.1 Cálculo Dinâmico de Tempo de Espera e Visualização Proporcional
Quando João entra na fila, o sistema busca todos na frente dele, lê as arrays de `services` de cada um, soma os `duration_minutes` vinculados, e subtrai o tempo que o "Em Atendimento" atual já gastou.

**Visualização Proporcional (The Clock Ring):** Para tangibilizar o tempo, o círculo de contagem não é apenas decorativo. Ele é uma barra de progresso física onde o comprimento da linha roxa diminui proporcionalmente conforme o tempo passa (baseado em um máximo de 300 minutos). O ponto luminoso (dot) acompanha a ponta dessa linha, girando lentamente como um ponteiro de relógio moderno.

**Injeção de Fricção (Buffer Invisível):** Para absorver a realidade física da barbearia (limpar bancada, cobrar cliente, etc.), o sistema injeta de forma invisível um buffer estrutural de **2 a 3 minutos extras** por cliente. O cliente final não vê o detalhe, apenas uma estimativa que entrega o serviço muitas vezes "antes do prazo", gerando surpresa positiva.
**Pausa Estratégica:** Em imprevistos maiores, o Barbeiro aciona um botão de atraso global no painel, adicionando ex. 15 minutos na fila inteira e broadcastando um aviso de "Ajuste em andamento", blindando a reputação do app.

### 6.2 Máquina de Estados: Sistema Anti No-Show (Notificação e Degradação Suave)
Para otimizar o tempo e não gerar brigas no balcão por limitações tecnológicas (falha de web push do celular, modo economia de bateria):
1. **Gatilho de Aviso:** Quando o Tempo Estimado do usuário atinge `≤ 15 minutos`.
2. **Ação:** O frontend tenta emitir Notificação Push e abre Modal de confirmação na tela.
3. **Timer de Decisão:** O status entra em `pending`. O usuário tem uma `confirmation_window` para clicar em "Estou Chegando".
4. **Fallback Multicanal:** Se não confirmar após 3-5 minutos, dispara um webhook via WhatsApp/SMS com link direto para não depender apenas das instáveis notificações web nativas do celular.
5. **Resoluções (Falha Suave):**
   - **Se Confirmar:** Status vai para `confirmed`. 
   - **Se Ignorar:** Em vez de ejetar brutalmente o cliente (`expired`), o backend aplica uma "Degradação Suave". O status vai para `skipped` ou `paused`, empurrando-o 1 ou 2 posições para baixo para dar a vez a quem já confirmou. Evita discussões, retém a venda.

### 6.3 Controle de Tolerância na Cadeira
Quando o barbeiro clica em "Chamar Próximo" (posição passa para 1º):
- O status do cliente fica em foco de chegada.
- Inicia-se um cronômetro na tela do cliente baseado no `tolerance_minutes` do barbeiro (padrão 5 min). Exibindo: "Tempo para Chegar: 04:59".
- Ajuda a balizar os atrasos toleráveis e quando o barbeiro deve passar a vez.

### 6.4 Ecossistema de QR Code
Para facilitar adoção orgânica:
- O painel do barbeiro (`Dashboard -> QR Code`) gera um QRCode.
- Utiliza a biblioteca `qrcode.react` que usa a `Canvas API` criando imagens exportáveis.
- O painel injeta uma borda com branding retroiluminada ao redor do QR e renderiza o nome "Zeta Barbershop" embutido na imagem via script de Download.
- O script injeta uma página isolada `.print()` apenas com o QRCode centralizado para facilitar anexação física em estandes plásticos na bancada.
- **Workflow do Cliente:** Chega na barbearia lotada -> Escaneia o papel no balcão -> Sistema abre `/queue/zeta-barbershop` -> Entra na fila digital -> Vai tomar um café na esquina enquanto o tempo do celular corre.
- O cliente também possui no footer de seu App um botão **"Compartilhar Fila"** gerando ali mesmo um código rápido para o amigo que está vindo, e ensina como instalar o WebApp na Home Screen nativa do OS.

---

## 7. Próximos Passos (Evolução Contínua e Monetização Pós-Fila)
- Concluir integração efetiva das Promises com banco via Supabase (substituindo Mock LocalStorage).
- Dashboards com métricas complexas puxadas por consultas agregadas em SQL.
- **Checkout na Cadeira (Monetização Sem Atrito):** Em vez de usar pagamentos fixos antecipados para guardar vaga (o que colapsa filas dinâmicas em caso de pequenos atrasos via perigo de *chargebacks* no Stripe), a barbearia aplicará pagamentos via carteiras digitais (Apple Pay / Pix) EXATAMENTE no momento em que o status virar `in_progress`. O cliente paga fácil sem fricção enquanto já corta o cabelo, minimizando falhas de estado e aborrecimentos legais de disputa de estorno.
