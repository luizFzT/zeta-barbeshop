# Design System - Zeta Barbershop (SaaS)

Este documento foi criado para análise do Google Stitch / IA Externa de Melhorias. O objetivo é apresentar a identidade visual e o design system do "Zeta Barbershop", um SaaS para gestão de fila e pagamentos em tempo real para barbearias, focado em alta conversão e fidelização de clientes.

---

## 🎨 1. Identidade Visual (Conceito Geral)
A identidade é descrita como **"Purple Neon / Futurista"**. 
O app brinca com um visual "Tech" e de "Alto Valor", combinando **Glassmorphism**, bordas sutis com brilhos, e gradientes.
- **Público:** Donos de Barbearias (Modernas, Urbanas, Hip-Hop, Premium) que querem um sistema que pareça "exclusivo" na visão de seus clientes.
- **Sentimentos Mapeados:** Exclusividade, Agilidade, Tecnologia de Ponta (Realtime). 

---

## 🔠 2. Tipografia
Toda a plataforma utiliza fontes modernas e neutras do Google Fonts, criando um contraste excelente entre Títulos e Textos de Interface:
- **Display / Títulos (`var(--font-display)`):** `Space Grotesk` (Pesos: 400, 500, 600, 700). Usada em números da Fila, grandes chamadas (Hero Section) e Valores Financeiros. Transmite um ar ligeiramente "Sci-Fi" ou disruptivo.
- **Body / Textos de Interface (`var(--font-family)`):** `Inter` (Pesos diversos). Usada em botões, descrições, modais e textos normais, garantindo alta legibilidade.

---

## 🌘 3. Tema Padrão: Escuro (Dark Mode)
O modo padrão do App e da Landing Page, projetado para reduzir a fadiga visual e fazer as cores neon brilharem.

### Cores de Fundo (Backgrounds - Dark)
- `--bg-primary` (Fundo Principal): `#0a0a0f` (Um preto levemente azulado/arroxeado).
- `--bg-secondary` (Corpo secundário/Sidebar): `#12121a`.
- `--bg-card` (Cards principais solid): `#1a1a25` / `--bg-card-hover`: `#22223a`.
- `--bg-input`: `#16162a`.

### Glassmorphism (Cartelas translúcidas) 
- Translucidez Padrão: `--bg-glass`: `rgba(255, 255, 255, 0.03)` + `--glass-blur`: `blur(16px)`.
- Hover Padrão: `--bg-glass-hover`: `rgba(255, 255, 255, 0.06)`.
- Bordas de Cartelas: `--glass-border`: `1px solid rgba(255, 255, 255, 0.08)`.

### Cores Neon & Acentos
- `--accent` (Purple Neon Principal): `#a855f7` (Hover: `#9333ea`).
- `--accent-glow`: `rgba(168, 85, 247, 0.4)` (Usado para box-shadows que emitem pulso ou foco).
- `--neon-secondary` (Cyan Complementar): `#22d3ee`. Usado em pequenos detalhes técnicos (tempo expirando, links sutis) para contrastar com o roxo sem brigar por atenção.

---

## ☀️ 4. Tema Alternativo: Claro (Light Mode)
Introduzido para permitir leitura sob a luz do sol, o tema inverte raízes, mas **mantém** o Roxo como Acento.

### Cores de Fundo (Backgrounds - Light)
- `--bg-primary`: `#f8fafc` (Slate bem claro).
- `--bg-secondary`: `#f1f5f9`.
- `--bg-card`: `#ffffff` / `--bg-card-hover`: `#f1f5f9`.

### Glass & Texto e Acentos (Light)
- Textos primários mudam para `#0f172a` e secundários para `#334155`.
- Acentos roxos ficam um pouco mais densos para legibilidade: `--accent: #9333ea` (Hover: `#7e22ce`).
- Sombras: Transitam de 'Emissão de Luz' em painel preto, para `box-shadow` suave e realista (ex: `0 4px 12px rgba(0, 0, 0, 0.08)`).

---

## 🧩 5. Componentes Principais

### Cartões de Interface (Cards / Glass Cards)
Os `.card` e `.glass-card` sempre recebem `border-radius: 12px` (md) ou `16px` (lg). 
Quando têm "Neon", possuem uma pseudo-classe `::before` ou hover state que ilumina a borda e projeta um Glow externo roxo (`var(--shadow-glow)`).

### Botões (`.btn`)
- **Primary:** Gradiente Roxo (Padrão e Hover com shadow neon).
- **Neon:** Botões brilhantes com `--accent-dim` para CTA de alto impacto.
- **Secondary:** Transparentes com fundo `--bg-card` e texto primário, ganhando borda roxa ao passar o mouse.
- **Ghost:** Sem fundo, aparente apenas texto, ganhando destaque suave `--bg-card` no hover.

### Badges de Status (Pill)
Em formato Pílula (arredondado). 
- **Verde (`.badge-success`):** `rgba(34, 197, 94, 0.15)` (Texto/Icon: `#22c55e`) - Serviço concluído ou loja aberta.
- **Vermelho (`.badge-danger`):** Fila fechada ou ação proibida.
- **Cyan (`.badge-cyan` / `.badge-neon`):** Aços em destaque como Avisos/Updates importantes.

### Modais e Formulários
Formulários seguem os inputs escuros (`#16162a`) no Dark mode, ganhando anel de foco `0 0 0 3px var(--accent-light)` - não mudamos a cor de fundo violentamente no `focus`, nós projetamos luz.

---

## ✨ 6. Micro-Interações & Animações
Existem animações CSS declarativa pesadas na UX inicial:
- **Stagger Fade-In:** Itens em Listas (Fila e Serviços) ganham classe `.stagger` e surgem deslizando para cima com `animation-delay` escalonado (+0.05s por item).
- **Float/Scale (`scaleIn` / Float Infinito):** Mockups na Landing page flutuam suavemente para dar vida à apresentação de venda.
- **Pulse Glow:** Status como "Sua Vez" ou contagens críticas pulsam o box-shadow de focado para unfocado 1 vez por segundo.
- **Circular Timer Progress:** O Relógio do cliente tem um SVG `.timer-circle-progress` cuja borda diminui (`stroke-dashoffset`) linearmente conectada ao React state do tempo restante.

---

## 📌 Objetivos da Análise Externa:
Por favor, analise a consistência desta construção para um aplicativo B2B/B2C (O barbeiro usa um Dashboard gerencial; o Consumidor final vê através do seu celular uma Landing Page minimalista de fila).

Traga sugestões visando:
1. Elevar ainda mais o visual para algo digno de aplicativo "AAA" / Fintech moderna.
2. Identificar falta de contrastes potenciais.
3. Possíveis evoluções de animação (Framer-Motion) e hierarquia nas Telas do Smartphone vs Telas de Desktop.
